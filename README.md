# SFIM poängräknare

Prototype for calculating club points in the Finnish-Swedish athletics championships (SFIM):

- **Frihetspriset** combines senior and junior results.
- **Ungdomspokalen** uses junior results only.

The scoring engine in [`src/lib/scoring.ts`](src/lib/scoring.ts) is independent from the Svelte UI so it can be reused by Livetila later. Its live totals are provisional; the 2026 historical page uses the organizer's published final club totals.

## Implemented rules

### Frihetspriset

- Senior placing points: `7, 5, 4, 3, 2, 1` for the six best results.
- Junior placing points: `3, 2, 1` for the three best results.
- Senior result-class points: `SM = 15`, `M = 10`, `A = 5`, regardless of placing.
- Junior `A` gives `3` result points only to the three best results.
- Combined events are excluded. Their placings are still shown, with no Frihetspriset points.

### Ungdomspokalen

- Junior groups only (`M/N17`, `H/D17`, `P/F/T15`).
- Placing points: `7, 5, 4, 3, 2, 1` for the six best results.
- An `A` result gives `5` additional points regardless of placing.

The implementation also handles:

- **Round selection.** The final is scored. Without a final, only the latest round with results is scored, as a provisional placing. Heat rows missing from the combined result list are added.
- **Non-results and marks.** DNS/DQ-style non-results are handled. Malformed marks (negative, exponent or hexadecimal values, or out-of-range time components) are never scored.
- **Event names.** Finnish and Swedish event names and mixed junior relay group names are recognised.
- **Ranking.** Tuloslista's official `ResultRank` is used over re-sorting rounded marks, but only when every valid result in the event has one; otherwise the whole event is ranked by marks.
- **Field-event ties.** Vertical jumps count failures only up to the last cleared height (World Athletics TR 26.8). Horizontal events stay tied once every valid mark has been compared (TR 25.22).
- **Wind.** No result-class points are awarded for a mark over the +2.0 m/s limit. The heat's wind is used when a row has none. For long/triple jump the best wind-legal attempt is checked separately from the placing mark. A mark with no wind reading at all is treated as legal.
- **Club totals.** Equal club totals share a position. Points from shared placings are shown to two decimals, and values that are still rounded are marked with `≈`.

## 2026 reconciliation and archive

The organizer's [Frihetspriset final table](https://drive.google.com/file/d/16MFNQUTpopF8GqOJPgMWXozjxKmJI21X/view) and [Ungdomspokalen final table](https://drive.google.com/file/d/1xY0RXx5910PcgcSJ873cOviuj0hC1faq/view) are transcribed in [`src/lib/official-standings.ts`](src/lib/official-standings.ts). The 2026 page shows these *official totals and ranking* as the primary standings. Its event and club breakdowns are calculated independently from the finalized Tuloslista snapshot in [`src/lib/sfim-2026.fixture.json`](src/lib/sfim-2026.fixture.json). When a calculated total differs, the club view displays an explicit unallocated difference; it does **not** invent event-level corrections. The organizer published club totals but not the point calculation for every athlete, so exact attribution of the remaining differences requires that event-level score sheet.

The 2026 club protocol also compares the organizer's Friday/Saturday subtotals (and senior/junior Frihetspriset columns) with the calculated lines. This narrows a discrepancy to a day and class, but still does not prove which athlete's award was accepted. In the saved feed, 26 club/trophy pairs differ from the organizer's total. The 2025 calculation exactly matches four totals in [SFI's 2025 report](https://sfi.idrott.fi/sara-wiss-forsvarade-sitt-masterskap-i-hogklassig-final/), but other reported 2025 totals differ; the 2025 board is therefore labelled calculated throughout.

The pinned snapshot also keeps the 2026 results accessible when Tuloslista retires its historical API data. The 2025 feed is pinned too. Pinned years are listed once in [`src/lib/archives.ts`](src/lib/archives.ts); to pin a new year, add it there and run `node scripts/capture-results.mjs <year>`. The script validates the capture, compares it with the existing fixture, refuses a less complete capture unless `--force` is given, and replaces the file atomically. Compare against published tables afterward.

The fixture tests check the published benchmarks and the ledger reconciliation. Because reconciliation replaces club totals with the published ones, [`src/lib/archive-regression.test.ts`](src/lib/archive-regression.test.ts) separately snapshots the calculated club totals and every athlete's award. A deliberate scoring change must update those snapshots (`pnpm vitest run -u`) and the diff should be reviewed. For an upcoming championship, the app still computes a provisional live board from the result API until an official final table is available.

## Result sources

The app keeps the official public result page separate from the JSON transport:

- The official 2026 result service is [sfimfriidrott.idrott.fi/resultatservice](https://sfimfriidrott.idrott.fi/resultatservice/).
- The 2026 public result page is [live.tuloslista.com/19929](https://live.tuloslista.com/19929).
- The app reads JSON from Tuloslista's cached API (`cached-public-api.tuloslista.com`) through the local `/api` proxy. The public result page is a human-facing UI and is not a substitute for the API endpoint.

The homepage keeps known machine-readable SFIM IDs visible even after Tuloslista stops listing a completed championship in its current-competition directory. Competition pages refresh the feed every 15 seconds while the tab is visible, show the loaded-event count, and expose a club ledger where each line is placement points plus result-class points.

Each complete, validated refresh replaces a snapshot in browser storage, so the last calculated state can be reopened if an old feed later disappears. A restored snapshot shows when it was saved.

A refresh that drops previously loaded events is rejected until the next refresh confirms the change. An empty refresh never replaces loaded results.

The `/api` proxy only passes through JSON, times out after 10 seconds, and lets the CDN cache successful responses for 10 seconds so viewers share upstream requests.

The event list is searchable by event, participant, or club, and distinguishes senior and junior events. Mobile views show the two trophy calculations on each result row without horizontal table scrolling.

The year-by-year source registry is in [`src/lib/sfim-sources.ts`](src/lib/sfim-sources.ts). It currently records:

- Public Tuloslista pages: 2026 (`19929`), 2025 (`17448`), 2024 (`15477`), and 2023 (`13354`).
- Machine-readable cached API data currently responds for 2026 (`19929`) and 2025 (`17448`); both are archived locally. The older public pages remain useful references but their cached API records return 404.
- 2022: the [complete results PDF](https://sfim2022.ax/app/uploads/sites/144/2022/08/complete-results-final.pdf) and [OpenTrack event](https://data.opentrack.run/en-gb/x/2022/ALA/sfim/).
- 2021–2018: the [Borgå Akilles results archive](https://www.akilles.fi/friidrott/sfim-resultat/) and official/local reports.
- 2020: cancelled because of the pandemic.
- 2019–2002: results also preserved in Tilastopaja, alongside competition listings, newspaper reports, and local archives. These are external archives only; no machine-readable result feed was found, so the app does not calculate points for them. No reliable online athletics-result source was found for years before 2002.

## Rules sources

The rules and standards are based on the official documents:

- [SFI 2026 competition rules](https://sfi.idrott.fi/app/uploads/sites/26/2026/01/2026-tavlingsregler-for-sfi-masterskap-i-friidrott-1-1.pdf)
- [SFI trophy rules](https://sfi.idrott.fi/friidrott/tavling/vandringspris/)
- [SUL/SFI classification table](https://www.yleisurheilu.fi/sites/default/files/atoms/files/luokitteluvaatimukset_2012_-.pdf)
- [SFI 15-year-old classification limits](https://sfi.idrott.fi/app/uploads/sites/26/2019/12/klassificeringsgranser-15.pdf)
- [SUL's 2015 decision to stop updating the classification table](https://www.yleisurheilu.fi/sites/default/files/kvk2015-3.pdf)

The classification table is explicit data in [`src/lib/classification.ts`](src/lib/classification.ts), making changes auditable when the governing rules change. The SFI rules cite a 2015 edition; the surviving public SUL copy used for most thresholds is dated 2012. SUL stopped maintaining the table after 2015, but a copy of the precise 2015 edition has not been located, so any intervening changes remain an uncertainty.

## Development

Requires Node.js 22.12 or newer. Vercel deploys run on Node 24.

```sh
pnpm install
pnpm dev
```

Run the type-check, tests and production build (Vercel runs the same command before deploying):

```sh
pnpm verify
```

Before connecting this to live Livetila data, obtain an **event-level** organizer score sheet or confirm disputed A-class decisions and club/relay eligibility with SFI. Aggregate final totals alone cannot identify which athlete-level class points were accepted or adjusted. Keep live totals labelled provisional until they can be reconciled. A partial failed refresh is rejected rather than replacing the last complete standings. The public results API and event naming can change independently of the scoring rules.
