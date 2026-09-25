# Data acquisition, validation, and refresh

## Pipeline shape

```
Official source → raw import → validation → normalization → database → search → student
```

Never automatically overwrite a verified record when incoming data is malformed or uncertain. Failed imports halt and report; they do not partially apply.

## Stage 1: manual curation

Before building any importer, hand-build a small verified dataset: one university, one major, 5–10 requirements, 5–10 colleges, and the articulation records connecting them. Then test whether the database can answer *"which courses at these colleges satisfy requirement X?"* If it can't, no amount of UI fixes it.

> **My note — who owns this, and how long it takes.** The braindump assigns data ingestion to the technical co-founder alongside the entire application. That's wrong on two counts.
>
> Curating articulation records is not engineering work. It's careful reading of ASSIST agreements and transcription into a reviewed spreadsheet — roughly 30–60 minutes per (college × major) pair done properly, with source URLs and academic years captured. For the MVP slice that's maybe 10–15 hours of work. It is the highest-value work in the entire project and it does not require writing code.
>
> **The business/product co-founder should own data curation.** It puts them inside the domain, it gives them something concrete to ship, and it unblocks the engineer to build the thing that displays it. Define a CSV schema in week one and hand it over.

## Data sources, ranked by cost

1. **Statewide templates (TMC/ADT, Cal-GETC areas)** — one record set covers every college. Cheapest coverage per hour by an order of magnitude. Start here.
2. **ASSIST agreements per (college, university, major, year)** — the authoritative detail. Hand-curate for the MVP slice.
3. **Section and seat data** — one system per college, no statewide feed, stale within days. Highest cost, lowest durability. Link to CVC.edu instead of replicating it.

> **My note on ASSIST access:** be deliberate. Hand-curated records that cite the public agreement are defensible and cheap at this scale. An aggressive scraper is a way to get IP-blocked and to burn the goodwill of the one institution whose data the whole product depends on. If automated retrieval becomes necessary, read the terms of use first, rate-limit hard, cache aggressively, and be prepared to explain what you're doing. Do not build this in the MVP.

## Refresh

Agreements are versioned by academic year and republished annually, typically over the summer. Build the importer so a new cycle can be loaded alongside the old one rather than replacing it — students on older catalog rights need the old records. The current cycle is a config value, not an assumption baked into queries.

Set a calendar reminder for August. That's the month everything changes: new ASSIST cycle, new TAG matrix, new campus requirements.
