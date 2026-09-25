# Distribution, growth, and the App Store question

## Launch locally

Primary launch community: Las Positas College. Channels: transfer center, counselors, FBLA, student government, CS and business clubs, classmates, professors, business and CS course announcements, student Discords, group chats, QR-code flyers, Instagram, TikTok, transfer workshops.

No paid advertising. The first objective is to find out whether students genuinely find this useful.

> **My note on timing:** launch into a registration window, not a random week. Students think about course planning in roughly October–November and April–May, plus the week registration opens. A launch in the third week of February will look like failure even if the product is good. The single highest-leverage distribution act available is a transfer center staffer mentioning it in a workshop during registration season — one relationship, dozens of qualified users, and institutional credibility you cannot buy.

## SEO is the actual traffic engine

> **My note:** The braindump lists 16 distribution channels and none of them scale. Search does, and this domain is unusually well suited to it. Students type questions like:
>
> - "does math 1 at las positas transfer to sdsu"
> - "what math do i need for sjsu business"
> - "can i take statistics online for uc davis transfer"
>
> Each is a page you already have the data to answer authoritatively. A requirement page per (university, major, requirement) with the satisfying courses listed and sources linked is genuinely useful, genuinely unique content — the same asset that serves logged-in students, published as a public URL. That's hundreds of pages from one template and one dataset, and it compounds while you sleep. Competitors are already publishing SEO content in this space; that's evidence the channel works, not a reason to avoid it.
>
> Requirements: server-rendered pages (Next.js already does this), real titles and meta descriptions, and no interstitial asking for an account before showing the answer.

## The App Store

The stated end goal is a shipped App Store app with high traffic. Honest read:

**Don't start there.**

1. **Apple rejects thin web wrappers.** Guideline 4.2 requires meaningful native functionality. A WebView around a Next.js site is the classic rejection case, and the resubmission loop costs weeks.
2. **Install friction kills a first session.** A student who sees a QR code on a flyer between classes will open a web page. Many will not install an app to answer a question they have once this month. The web is the lower-friction channel *and* the more shareable one — a plan you can send as a link beats one that requires the recipient to download something.
3. **App Store search is not a discovery channel for a tool nobody's heard of.** "High traffic" for a product like this comes from search and campus word of mouth, not from browsing the App Store.

**The path that actually gets to an App Store listing:**

1. Ship the web app. Make it an installable PWA — manifest, icons, offline shell. On both iOS and Android a student can add it to their home screen and it behaves like an app.
2. Get real usage. Find out what students do repeatedly.
3. Build native only when there's a feature that genuinely requires it. The obvious candidate: **push notifications for registration windows and application deadlines** — "SDSU's application closes in 10 days," "registration opens Tuesday, the stats section you saved has 4 seats left." That's a real reason to have the app installed, it's a retention loop, and it's the kind of native functionality that clears Guideline 4.2.
4. When that day comes, Expo/React Native reuses the domain and query layers if they were kept out of the components (see `11-tech-architecture.md`).

The App Store is a fine goal. It is a distribution decision that should be made with usage data, not an architectural commitment made in week one.
