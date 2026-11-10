# Complete functionality in the existing role screens

Owner correction, 2026-11-10: complete the application by integrating functionality into the existing UI. Alerts are one part of this work, not the project scope. The separate unified redesign is not the delivery surface.

## Delivery boundary

Use `/prototype` and its existing role components as the visual baseline. Preserve navigation, Account tabs, operational buttons, desktop split panels, mobile dialogs, and each role's distinct purpose. The latest merged Director navigation includes its bottom Alerts tab. Add necessary fields/actions beside their related existing controls; do not replace a role screen with the rejected unified layout.

The owner explicitly approved the existing role screens as the visual baseline on 2026-11-10. Attempting to register this through `piezas phase approve --gate mock` was rejected: only the owner can record approval from their own terminal or the app page in the Piezas console. No project state was changed manually. Existing live code is partial and is not evidence that all roles share persisted, authorized workflows.

Latest merged source is 958d8ef. Local additions were preserved in `codex-preserve-before-958d8ef` and restored; Director/Operations alert conflicts were reconciled while retaining upstream bib handling, missing indicators and updated report fields. Build and four alert-store unit checks pass. Three of seven focused browser checks pass; four older missing-report checks conflict with the merged separation of medical information from injuries and the now-empty required injuries field. These remain unresolved, not production acceptance.

## Navigation approved by the owner and implemented in the preview

- Use the top Account entry for validated personal name, email and phone edits, account controls and sign-out. The duplicate bottom entry is removed. Credentials/security remain the responsibility of Piezas; this preview does not save passwords or verify real email changes.
- Director Children remains the primary work area. Put linked guardians and their editable contact details in each child profile, with a secondary Manage guardians view within Children retaining full guardian search, editing, linked sibling navigation and guardians without linked children. Remove only the separate bottom Guardians destination, not its functions.
- The supported Report a problem off command has been applied, and the local preview uses its runtime off setting. The integration code is retained; hosted visibility changes on the next deployment. The installed SDK has no public trigger for opening its form from Account, so no unsupported replacement was added.
- Overview and Children both open the same registration import/review dialog. Upload CSV, review the 300-row sample, download sample CSV, validate atomically, then import into the existing shared fixture arrays. Re-import uses order identity, rejects identity conflicts and preserves operational edits. Director profiles retain source order and notes. This is file import in the preview, not a live store synchronization.

## Integration map

| Workflow | Existing surface to retain | Missing work and completion evidence |
| --- | --- | --- |
| Registration import | Director Children and existing group management | Add import/review action within Children. Import 300 fictional Exhibit 4A rows into the same roster used by every original role. Re-import by stable source identity; preserve consent and operational changes. Never infer signed consent or verified pickup adults from registration. |
| Parent consent and care | My children, existing consent popup, Alerts, Account | Keep the form structure; use shared structured condition/allergy/relationship choices with optional supporting details. Keep new accounts unlinked until ownership is verified. Parent saves update the same child used by Desk, Director and assigned Instructor. Hide staff bib identifiers from Parent. |
| Group assignment | Director Lesson groups and existing assignment preview | Keep add/remove/move and capacity checks. Separate enduring program/group membership from lesson-day attendance. Imports do not invent group assignments absent from the export. |
| Check-in and bib | Desk roster and existing child check-in panel/dialog | Add physical bib entry (1–400) and confirmation showing group–bib. Preserve clothing/equipment and consent checks. Validate group, readiness and inventory before issuing. Reject duplicate active physical numbers; never change the child's preassigned group silently. |
| Instructor operations | Existing group roster, medical reminders, View child, Report missing child | Read the same imported child and daily attendance. Show only assigned groups, required care information and current staff bib. Retain existing clothing/equipment editing and found controls. Enforce assignment on the server when built for real. |
| Missing-child reporting | Existing Desk/Instructor report form and Director child profile | Add Director report action using the same reporting component and case. Use structured operational choices where supported, retain descriptive context, visibly mark missing children, and prevent duplicate active cases. |
| Patrol | Existing Active alerts, dossier, search, system log and response tools | Keep teammate's specialized UI. Populate from the shared active case and latest authorized child information. Found closes the same case everywhere and removes Patrol detail access, including stale links. No standalone Patrol Mode replacement. |
| Alerts | Existing role Alerts tabs | Retain shared design and independent read state. Instructor notices target assigned groups; Desk/Director may send wider notices. Parent sees linked-child/group notices; Patrol sees active missing cases only. Reading or clearing an alert never resolves an incident. |
| Pickup and bib return | Desk's existing Release form | Keep verified adult selection and identity confirmation. Derive releasing staff from signed-in identity rather than trusting typed names. Record lesson date, adult, staff and timestamp. Add separate bib-return status; missing return does not block an authorized release. |
| History and shared saving | Existing contextual child/case details and Director access | Record import, consent, assignment, check-in, bib, incident, found and release events with actor/time. UI cannot edit history. Verify Piezas storage guarantees before claiming immutable audit history. Reload and independent sessions must retain consistent authorized records. |
| Accounts and permissions | Every existing Account tab and account forms | Replace simulated role switching with Piezas sessions in the approved real build. Verify child ownership, staff role and assignment on every read/write. Hiding controls alone is not RBAC. |

## One end-to-end acceptance journey

Run through the original screens, never the separate unified preview:

1. Import 300 registrations; repeat import without duplicates. Review missing data without inventing consent.
2. Link a verified parent and complete a child's separate consent, contacts, structured care details and dated pickup permissions.
3. Assign the child to a matching group within instructor capacity.
4. Check in through Desk, confirming physical group–bib and clothing. Assigned Instructor sees the same child; unrelated Instructor cannot access it; Parent sees no bib.
5. Report missing from an authorized existing form. Director/Desk/assigned Instructor see the missing indication; Patrol sees the active dossier. Read/clear alerts without resolving the incident.
6. Mark found through an authorized existing action. Record actor/time, notify permitted staff, remove Patrol's detailed access and reject old links.
7. Release to a currently authorized adult; record bib return separately. Preserve that day's history when viewing another lesson date.
8. Repeat across phone/desktop and independent signed-in sessions after real wiring. Verify failed submissions, unauthorized requests and reload persistence. A browser-memory preview is not proof of production completion.

## Decisions still requiring owner or source evidence

- A real store export and stable line-item identifier are not supplied by the one-row case exhibit. Use a clearly fictional 300-row file for preview; confirm the real source before connecting it.
- Season dates and any physical group-label changes need an explicit school configuration; do not invent a live calendar or random physical bib stock.
- Live lift scans require a supported, confirmed source. Existing preview response tools must not imply real external delivery.
- Piezas currently records no owner approval of the original preview. Obtain that approval before new live business-service integration; do not silently change project state.
