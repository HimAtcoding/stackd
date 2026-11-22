// Spec 24 → Test in a browser: items 1 to 10 and 13 to 15 at 393 × 852 and 320 × 568, and dragging by touch. Run by
// run.mjs (npm run test:e2e).

// The course types the checks name, as their cards show them
const CS1 = "Intro to programming";
const CS1_FULL = "Intro to programming (CS 1)";
const CS2 = "Data structures";

// Set by planSuite from the run
let check, settle, shot, phone, BASE;

export async function planSuite(run) {
  ({ check, settle, shot, base: BASE } = run);
  phone = (width, height) => run.open("/plan/", width, height);
  await mainList();
  for (const [w, h] of [[393, 852], [320, 568]]) await firstBuildAndSheets(w, h);
  await touchDragging();
}

const section = (page, label) => page.locator("section").filter({ has: page.getByRole("heading", { name: label, exact: true }) });
const labelsIn = (page, label) => section(page, label).locator("li .card-tap").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
const allLabels = (page) => page.locator("section li .card-tap").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
const header = (page, label) => section(page, label).locator("p.type-label").first().innerText();
const unitsOf = (text) => Number(text.match(/^([\d.]+)/)?.[1]);
// A card by its own name: first in its label, or right after its code. A warning naming it doesn't match.
const tap = (page, name) => page.locator(`.card-tap[aria-label^="${name}, "], .card-tap[aria-label*=", ${name}, "]`).first();
const card = (page, name) => page.locator("li").filter({ has: tap(page, name) }).first();
const handle = (page, name) => card(page, name).locator("[data-drag-handle]");
const termOf = async (page, name) => {
  for (const t of ["Fall 2026", "Spring 2027", "Summer 2027"]) if ((await section(page, t).locator(`.card-tap[aria-label^="${name}, "], .card-tap[aria-label*=", ${name}, "]`).count()) > 0) return t;
  return "other";
};
const checksLine = (page) => page.getByRole("button", { name: /to check$/ });
const toastShown = (page) => page.getByRole("status").filter({ hasText: /Moved to|Plan built|Course/ }).count();

// Build my plan with nothing marked
async function buildSkipping(page) {
  await page.getByRole("button", { name: "Build my plan" }).click();
  await settle(page, 450);
  await page.getByRole("button", { name: "Skip, build now" }).click();
  await settle(page, 900);
}

async function mouseDrag(page, from, to) {
  await from.scrollIntoViewIfNeeded();
  const a = await from.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 10, { steps: 4 });
  for (let i = 0; i < 12; i++) {
    const b = await to.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + 8, { steps: 3 });
    await settle(page, 60);
  }
  await page.mouse.up();
  await settle(page, 500);
}

// Items 1 to 10, at 393
async function mainList() {
  const { state, context, page } = await phone(393, 852);

  const tabs = await page.getByRole("navigation", { name: "Main" }).getByRole("link").allInnerTexts();
  check("1. five tabs with Plan between Home and Explore", tabs.join() === "Home,Plan,Explore,Essays,You", tabs);
  await shot(page, "393-01-empty");

  await buildSkipping(page);
  const fall = await labelsIn(page, "Fall 2026");
  const spring = await labelsIn(page, "Spring 2027");
  check("2. fall 2026 holds the taking-now course", fall.some((l) => l.startsWith("Discrete math") && l.endsWith("taking now")), fall);
  check("2. both terms within 15 units", unitsOf(await header(page, "Fall 2026")) <= 15 && unitsOf(await header(page, "Spring 2027")) <= 15);
  const both = (l) => l.includes("Counts for UC and Cal State");
  check("2. courses that count for both come first in fall", fall.findIndex((l) => !both(l)) === -1 || fall.findIndex((l) => !both(l)) > fall.findLastIndex(both), fall);
  check("2. no order warnings after a build", (await checksLine(page).count()) === 0);
  check("2. the rest is in Not in a term yet, with the Doesn't fit line", (await labelsIn(page, /^Not in a term yet/)).length > 0 && (await page.getByText(/don't fit before fall 2027\./).count()) === 1);
  await shot(page, "393-02-built");

  for (const label of [...fall, ...spring]) {
    await page.locator(`.card-tap[aria-label="${label}"]`).click();
    await settle(page, 450);
    const reasons = await page.getByRole("dialog").locator("ul").first().locator("li").allInnerTexts();
    check(`3. reasons for ${label.split(", ").slice(0, 2).join(", ")}`, reasons.length >= 1 && reasons.length <= 3, reasons);
    if (label.includes(`, ${CS1}, `)) await shot(page, "393-03-course-sheet");
    await page.keyboard.press("Escape");
    await settle(page, 350);
  }

  check("4. after the build, Intro to programming is in fall and Data structures in spring", (await termOf(page, CS1)) === "Fall 2026" && (await termOf(page, CS2)) === "Spring 2027");
  const fallBefore = unitsOf(await header(page, "Fall 2026"));
  const springBefore = unitsOf(await header(page, "Spring 2027"));
  await mouseDrag(page, handle(page, CS2), card(page, CS1));
  const warned = (await labelsIn(page, "Fall 2026")).find((l) => l.includes(`, ${CS2}, `));
  check("4. dragging Data structures above Intro to programming moves it to fall", Boolean(warned), await labelsIn(page, "Fall 2026"));
  check("4. …with the order warning, naming the course in full", warned?.includes(`Take ${CS1_FULL} first (Fall 2026)`), warned);
  check("4. both unit totals changed", unitsOf(await header(page, "Fall 2026")) > fallBefore && unitsOf(await header(page, "Spring 2027")) < springBefore);
  check("4. the things-to-check line counts it", (await checksLine(page).count()) === 1);
  await checksLine(page).click();
  await settle(page, 700);
  await shot(page, "393-04-order-warning");
  const saved = state.tables.plan_items.find((i) => i.topic === "cs2");
  check("4. the move saved to the account", saved?.term === "fall-2026" && saved?.placed_by === "student", saved);
  await page.evaluate(() => {
    localStorage.removeItem("stackd.coursePlan");
    localStorage.removeItem("stackd.coursePlanQueue");
  });
  await page.reload({ waitUntil: "networkidle" });
  await settle(page, 1500);
  check("4. a reload, with this phone's copy cleared, keeps it", (await termOf(page, CS2)) === "Fall 2026");
  await mouseDrag(page, handle(page, CS2), section(page, "Spring 2027").locator("li").first());
  check("4. moving it back clears the warning", (await termOf(page, CS2)) === "Spring 2027" && (await checksLine(page).count()) === 0);

  const target = (await labelsIn(page, "Spring 2027"))[0].split(", ").slice(0, 2).join(", ");
  await page.locator(`.card-tap[aria-label^="${target}"]`).click();
  await settle(page, 450);
  await page.getByRole("button", { name: "Move to…" }).click();
  await settle(page, 300);
  await shot(page, "393-05-move-to");
  await page.getByRole("radio", { name: "Not in a term yet" }).click();
  await settle(page, 600);
  check("5. Move to… moves it and closes the sheet", (await page.getByRole("dialog").count()) === 0 && (await labelsIn(page, /^Not in a term yet/)).some((l) => l.startsWith(target)));
  check("5. the toast names the place", (await page.getByRole("status").filter({ hasText: "Moved to Not in a term yet" }).count()) === 1);
  await page.getByRole("button", { name: "Undo" }).click();
  await settle(page, 400);
  check("5. Undo puts it back", (await labelsIn(page, "Spring 2027")).some((l) => l.startsWith(target)));

  const kb = (await labelsIn(page, "Spring 2027"))[0];
  const kbName = kb.split(", ")[0] === "CS 2" ? CS2 : kb.split(", ")[0];
  await handle(page, kbName).focus();
  await page.keyboard.press("Space");
  await settle(page, 200);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("ArrowUp");
    await settle(page, 150);
  }
  await page.keyboard.press("Space");
  await settle(page, 600);
  const live = await page.locator("[id^=DndLiveRegion]").innerText().catch(() => "");
  check("6. Space, arrows and Space move a card, and the live region says where", /moved to Fall 2026/.test(live) && (await termOf(page, kbName)) === "Fall 2026", { live });
  const describedBy = await handle(page, kbName).getAttribute("aria-describedby");
  check("6. the handle has the keyboard instructions", Boolean(describedBy) && (await page.locator(`#${describedBy}`).innerText()).includes("press Space"));
  const cs1Label = (await labelsIn(page, "Fall 2026")).find((l) => l.includes(`, ${CS1}, `));
  check("6. VoiceOver reads a card's code, name, units and line 2", cs1Label?.startsWith(`CS 1, ${CS1}, 4 units, Counts for UC and Cal State`), cs1Label);
  const cs2Label = (await labelsIn(page, "Fall 2026")).find((l) => l.includes(`, ${CS2}, `));
  check("6. …and a warning", kbName !== CS2 || cs2Label?.includes(`Take ${CS1_FULL} first`), cs2Label);

  await tap(page, CS1).click();
  await settle(page, 450);
  await page.getByRole("radio", { name: "Done" }).click();
  await settle(page, 600);
  await page.keyboard.press("Escape");
  await settle(page, 400);
  check("7. done leaves the terms for Already done", (await page.getByRole("button", { name: /^Already done \(1\)/ }).count()) === 1 && (await termOf(page, CS1)) === "other");
  check("7. saved to user_topic_status", state.tables.user_topic_status.some((r) => r.topic === "cs1" && r.status === "done"));
  await page.goto(`${BASE}/explore/major/?slug=computer-science&tab=uc`, { waitUntil: "networkidle" });
  await settle(page, 2000);
  check("7. Explore shows it done", (await page.getByRole("checkbox", { name: /^Intro to programming/ }).first().getAttribute("aria-checked")) === "true");
  const multi = page.getByRole("checkbox", { name: /^Multivariable calculus/ }).first();
  for (let i = 0; i < 2 && (await multi.getAttribute("aria-checked")) !== "true"; i++) {
    await multi.click();
    await settle(page, 300);
  }
  await page.goto(`${BASE}/plan/`, { waitUntil: "networkidle" });
  await settle(page, 1500);
  await page.getByRole("button", { name: /^Already done/ }).click();
  await settle(page, 400);
  const doneRows = await page.locator("section[aria-label='Already done'] li").allInnerTexts();
  check("7. done in Explore shows done in Plan", doneRows.some((t) => t.includes("Multivariable calculus")), doneRows);

  const studentPlaced = state.tables.plan_items.filter((i) => i.placed_by === "student").map((i) => [i.topic ?? i.ge_area, i.term]);
  await page.getByRole("button", { name: "Rebuild plan" }).click();
  await settle(page, 450);
  await shot(page, "393-06-rebuild-confirm");
  await page.getByRole("button", { name: "Rebuild", exact: true }).click();
  await settle(page, 700);
  check("8. a rebuild keeps what the student placed", studentPlaced.every(([k, t]) => state.tables.plan_items.some((i) => (i.topic ?? i.ge_area) === k && i.term === t)), studentPlaced);
  check("8. …taking now", (await labelsIn(page, "Fall 2026")).some((l) => l.startsWith("Discrete math") && l.endsWith("taking now")));
  check("8. …and done", (await page.getByRole("button", { name: /^Already done \(2\)/ }).count()) === 1);

  const left = () => page.locator(".type-label", { hasText: /courses? left/ }).innerText();
  const leftBefore = await left();
  const add = async (name, units) => {
    await page.getByRole("button", { name: "Add a course to Spring 2027" }).click();
    await settle(page, 400);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Units").fill(String(units));
    await dialog.getByRole("button", { name: "Add course" }).click();
    await settle(page, 500);
  };
  await add("Made-up elective", 16 - unitsOf(await header(page, "Spring 2027")));
  const h16 = await header(page, "Spring 2027");
  check("10. a custom course counts toward the term's units", unitsOf(h16) === 16, h16);
  check("10. …and never toward courses left", (await left()) === leftBefore);
  check("9. 16 units: over your limit", h16 === "16 units, over your limit", h16);
  await add("Made-up lab", 3);
  const h19 = await header(page, "Spring 2027");
  check("9. 19 units: most colleges need approval", h19 === "19 units. Most colleges need approval above 18", h19);
  await section(page, "Spring 2027").scrollIntoViewIfNeeded();
  await shot(page, "393-07-over-18");
  await tap(page, "Made-up lab").click();
  await settle(page, 450);
  await page.getByRole("button", { name: "Remove from plan" }).click();
  await settle(page, 500);
  check("10. a custom course can be removed", state.tables.plan_items.filter((i) => i.kind === "custom").length === 1);

  await page.getByRole("button", { name: "Units and terms" }).click();
  await settle(page, 450);
  await shot(page, "393-08-settings");
  await page.getByRole("switch", { name: "Include summer terms" }).click();
  await settle(page, 300);
  await page.keyboard.press("Escape");
  await settle(page, 400);
  await page.getByRole("button", { name: "Rebuild plan" }).click();
  await settle(page, 400);
  await page.getByRole("button", { name: "Rebuild", exact: true }).click();
  await settle(page, 700);
  check("2. with summers on, a rebuild uses Summer 2027", (await labelsIn(page, "Summer 2027")).length > 0);
  check("2. the setting is saved", state.tables.plan_settings[0]?.include_summer === true);

  const ge = (await allLabels(page)).find((l) => l.includes("Cal-GETC Area 3A"));
  check("your course: the Cal-GETC 3A card is in the plan", Boolean(ge));
  await page.locator(`.card-tap[aria-label="${ge}"]`).click();
  await settle(page, 450);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Course code").fill("arth 1");
  await dialog.getByLabel("Units", { exact: true }).fill("3");
  await dialog.getByRole("button", { name: "Save course" }).click();
  await settle(page, 600);
  check("your course: a typed code is saved as a suggestion", state.tables.course_suggestions.some((s) => s.course_code === "ARTH 1" && s.ge_area === "3A" && Number(s.units) === 3), state.tables.course_suggestions);
  await page.keyboard.press("Escape");
  await settle(page, 500);
  check("your course: …and shows on the card", (await page.locator(`.card-tap[aria-label^="ARTH 1, "]`).count()) === 1);
  await context.close();
}

// Items 13 to 15, and the screens at both sizes
async function firstBuildAndSheets(width, height) {
  const tag = String(width);
  {
    const { state, context, page } = await phone(width, height);
    await page.getByRole("button", { name: "Build my plan" }).click();
    await settle(page, 500);
    const dialog = page.getByRole("dialog");
    check(`${tag} 13. Build my plan opens What have you already finished?`, (await dialog.getByRole("heading", { name: "What have you already finished?" }).count()) === 1);
    check(`${tag} 13. it lists the 21 courses and areas`, (await dialog.getByRole("checkbox").count()) === 21);
    await shot(page, `${tag}-a-finished-sheet`);
    await dialog.getByRole("checkbox", { name: /^Intro to programming/ }).click();
    await dialog.getByRole("checkbox", { name: /^English Composition/ }).click();
    await dialog.getByLabel("Units you've finished").fill("12");
    await dialog.locator(".overflow-y-auto").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await settle(page, 300);
    await shot(page, `${tag}-b-finished-sheet-bottom`);
    await dialog.getByRole("button", { name: "Build my plan" }).click();
    await settle(page, 900);
    const placed = await allLabels(page);
    check(`${tag} 13. both are left out of the terms`, !placed.some((l) => l.includes(`, ${CS1}, `) || l.includes("English Composition")), placed);
    check(`${tag} 13. the hero shows 12 of 60`, (await page.getByText("12 of 60 units").count()) === 1);
    await page.getByRole("button", { name: /^Already done \(2\)/ }).click();
    await settle(page, 400);
    const done = await page.locator("section[aria-label='Already done'] li").allInnerTexts();
    check(`${tag} 13. both are in Already done`, done.some((t) => t.includes(CS1)) && done.some((t) => t.includes("English Composition")), done);
    check(`${tag} 13. saved: the topic done, the area a done item, the units in settings`,
      state.tables.user_topic_status.some((r) => r.topic === "cs1" && r.status === "done") &&
        state.tables.plan_items.some((i) => i.ge_area === "1A" && i.status === "done") && Number(state.tables.plan_settings[0]?.units_done) === 12);
    await page.goto(`${BASE}/explore/major/?slug=computer-science&tab=uc`, { waitUntil: "networkidle" });
    await settle(page, 1800);
    check(`${tag} 13. Explore shows Intro to programming done`, (await page.getByRole("checkbox", { name: /^Intro to programming/ }).first().getAttribute("aria-checked")) === "true");
    await context.close();
  }
  {
    const { state, context, page } = await phone(width, height);
    const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
    const tabs = await page.getByRole("navigation", { name: "Main" }).getByRole("link").evaluateAll((els) => els.map((e) => ({ w: e.getBoundingClientRect().width, sw: e.scrollWidth })));
    check(`${tag} 1. five tabs fit`, nav.width <= width - 32 && tabs.every((t) => t.sw <= t.w + 0.5), { nav, tabs });
    await buildSkipping(page);
    check(`${tag} no sideways scroll`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    check(`${tag} 14. Skip builds with nothing marked`, state.tables.user_topic_status.length === 1 && !state.tables.plan_items.some((i) => i.status === "done"));
    const all = await allLabels(page);
    check(`${tag} 14. Intro to programming shows CS 1 once and 4 units`, all.some((l) => l.startsWith(`CS 1, ${CS1}, 4 units`)), all.find((l) => l.includes(CS1)));
    check(`${tag} 14. the card's text has the code once`, ((await tap(page, CS1).innerText()).match(/CS 1/g) ?? []).length === 1);
    check(`${tag} 14. Calculus, with two Las Positas courses, is about 8 units`, all.some((l) => l.startsWith("Calculus, a full year, about 8 units")));
    const fall = await labelsIn(page, "Fall 2026");
    const sum = fall.reduce((n, l) => n + Number(l.match(/(\d+(?:\.\d+)?) units?/)[1]), 0);
    check(`${tag} 14. the builder counts those units`, unitsOf(await header(page, "Fall 2026")) === sum && sum <= 15, { sum, fall });
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page, 4500);
    await shot(page, `${tag}-c-card-list`);
    await shot(page, `${tag}-d-card-list-full`, true);
    await tap(page, CS1).click();
    await settle(page, 500);
    const dialog = page.getByRole("dialog");
    check(`${tag} 14. the sheet's title reads Intro to programming, with CS 1 under it`,
      (await dialog.getByRole("heading", { level: 2 }).innerText()) === CS1 && (await dialog.locator("p.type-code").innerText()) === "CS 1");
    check(`${tag} 14. the sheet shows CS 1 chosen`, (await dialog.getByRole("radio", { name: /CS 1/ }).getAttribute("aria-checked")) === "true");
    check(`${tag} 14. another card's name stays full in a reason`, (await dialog.locator("ul").first().locator("li").allInnerTexts()).includes("Needed before Data structures (CS 2)"));
    await shot(page, `${tag}-e-course-sheet`);
    await page.getByRole("button", { name: "Move to…" }).click();
    await settle(page, 300);
    await page.getByRole("radio", { name: "Not in a term yet" }).click();
    await settle(page, 80);
    check(`${tag} 15. no toast while the sheet is still closing`, (await toastShown(page)) === 0);
    await settle(page, 450);
    check(`${tag} 15. the toast shows once it has closed`, (await toastShown(page)) === 1);
    await page.locator(".card-tap").first().click();
    await settle(page, 400);
    check(`${tag} 15. opening a sheet hides the toast`, (await page.getByRole("dialog").count()) === 1 && (await toastShown(page)) === 0);
    await page.keyboard.press("Escape");
    await settle(page, 500);
    check(`${tag} 15. …and it comes back with its Undo after`, (await page.getByRole("button", { name: "Undo" }).count()) === 1);
    await context.close();
  }
}

// Dragging with a finger, through real touch events: a long press on the body, a quick swipe, and the handle
async function touchDragging() {
  const { state, context, page } = await phone(393, 852);
  const cdp = await context.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await buildSkipping(page);
  const termOfTopic = (topic) => state.tables.plan_items.find((i) => i.topic === topic)?.term;
  const center = async (loc) => {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, top: b.y };
  };
  async function drag(from, toTop, holdMs) {
    await settle(page, 100);
    await touch("touchStart", from.x, from.y);
    await page.waitForTimeout(holdMs);
    for (let i = 1; i <= 12; i++) {
      await touch("touchMove", from.x, from.y + ((toTop + 10 - from.y) * i) / 12);
      await page.waitForTimeout(40);
    }
    await settle(page, 300);
    await touch("touchEnd");
    await settle(page, 600);
  }

  let from = await center(tap(page, "Computer organization"));
  let to = await center(tap(page, CS1));
  await drag(from, to.top, 420);
  check("touch: a long press on the card body picks it up and moves it", termOfTopic("comp-org") === "fall-2026", termOfTopic("comp-org"));
  check("touch: …and the sheet doesn't open on release", (await page.getByRole("dialog").count()) === 0);
  from = await center(tap(page, CS2));
  to = await center(tap(page, CS1));
  await drag(from, to.top, 0);
  check("touch: a quick swipe on the body doesn't move the card", termOfTopic("cs2") === "spring-2027", termOfTopic("cs2"));
  await tap(page, "Calculus, a full year").scrollIntoViewIfNeeded();
  const h = await handle(page, CS2).boundingBox();
  const t = await tap(page, "Calculus, a full year").boundingBox();
  await drag({ x: h.x + h.width / 2, y: h.y + h.height / 2 }, t.y, 0);
  check("touch: the handle picks it up at once", termOfTopic("cs2") === "fall-2026", termOfTopic("cs2"));
  await context.close();
}
