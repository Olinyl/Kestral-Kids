# Large-roster and responsive preview

Local prototype: `/prototype?data=200&view=desk`. The Test records selector switches Demo, 200, 1,000, Worst case, Empty and One child. It is a local-only development route; prototype/fixtures.js is excluded from both build folders. All records are fictional.

## What changed after stress testing

| Finding | Change |
| --- | --- |
| Desk rendered every child at once | Search/filter the complete dataset; render 25 results at a time with counts and Previous/Next. |
| Director tables and overview grew with enrollment | Page director lists; show the first five overview items with links to the full lists. |
| Large rosters made group membership hard to manage | Search all children from the group editor, show up to 25 candidates, and stage moves/removals until Save group. |
| Existing check-in copy still said consent policy was pending | State that guardian consent is required; disable check-in and verify consent again when saving. |
| Desktop check-in interrupted the roster with a dialog | Keep the roster on the left and details on the right at desktop widths. Phones show a full-screen detail with Back. |
| Role navigation moved between layouts | Use one green bottom navigation shell for all roles, including five director tabs. |

## Verification and limits

Browser checks cover 200 and 1,000 records, full-roster bib search, consent/group filtering, six-child instructor scope, group moves, ability-level assignment, capacity rejection, desktop panes and phone details.

Visual checks used 320, 390, 820, 1,440 and 2,560-pixel viewports, long compound names, short/CJK/Arabic names, missing information and enlarged root text. No document-width overflow or browser errors occurred. Empty and single-child data produce valid counts. The product currently has a light theme and English navigation; RTL names render with their own text direction. Full RTL layout and dark mode are not supported.

The fixtures are plain modules, not a database. This validates the preview's UI behavior; it is not a production backend load test or a promise of platform capacity. Piezas-backed pagination, sign-in, per-role access enforcement, durable writes and real-device testing belong to the approved backend milestone. No offline readiness is claimed.

The owner requested green for every role. Figma supplies layout inspiration only; sample identities, counters, device status bars and offline labels are not copied as product facts.

## Rendered data boundaries

Names, bibs, group labels, medical notes and contact values come from the shared fixture. Text values have no general import-length bound in this mock; their containers wrap rather than hiding identifiers or numbers. Counts are derived from all matching records. Child ability is optional but Auto-assign accepts only recorded Level 1–6. Group membership is limited by six children per instructor across groups. Medical and emergency information is shown only in the appropriate preview screen; the role picker itself is not authorization.
