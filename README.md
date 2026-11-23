# Project Bridge

Your CBS way into NYC startups. A map of New York's high-growth startups and the CBS people who can open their doors, built for the Startup Seeker persona in the Team 12 BRD (Prompt to Product, fall 2026).

This is the second iteration. It follows the updated BRD and combines the best parts of two individual prototypes:

- **Project Bridge people map** (Sophia): CBS ties ranked by strength, the network map, message drafting, CMC totals.
- **Launchpad** (Arthur): company facts that each carry a source and a verified date, short "what you would do" role summaries, outreach tracking, a mobile-friendly layout.

> **Sample data.** Every company, person and student in the app is fictional. In the MVP, company, role and people data are collected weekly with AI from public sources.

## What's in the app

| BRD screen or requirement | Where |
| --- | --- |
| Screen 0: sign in with a Columbia email and a six-digit code (req. 1) | `/signin` |
| Screen 1: set-up in under two minutes, now ending with "What matters most?" (req. 2) | `/setup` (also "Edit my set-up" in the menu) |
| For you: your first 3 doors, each a company hiring a target role plus the warmest person there, one click from a draft | `/for-you` (the landing page after set-up) |
| Screen 2: company directory, filtered to your target functions (and visa need) by default, with funding bands, round, job type and stated visa filters, six sorts, heart to save (req. 3, 7) | `/companies` |
| Screen 2A: company page with overview, momentum facts, hiring areas and roles with source links and last-verified dates, pay and visa as stated, CBS tie counts, people cards, interest list and flag buttons (req. 4, 5, 11) | `/companies/:id` |
| Screen 2B: person drawer with contact load, the 5+ nudge toward the interest list, an editable draft, Copy, Open LinkedIn, Mark as sent (req. 5, 8) | opens from any people card (`?person=<id>`) |
| Network map: you at the center, the people you can reach, the companies they open (req. 6) | `/map` |
| Screen 3: my pipeline by stage, interaction log, follow-ups due this week highlighted (req. 9) | `/pipeline` |
| Screen 4: interest list confirmation with "Remove me" (req. 10) | `/companies/:id/interest` |
| Product team: flag and removal review, interest-list CSV export, weekly refresh, MVP metrics and guardrails | `/team` |
| CMC view: read-only aggregates, demand vs supply per company, no student names | `/cmc` (in the main nav) |

### Rules implemented from BRD Section 6

- **Tie strength** (no AI, never used to rank students): CBS link (alum 2, campus or club speaker 1) + shared ground (shared past employer 2, spoke at a club the student is in 1). Strong = 3–4, Warm = 2, Light = 1, 0 hidden. Ties broken by fewer messages in the last 7 days. The same definition (`TIE_RULE` in `src/lib/compute.ts`) is shown on company pages, the map and the drawer.
- **Likely to respond / Busy this week**: a tag, never a percentage. Likely needs 5+ logged messages to the person, at least 30% answered and a reply in the last 30 days. Busy (5+ messages this week) replaces it.
- **CBS ties** on a company card: people with a current position there who are CBS alumni or speakers (the same count for every student).
- **Role status**: Live if verified in the last 14 days, Unverified if not, Closed once the posting is gone.
- **Momentum**: months since the last round and step-up vs the prior round. Facts only, no score.
- **Contact load**: "n CBS students messaged {name} this week", with a nudge to the interest list at 5 or more. No hard cap.
- **Interest list**: any student can join, no screening; resume plus required consent.
- **Mark as sent** creates an Interaction and moves the company forward in the pipeline (never backward).

## What changed in v2.1 (from Arthur's review)

| Review item | Change |
| --- | --- |
| A1, A2 | New "For you" page after set-up: three named warm contacts at companies hiring a target role, a Draft button on each, and a mini map of strong ties. The set-up toast now reports your strong ties. |
| P1, P2, P3 | The directory starts filtered to your target functions; "What matters most?" in set-up picks the default sort; students who need sponsorship don't see companies whose roles state no visa, and "Stated no" roles sort last. |
| Q1 to Q4 | Total raised and valuation on every card; funding-band and $1B+ valuation filters; sorts for most raised and biggest step-up; momentum adds 6-month headcount change and roles posted in the last 30 days; `lastValuation` and `headcountGrowth6m` added to the Company table. |
| L1, L2 | "Likely to respond" and "Busy this week" tags; a one-tap "+ Name replied" button on pipeline cards. |
| B1, B2 | CMC view moved into the main nav, with a demand vs supply column and a list of where to ask startups to post roles. |
| D2 | Source per field shown in the Product team view (Data freshness tab). |
| M1 | Mobile directory uses a Filters sheet; chips no longer wrap. |
| X1 to X8 | One tie definition everywhere, draft fixes (no claimed familiarity, no repeated employer, specific public facts), a/an fix, plurals, pipeline counter label, next steps when a company has no warm path, and reasons that don't relate to you shown as "Also". |

Not yet done: **D1** (real companies; people cards need verified, CBS-linked sources first) and **D3** (server-side storage).

### Data sources per field (D2)

| Field | Source | Refresh |
| --- | --- | --- |
| Funding, valuation, investors | PitchBook (CBS library), Crunchbase as backup | Weekly |
| Open roles, pay, visa text | Greenhouse, Lever and Ashby public job APIs, plus careers pages | Weekly |
| Headcount and 6-month growth | LinkedIn company pages, monthly snapshots | Monthly |
| CBS people | Public alumni information and company team pages, then CMC and club alumni lists | Weekly |
| Speakers | Club event pages and CBS event listings | Weekly |
| Replies and response data | Bridge's own pipeline logs | Live |

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks, then builds to dist/
```

Deployed on Vercel from the `main` branch. `vercel.json` rewrites every path to `index.html` so deep links work.

## How the prototype stores data

There is no backend yet. Everything a person does (sign-in, set-up, saves, interactions, interest lists, flags) is saved in the browser's localStorage, on top of the sample data in `src/data/seed.ts`. The shape mirrors the 14 BRD tables in `src/data/types.ts`, so moving to Postgres (for example Supabase) is a direct swap of `src/lib/store.tsx`.

What's simulated:

- **Sign-in code**: no email is sent; the code is shown on screen.
- **Resume upload**: only the file name is kept.
- **Weekly data refresh**: the button on `/team` re-stamps every open entry as verified today.
- **External links** (postings, LinkedIn, Crunchbase) point at placeholders and explain themselves when clicked.

## Running voice-of-customer interviews

1. Open the deployed link and sign in with the interviewee's Columbia email (any `*.columbia.edu` address works).
2. Let them complete set-up themselves; the toast shows how long it took.
3. After the session, open the menu (top right) and choose **Reset for the next interview** to clear this browser.
4. The **Product team view** (`/team` → MVP metrics) shows the funnel for sessions run in that browser.

## Code map

```
src/
  data/types.ts       BRD Section 6 tables
  data/helpers.ts     Function, Club and Employer helpers (with aliases)
  data/seed.ts        fictional sample companies, roles, people, activity
  lib/compute.ts      tie strength, role status, momentum, responsiveness tags
  lib/match.ts        set-up matching, directory sorts, first 3 doors
  lib/draft.ts        message drafter (templates; swap in an LLM later)
  lib/store.tsx       state, persistence and actions
  components/         drawer, dialogs, people cards, shared UI
  pages/              one file per screen
```

## Next steps

- Replace the sample companies and roles with real collected data (Launchpad already pulls live NYC roles with sources).
- Move storage to Postgres with real email codes, so counts are shared across students.
- Swap the template drafter for an LLM, using the same inputs.
