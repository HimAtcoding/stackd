// Home (02, 15, 18, 23): the greeting and route, Up next, Get ready, and Home without a plan. The dates are the real
// ones, so the checks compare Home with the Deadlines screen instead of fixing a day.

export async function homeSuite(run) {
  const { check, settle, shot, open, fitsWidth } = run;

  for (const [w, h] of [[393, 852], [320, 568]]) {
    const tag = `home ${w}`;
    const { state, context, page } = await open("/", w, h);
    await shot(page, `home-${w}`);
    await fitsWidth(page, w, tag);

    check(`${tag}: greets the student by name`, (await page.getByRole("heading", { level: 1 }).innerText()) === "Hi, Sam!");
    const route = await page.getByText(/^Las Positas College to UC San Diego/).first().innerText().catch(() => "");
    check(`${tag}: the route names the college, the first school and the rest`, /and 1 more/.test(route), route);
    const tabs = await page.getByRole("navigation", { name: "Main" }).getByRole("link").allInnerTexts();
    check(`${tag}: the tab bar`, ["Home", "Explore", "Essays", "You"].every((t) => tabs.includes(t)) && tabs[0] === "Home", tabs);

    // Up next: the same date the Deadlines screen calls next
    const hero = page.getByText("Up next").locator("xpath=..");
    const heroText = await hero.innerText();
    const next = heroText.match(/\n([^\n]+), due ([A-Z][a-z]{2} \d{1,2})/);
    check(`${tag}: Up next shows a date with its count`, Boolean(next) && /days? left|Due today/.test(heroText), heroText);
    await page.getByRole("button", { name: "Keep going" }).click();
    await settle(page, 500);
    check(`${tag}: Keep going opens the next step or the date`, (await page.getByRole("dialog").count()) === 1);
    await page.keyboard.press("Escape");
    await settle(page, 400);

    // Get ready: the plan checks "Pick your campuses and majors"; checking a step counts it, saves it, and Undo takes it back
    const count = () => page.getByText(/^\d of \d+ done$/).first().innerText();
    const before = await count();
    const [doneBefore, total] = before.match(/\d+/g).map(Number);
    const fromPlan = page.getByRole("checkbox", { name: "Pick your campuses and majors" });
    check(`${tag}: the plan checks "Pick your campuses and majors"`, (await fromPlan.getAttribute("aria-checked")) === "true");
    const step = page.getByRole("checkbox", { name: "Enter your courses and grades" });
    await step.click();
    await settle(page, 600);
    check(`${tag}: checking a step counts it`, (await count()) === `${doneBefore + 1} of ${total} done` && (await step.getAttribute("aria-checked")) === "true", await count());
    check(`${tag}: …and saves it to the account`, state.tables.user_checklist_steps.length === 1, state.tables.user_checklist_steps);
    await page.getByRole("button", { name: "Undo" }).click();
    await settle(page, 600);
    check(`${tag}: Undo takes it back`, (await count()) === before && (await step.getAttribute("aria-checked")) === "false", await count());

    await page.getByRole("link", { name: "All deadlines" }).click();
    await page.waitForURL("**/deadlines/");
    await settle(page, 1500);
    const deadlinesNext = await page.getByText(/ is next$/).first().innerText().catch(() => "");
    check(`${tag}: Up next is the date Deadlines calls next`, Boolean(next) && deadlinesNext === `${next[1]} is next`, { home: next?.[1], deadlines: deadlinesNext });
    await context.close();
  }

  // No plan yet: the setup card leads and there's no Get ready
  {
    const { context, page } = await open("/", 393, 852, { noPlan: true });
    await shot(page, "home-no-plan");
    check("home, no plan: the setup card", (await page.getByRole("heading", { name: "No plan yet" }).count()) === 1 && (await page.getByText("Set up your plan").count()) >= 1);
    check("home, no plan: no Get ready", (await page.getByRole("heading", { name: /^Get your .* ready$/ }).count()) === 0);
    await context.close();
  }
}
