// Deadlines (14, 15, 18): the next date, the rows and their one set of actions, the date sheet with its source, Mark done
// with Undo, and changing the transfer term. The dates are the real ones for fall 2027, so nothing here fixes a day.

export async function deadlinesSuite(run) {
  const { check, settle, shot, open, fitsWidth } = run;
  const nextHeading = (page) => page.getByText(/ is next$/).first();
  const markButtons = (page) => page.getByRole("button", { name: /^Mark .+ done$/ });
  const doneCount = async (page) => Number((await page.getByRole("heading", { name: /^Done and past \(\d+\)$/ }).innerText().catch(() => "(0)")).match(/\((\d+)\)/)[1]);

  for (const [w, h] of [[393, 852], [320, 568]]) {
    const tag = `deadlines ${w}`;
    const { state, context, page } = await open("/deadlines/", w, h);
    await shot(page, `deadlines-${w}`);
    await fitsWidth(page, w, tag);

    check(`${tag}: the transfer term`, (await page.getByText("Fall 2027 transfer").count()) === 1);
    const next = (await nextHeading(page).innerText()).replace(/ is next$/, "");
    check(`${tag}: one date is next, with when it's due`, Boolean(next) && (await page.getByText(/^Due [A-Z][a-z]+, [A-Z][a-z]{2} \d{1,2}, (in \d+ days?|today|tomorrow)\.$/).count()) === 1, next);
    check(`${tag}: only the next date has Mark done and Remind me`,
      (await markButtons(page).count()) === 1 && (await markButtons(page).getAttribute("aria-label")) === `Mark ${next} done` && (await page.getByRole("button", { name: /^Remind me: / }).count()) === 1);
    check(`${tag}: the source line under the list`, (await page.getByText(/^Dates from .+, checked [A-Z][a-z]{2} \d{1,2}, \d{4}\./).count()) === 1);

    // The date sheet: its source, the official page with its domain, and (on the web) where reminders work
    await page.getByRole("button", { name: new RegExp(`^${next.replace(/[()]/g, "\\$&")}, due `) }).first().click({ position: { x: 24, y: 24 } });
    await settle(page, 500);
    const sheet = page.getByRole("dialog");
    const official = sheet.getByRole("link", { name: /^Open the official page/ });
    check(`${tag}: the date sheet links the official page`, (await official.count()) === 1 && /^https:\/\//.test((await official.getAttribute("href")) ?? ""));
    check(`${tag}: …and says reminders work in the iPhone app`, (await sheet.getByText("Reminders work in the Stackd iPhone app.").count()) === 1);
    await page.keyboard.press("Escape");
    await settle(page, 400);

    // Mark done moves the date to Done and past and hands the actions to the next one; Undo puts it back
    const doneBefore = await doneCount(page);
    await markButtons(page).click();
    await settle(page, 900);
    const after = (await nextHeading(page).innerText().catch(() => "")).replace(/ is next$/, "");
    check(`${tag}: Mark done moves it to Done and past`, (await doneCount(page)) === doneBefore + 1, { before: doneBefore, after: await doneCount(page) });
    check(`${tag}: …the next date takes over`, after !== next && (await markButtons(page).getAttribute("aria-label")) === `Mark ${after} done`, { next, after });
    check(`${tag}: …saved to the account`, state.tables.user_deadlines.length === 1, state.tables.user_deadlines);
    await page.getByRole("button", { name: "Undo" }).click();
    await settle(page, 900);
    check(`${tag}: Undo puts it back`, (await nextHeading(page).innerText()) === `${next} is next` && (await doneCount(page)) === doneBefore);
    await context.close();
  }

  // Changing the transfer term
  {
    const { state, context, page } = await open("/deadlines/", 393, 852);
    await page.getByRole("button", { name: /^Change transfer term/ }).click();
    await settle(page, 500);
    const chips = await page.getByRole("dialog").getByRole("radio").allInnerTexts();
    check("deadlines: the term sheet offers the terms and Not sure yet", chips.includes("Fall 2027") && chips.includes("Fall 2028") && chips.includes("Not sure yet"), chips);
    await page.getByRole("dialog").getByRole("radio", { name: "Fall 2028" }).click();
    await settle(page, 900);
    check("deadlines: choosing Fall 2028 changes the screen", (await page.getByText("Fall 2028 transfer").count()) === 1);
    check("deadlines: …and saves it", state.tables.profiles[0]?.transfer_term === "fall-2028", state.tables.profiles[0]);
    await context.close();
  }
}
