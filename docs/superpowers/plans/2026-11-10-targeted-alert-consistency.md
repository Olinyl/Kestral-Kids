# Targeted alert consistency implementation plan

> Use superpowers:executing-plans inline. The separate unified redesign was rejected; do not apply its layouts to the original application.

**Goal:** Add a shared, role-aware in-app Alerts workflow to the existing role screens without removing Account tabs, changing their core layouts, or replacing their operational controls.

**Architecture:** A seed-backed alert store derives authorized incident, care and consent notices from the existing shared fixture and stores new group notices/read state in that fixture. A shared Alerts renderer and native dialog use the original app's button and popup classes. Workspace navigation dispatches to this shared screen, while action links reopen the existing child, consent and Patrol views. This remains a mock; production recipient enforcement and persistence must be server-side through Piezas after screen approval.

**Spec:** docs/unified-workflow-decisions.md and SPEC.md, revised by the owner's rejection of the replacement UI and approval of a shared alerts workflow.

## Constraints

- Preserve all existing tabs and keep Account last; insert Alerts before Account for Desk, Instructor and Patrol. Parent already has Alerts. Director keeps the existing header entry rather than adding a seventh bottom tab. Patrol's Active alerts stays a separate operational screen.
- Preserve Director's existing top Alerts button and notification popup; render the same shared alert cards inside it and retain Clear notifications.
- Instructors can send only to assigned groups; Director and Desk can send to selected groups or all groups. Parents and Patrol cannot broadcast.
- Active missing-child cases are urgent regardless of read state. Marking a notification read or clearing routine notices never marks a child found.
- Parent notices are limited to linked children/groups. Patrol notification details are limited to active missing cases and disappear when those cases close.
- Keep roster, check-in, release, consent, grouping, report forms, medical reminders, search/system logs and Account views in their existing locations.
- Reuse native dialog, X close, footer actions, existing typography, green palette and 44px controls. No new Patrol mode concept.

## Review focus

- A crafted instructor group selection must be rejected before saving any notice.
- Recipients are evaluated against current child/group assignments, not merely hidden in the rendered list.
- Empty, signed-out and newly created parent accounts must not inherit the first demo parent's notices.
- Patrol's links cannot reopen a closed case, and active cases remain after marking read.
- Original buttons, Account tabs and core role landmarks remain visible before/after alert navigation.

## Tasks

- [ ] Add failing model and browser checks for sender scope, recipients, read state, preserved controls and popup consistency.
- [ ] Implement public/alerts.js and public/alerts.css; add only static asset mappings/packaging.
- [ ] Integrate the renderer into workspace.js and Director's current notification popup without changing role layouts.
- [ ] Verify original role landmarks and 320px/390px/desktop renders, build and doctor.
- [ ] Run the independent quality scan and final scenario checks; report inherited failures separately.

## Decisions

- Owner explicitly permits shared alert redesign and consistent popup/button treatment. Role-specific operational views must remain distinct.
- Existing alert and data model concepts from the rejected preview may be reused as logic, not as replacement screen layouts.
- Latest merge 5750175 was pulled before implementation; Patrol's merged source and styling were not edited. A workspace event hook refreshes the original Patrol view after its existing Found confirmation, so closed-case details leave the screen.
