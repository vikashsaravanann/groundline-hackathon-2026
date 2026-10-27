# Groundline homepage and navigation

## 2026-10-27 implementation note

The existing `/` route was extended in place with product explanation, feature
cards, a capability-oriented architecture overview, the five-stage workflow
preview, safety information, a creator preview, and a Studio call to action.
The hero's **Explore the Workflow** link now opens `/workflow` directly.

The `/workflow` page explains Capture, Understand, Ground, Prepare, and Review.
Current Capture and MOCK Understand behavior is distinguished from planned
Ground, Prepare, and approval-timeline capabilities. The `/about` page reads
verified identity and project facts from `apps/web/src/content/creator.ts`;
optional biography, education, achievement, portrait, and social-link fields
are omitted until the creator supplies them.

The footer uses a wide responsive four-panel layout for brand, Explore, Project,
and judges/collaborators information. Its three closing disclosure lines are
centered beneath the divider. The hero preview keeps the sample label frame
blank at the creator's request; sample result cards remain explicitly MOCK.

All sample homepage content is static and marked SAMPLE / MOCK. Loading the
homepage does not call a model. The public API is currently forced to MOCK
while server-side access and durable usage controls are incomplete.

## Verification

- `npm test`: 28 tests passed after the navigation regression test was added.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed without lint findings.
- `npm run build`: passed; `/`, `/about`, and `/workflow` were statically built.
- Local production browser opened `/workflow` and `/about` directly.
- Browser click from the homepage hero opened `/workflow`.
- Browser click on header Features opened `/#features`.

These checks establish local build and browser behavior. They do not establish
production deployment of this uncommitted change.
