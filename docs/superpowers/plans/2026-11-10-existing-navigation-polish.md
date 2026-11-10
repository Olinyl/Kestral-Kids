# Existing navigation and account details implementation plan

Use superpowers:executing-plans inline.

Goal: implement the owner's approved navigation simplification in the existing role components, without replacing their screens.

Architecture: keep the top account dialog and its demo account controls, add validated self-edit fields tied to the current account's shared fixture record, remove duplicate bottom Account destinations, and nest the existing guardian directory under Director Children. No new live backend wiring, persisted credentials, database, or new design system. The SDK offers no public account-menu reporting trigger; use its supported off setting for the floating report button, retaining integration code.

Spec: docs/existing-ui-functional-integration.md and the owner's approval on 2026-11-10.

- [ ] Add browser checks for all role navigation, account edits and shared guardian edits without a separate Guardians tab. Observe failures first.
- [ ] Update workspace.js account dialog and navigation, keeping sign-in, sign-out and all demo switching.
- [ ] Update director.js with Manage guardians nested in Children and guardian/sibling links from child profiles. Preserve full existing directory and edit forms.
- [ ] Configure reporting off through the supported command; do not delete SDK integration or create an unsupported reporting dialog.
- [ ] Verify phone and desktop, build, doctor, quality scan, and final focused checks. Report unrelated inherited failures honestly.

Review focus: unlinked guardian remains findable; parent edit affects only current guardian; duplicate email rejected; cancel changes nothing; no ability to edit one's role; group and emergency actions stay in place; nested Guardian view has an explicit route back to Children; reporting-off failure must not be silently treated as success.
