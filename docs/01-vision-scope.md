# Vision and scope

## One-sentence pitch

A transfer planning platform that finds the best academic path from the college you're at to the university you want to attend.

## The question the product answers

> What should I take next, where should I take it, and why?

Not "does this course transfer?" — that question is already answered by ASSIST. The product's job is to turn scattered transfer information into an actionable plan, while always letting the student verify the official record underneath.

## Short pitch

Transfer information is scattered across articulation databases, university sites, course schedules, catalogs, and counseling offices. Stackd turns that into a personalized plan. A student enters their current college, completed coursework, intended major, and possible destinations. The platform identifies remaining requirements, finds verified courses that satisfy them across supported colleges, and recommends paths based on coverage, availability, and preferences.

## Scope ladder

Build in this order. Each rung requires the one below it to be working and trusted.

1. California community college → CSU
2. California community college → UC
3. Multiple majors and universities in California
4. Multi-university optimization
5. California private universities
6. Four-year → four-year transfer
7. Out-of-state, then nationwide

The architecture should not make rungs 5–7 impossible. It should also not spend a single engineering hour on them now.

## Final product principle

The application should not simply give students more information. It should transform complicated transfer information into an answer they can act on, with the official evidence one tap away.

> **My note:** "Any college → any college" is a fine ten-year ambition and a bad thing to say out loud in year one. It sets an expectation the data can't meet, and the first student who types in a college you don't support and gets nothing will not come back. Two consequences for the product:
>
> - The UI should always name the supported set explicitly ("We currently cover 8 California community colleges and SDSU Business Administration"), not silently return empty results.
> - The vision doc's breadth should not leak into the roadmap. Rungs 5–7 are marketing language for investors and club presentations, not a build queue.
