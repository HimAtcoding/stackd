"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardSensorOptions,
  type PointerSensorOptions,
  type TouchSensorOptions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useReducedMotion } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Pill } from "@/components/ui/pill";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { cn } from "@/lib/cn";
import type { TermId } from "@/lib/plan/build";
import type { Card, PlanView } from "@/lib/plan/view";
import { CourseCard } from "./course-card";

// Not in a term yet, as a drop target
export const NONE = "none";

const isHandle = (target: EventTarget | null) => target instanceof Element && target.closest("[data-drag-handle]") !== null;

// The handle picks a card up at once with a finger; anywhere else on the card takes a 300 ms long press (24 → 2).
// dnd-kit keeps one listener per event name, so the handle listens for pointer events and the long press for touch.
class HandleTouchSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: (event: React.PointerEvent, options: PointerSensorOptions) =>
        event.nativeEvent.pointerType !== "mouse" && isHandle(event.nativeEvent.target) && PointerSensor.activators[0].handler(event, options),
    },
  ];
}
class CardTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: (event: React.TouchEvent, options: TouchSensorOptions) => !isHandle(event.nativeEvent.target) && TouchSensor.activators[0].handler(event, options),
    },
  ];
}
// Only the handle answers Space, so Space on the card still opens its sheet
class HandleKeyboardSensor extends KeyboardSensor {
  static activators = [
    {
      eventName: "onKeyDown" as const,
      handler: (event: React.KeyboardEvent, options: KeyboardSensorOptions, context: Parameters<(typeof KeyboardSensor.activators)[0]["handler"]>[2]) =>
        isHandle(event.nativeEvent.target) && KeyboardSensor.activators[0].handler(event, options, context),
    },
  ];
}

type Lists = Record<string, string[]>;

function listsOf(view: PlanView): Lists {
  const lists: Lists = Object.fromEntries(view.terms.map((t) => [t.id, t.cards.map((c) => c.key)]));
  lists[NONE] = view.unplaced.map((c) => c.key);
  return lists;
}

const findList = (lists: Lists, id: UniqueIdentifier) => (String(id) in lists ? String(id) : Object.keys(lists).find((k) => lists[k].includes(String(id))));

type PlanBoardProps = {
  view: PlanView;
  onOpen: (card: Card) => void;
  // A drop: the card goes to `to` (null: Not in a term yet), before the card with key `before`, or at the end
  onMove: (card: Card, to: TermId | null, before: string | null) => void;
  onAdd: (term: TermId) => void;
};

function SortableCard({ card, onOpen, still }: { card: Card; onOpen: (card: Card) => void; still: boolean }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: card.key });
  return (
    <li id={`check-${card.key}`} className="scroll-mt-24">
      <CourseCard
        ref={setNodeRef}
        card={card}
        onOpen={() => onOpen(card)}
        placeholder={isDragging}
        {...listeners}
        handleProps={{ ref: setActivatorNodeRef, ...attributes, tabIndex: 0, "aria-roledescription": "draggable course" }}
        style={{ transform: CSS.Translate.toString(transform), transition: still ? undefined : transition }}
      />
    </li>
  );
}

function Section({ id, title, aside, empty, children, footer }: { id: string; title: ReactNode; aside?: ReactNode; empty: boolean; children: ReactNode; footer?: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section id={`check-${id}`} aria-labelledby={`term-${id}-title`} className="mt-8 scroll-mt-24 px-4">
      <div className="flex min-h-7 items-center gap-2 px-2">{title}{aside}</div>
      <div ref={setNodeRef} className={cn("mt-3 rounded-lg transition-colors duration-120", isOver && empty && "bg-surface-pressed")}>
        {empty ? (
          <p className="px-2 py-3 text-slate-600 type-body">Nothing here yet. Drag a course in or tap Move on one.</p>
        ) : (
          <ul className="flex flex-col gap-3 pb-1">{children}</ul>
        )}
      </div>
      {footer}
    </section>
  );
}

// The plan's terms and Not in a term yet, with dragging between them (24 → 1, 2). Others make room while a card moves;
// the drop saves at once. Under reduced motion there's no lift and no animated reflow, just the move.
export function PlanBoard({ view, onOpen, onMove, onAdd }: PlanBoardProps) {
  const still = Boolean(useReducedMotion());
  const fromView = useMemo(() => listsOf(view), [view]);
  // The view is the truth; while a card is dragged, these lists show where it would land
  const [dragLists, setDragLists] = useState<Lists | null>(null);
  const lists = dragLists ?? fromView;
  const [active, setActive] = useState<Card | null>(null);
  const listsRef = useRef(lists);
  const startedIn = useRef<string | null>(null);
  // A long press that ends without moving still sends a tap: it doesn't open the sheet
  const justDropped = useRef(0);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(HandleTouchSensor, { activationConstraint: { distance: 4 } }),
    useSensor(CardTouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(HandleKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const nameOf = (id: UniqueIdentifier) => view.cardsByKey.get(String(id))?.name ?? "Course";
  const listName = (list: string | undefined) => (list === NONE ? "Not in a term yet" : (view.terms.find((t) => t.id === list)?.label ?? ""));

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${nameOf(a.id)}, in ${listName(findList(listsRef.current, a.id))}.`,
    onDragOver: ({ active: a, over }) => (over ? `${nameOf(a.id)}, over ${listName(findList(listsRef.current, over.id))}.` : undefined),
    onDragEnd: ({ active: a, over }) => (over ? `${nameOf(a.id)}, moved to ${listName(findList(listsRef.current, over.id))}.` : `${nameOf(a.id)}, put back.`),
    onDragCancel: ({ active: a }) => `${nameOf(a.id)}, put back in ${listName(startedIn.current ?? undefined)}.`,
  };

  function onDragStart({ active: a }: DragStartEvent) {
    startedIn.current = findList(lists, a.id) ?? null;
    setDragLists(fromView);
    setActive(view.cardsByKey.get(String(a.id)) ?? null);
  }

  // Into another list as it moves, so that list makes room
  function onDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    setDragLists((before) => {
      const prev = before ?? fromView;
      const from = findList(prev, a.id);
      const to = findList(prev, over.id);
      if (!from || !to || from === to) return prev;
      const target = prev[to].filter((k) => k !== a.id);
      const at = to === String(over.id) ? target.length : Math.max(0, target.indexOf(String(over.id)));
      target.splice(at, 0, String(a.id));
      return { ...prev, [from]: prev[from].filter((k) => k !== a.id), [to]: target };
    });
  }

  function onDragEnd({ active: a, over }: DragEndEvent) {
    justDropped.current = Date.now();
    const card = view.cardsByKey.get(String(a.id));
    setActive(null);
    const to = over ? findList(lists, over.id) : undefined;
    setDragLists(null);
    if (!card || !to || !over) return;
    let list = lists[to];
    const from = list.indexOf(String(a.id));
    const overAt = list.indexOf(String(over.id));
    if (from >= 0 && overAt >= 0 && from !== overAt) list = arrayMove(list, from, overAt);
    const at = list.indexOf(String(a.id));
    const before = list[at + 1] ?? null;
    const was = fromView[startedIn.current ?? ""] ?? [];
    if (startedIn.current === to && was.indexOf(String(a.id)) === at) return;
    onMove(card, to === NONE ? null : (to as TermId), before);
  }

  const open = (card: Card) => {
    if (Date.now() - justDropped.current > 400) onOpen(card);
  };

  const cardsIn = (list: string) => (lists[list] ?? []).flatMap((k) => view.cardsByKey.get(k) ?? []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null);
        setDragLists(null);
      }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "To move a course, press Space. Use the arrow keys to move it between terms, then press Space to drop it, or Escape to put it back.",
        },
      }}
    >
      {view.terms.map((t) => {
        const cards = cardsIn(t.id);
        return (
          <Section
            key={t.id}
            id={t.id}
            empty={cards.length === 0}
            title={
              <h2 id={`term-${t.id}-title`} className={cn("text-navy-900 type-title-3", t.now && "text-blue-600")}>
                {t.label}
              </h2>
            }
            aside={
              <>
                {t.now && <Pill variant="good">Now</Pill>}
                <p className={cn("ml-auto text-right tabular-nums type-label", t.header.over ? "text-coral-700" : "text-slate-600")}>{t.header.text}</p>
              </>
            }
            footer={
              <SecondaryButton hug icon={<PlusIcon weight="bold" size={20} aria-hidden />} onClick={() => onAdd(t.id)} className="mt-3" aria-label={`Add a course to ${t.label}`}>
                Add a course
              </SecondaryButton>
            }
          >
            <SortableContext items={lists[t.id] ?? []} strategy={verticalListSortingStrategy}>
              {cards.map((c) => (
                <SortableCard key={c.key} card={c} onOpen={open} still={still} />
              ))}
            </SortableContext>
          </Section>
        );
      })}
      {(cardsIn(NONE).length > 0 || active) && (
        <Section
          id={NONE}
          empty={cardsIn(NONE).length === 0}
          title={
            <h2 id={`term-${NONE}-title`} className="text-navy-900 type-title-3">
              Not in a term yet ({cardsIn(NONE).length})
            </h2>
          }
        >
          <SortableContext items={lists[NONE] ?? []} strategy={verticalListSortingStrategy}>
            {cardsIn(NONE).map((c) => (
              <SortableCard key={c.key} card={c} onOpen={open} still={still} />
            ))}
          </SortableContext>
        </Section>
      )}
      <DragOverlay
        dropAnimation={still ? null : { duration: 200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } }) }}
      >
        {active ? <CourseCard card={active} lifted={!still} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
