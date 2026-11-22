// Explore (21, 22): the hub with the student's major, Still needed and the majors list, search, and the major page with
// its course statuses on both tabs. Computer Science comes from the real project; Discrete math starts as taking now.

const MAJOR = "/explore/major/?slug=computer-science&tab=uc";

export async function exploreSuite(run) {
  const { check, settle, shot, open, fitsWidth } = run;

  for (const [w, h] of [[393, 852], [320, 568]]) {
    const tag = `explore ${w}`;
    const { context, page } = await open("/explore/", w, h);
    await shot(page, `explore-${w}`);
    await fitsWidth(page, w, tag);

    const panel = page.getByRole("link", { name: /^Your major, Computer Science\./ });
    check(`${tag}: the panel shows the student's major and progress`, (await panel.getAttribute("aria-label"))?.includes("0 of 9 done for UC, 1 taking now"), await panel.getAttribute("aria-label"));
    const still = await page.locator("section", { has: page.getByRole("heading", { name: "Still needed" }) }).getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    check(`${tag}: Still needed puts taking now first, then the next course`, still[0]?.startsWith("Discrete math, taking now") && still[1]?.includes(", next"), still);
    check(`${tag}: See all 9 opens the major`, (await page.getByRole("link", { name: "See all 9" }).getAttribute("href"))?.includes("slug=computer-science"));
    check(`${tag}: the majors list has Computer Science with its progress`, (await page.getByRole("link", { name: /^Computer Science.*0 of 9 for UC/ }).count()) === 1);
    check(`${tag}: How we check this`, (await page.getByRole("link", { name: "How we check this" }).getAttribute("href")) === "/about/data/");

    const search = page.getByRole("searchbox").or(page.getByPlaceholder("Search majors")).first();
    await search.fill("cs");
    await settle(page, 400);
    check(`${tag}: "cs" finds Computer Science and hides the panel`, (await page.getByRole("link", { name: /^Computer Science/ }).count()) === 1 && (await panel.count()) === 0);
    await search.fill("nursing");
    await settle(page, 400);
    check(`${tag}: no match says so and points to ASSIST`, (await page.getByText(/No majors match/).count()) === 1 && (await page.getByRole("link", { name: /ASSIST/ }).count()) >= 1);
    await context.close();
  }

  // The major page: rows, both tabs, a tile, the sheet's status, and the sources
  {
    const { state, context, page } = await open(MAJOR, 393, 852);
    const tiles = page.getByRole("checkbox").filter({ visible: true });
    check("major: 9 course types on the UC tab", (await tiles.count()) === 9, await tiles.count());
    const both = await page.getByText("Counts for UC and Cal State").count();
    check("major: 5 count for UC and Cal State", both === 5, both);
    check("major: the agreement line names Las Positas and its year", (await page.getByRole("link", { name: /^Find these at Las Positas, Your \d{4}-\d{2} agreement/ }).count()) === 1);
    const campuses = await page.getByRole("heading", { name: /^Campuses that use this pathway/ }).innerText();
    check("major: the campus list", campuses === "Campuses that use this pathway (9)", campuses);
    check("major: the source block with its check date and Report a problem", (await page.getByText(/Checked [A-Z][a-z]{2} \d{1,2}, \d{4}\./).count()) === 1 && (await page.getByRole("link", { name: "Report a problem" }).count()) === 1);
    await shot(page, "major-uc", true);

    const calc = page.getByRole("checkbox", { name: "Calculus, a full year" }).filter({ visible: true }).first();
    await calc.click();
    await settle(page, 600);
    check("major: tapping a tile marks it done", (await calc.getAttribute("aria-checked")) === "true" && (await page.getByText(/^1 of 9 done for UC/).count()) === 1);
    check("major: …saved to the account", state.tables.user_topic_status.some((r) => r.topic === "calculus-single" && r.status === "done"));
    check("major: …with Undo", (await page.getByRole("button", { name: "Undo" }).count()) === 1);
    await page.getByRole("tab", { name: "Cal State" }).click();
    await settle(page, 600);
    const calcCsu = page.getByRole("checkbox", { name: /calculus/i }).filter({ visible: true }).first();
    check("major: the same course type is done on the Cal State tab", (await calcCsu.getAttribute("aria-checked")) === "true", await calcCsu.getAttribute("aria-label"));
    await page.getByRole("button", { name: /^Intro to programming/ }).first().click();
    await settle(page, 500);
    const codes = await page.getByRole("dialog").locator(".type-code").allInnerTexts();
    check("major: Cal State sheets show C-ID numbers in monospace", codes.some((c) => c.includes("COMP 122")), codes);
    await page.keyboard.press("Escape");
    await settle(page, 400);

    await page.getByRole("tab", { name: "UC" }).click();
    await settle(page, 500);
    await page.getByRole("button", { name: /^Data structures/ }).first().click();
    await settle(page, 500);
    await page.getByRole("dialog").getByRole("radio", { name: "Taking now" }).click();
    await settle(page, 500);
    await page.keyboard.press("Escape");
    await settle(page, 400);
    check("major: Taking now in the sheet turns the tile mixed", (await page.getByRole("checkbox", { name: "Data structures (CS 2)" }).filter({ visible: true }).first().getAttribute("aria-checked")) === "mixed");
    check("major: …and counts it", (await page.getByText(/2 taking now/).count()) >= 1);
    await context.close();
  }
}
