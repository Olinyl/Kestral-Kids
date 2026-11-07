# Kestrel Kids Safety Desk

Status: local starter implemented · First milestone: shared local starter

## Goal and scope

[Stated] Give the three developers and designer one starting point for the ski school app. Use the shared workspace pattern in the Figma canvas: a header, a clearly labeled interactive demo, a “View as” role selector, and role-specific navigation. Treat the workspace captures as reference for that pattern. Feature layouts belong to their owners.

[Assumed] Start with one demo workspace, a short placeholder for each role, and one shared set of fictional records. Role switching in this milestone is a preview, with no real accounts or credentials. The starter can reset at any time.

[Stated] The resort store handles enrollment and payments. [Assumed] Live accounts, Piezas record wiring, store imports, lift scans, email, offline roster caching, and publishing are later milestones. For the preview, represent the on-mountain handoff as a radio call to the desk.

## Users, access, and work areas

| Role | Eventual access | First work area |
|---|---|---|
| Guardian | Their linked children | Child details and consent |
| Director | Operational readiness across all children and groups | Incomplete profiles |
| Desk | Lesson-day arrivals, authorized pickup, and intake of radio reports | Today, Children, Pickup, Incidents |
| Instructor | Their assigned group and relevant alerts | Group roster |
| Patrol | Active incidents and information needed for response | Active alerts |

[Assumed] The preview shows only the data relevant to the selected role. Once Piezas is connected, derive access on the server from the signed-in user's role and assigned records. The demo selector never grants real access.

## Shared records

Use a stable internal child ID across work areas. A name or bib is a search label. Keep a bib tied to its lesson day.

- Child profile: ID, display name, linked guardian, consent status, emergency contacts, medical alerts and approved pickup adults.
- Lesson day and group: date, group ID and instructor assignment.
- Attendance: lesson date, child ID, group ID, bib, check-in status and clothing. Release records also hold adult, staff member and time.
- Incident: child ID, lesson date, last seen time and place, clothing, equipment, relevant injury information and status.

The included fixture holds only the shared starting rows. Feature owners can extend it together as they add workflows. Treat missing details as incomplete. Keep full contacts out of the instructor view.

## Acceptance scenarios

| ID | Milestone | Check |
|---|---|---|
| S-001 | Starter | Open the app and switch from Desk to Patrol in the demo. The workspace title and navigation change, and the demo label remains visible. |
| S-002 | Starter | The same seeded child and bib appear consistently wherever the role can see them. Reloading returns to the shared seed. |
| S-003 | Feature | A guardian completes consent and fixes a contact number for their own child. The director's incomplete list updates. Another guardian cannot open that child. |
| S-004 | Feature | An instructor sees alerts for their assigned group. A child outside that group is unavailable. |
| S-005 | Feature | The desk logs a child's arrival and clothing. An adult without current authorization cannot complete release. An approved handoff records adult, staff member and time. |
| S-006 | Feature | The desk logs a missing-child radio report. Patrol sees the active incident with last seen details, clothing and emergency contact information. |

## Architecture and build order

[Assumed] Use one Node.js app with a plain JavaScript workspace and an isolated JSON fixture. The preview works without a Piezas key or external requests.

The app owns its screens and workflow. Piezas will own business records, users and sessions, and audit data when wiring begins. Review Piezas record permissions and audit capabilities before connecting a real environment. Do not use real child data for the demo.

1. Confirm this starter scope. Build the local shell and fixture-backed role navigation. Test S-001 and S-002.
2. Divide work by owner in START-HERE.md. Add feature scenarios alongside the feature work.
3. Confirm the team's Piezas app before connecting records or real sign-in. Verify server-side access before sharing a live demo.

## Sources

- Figma [workspace overview](https://www.figma.com/design/CDfKgyYvSobrwn8xAfzuEr/Kestrel-Kids?node-id=31-3), [desk workspace](https://www.figma.com/design/CDfKgyYvSobrwn8xAfzuEr/Kestrel-Kids?node-id=31-217), and [demo role selector](https://www.figma.com/design/CDfKgyYvSobrwn8xAfzuEr/Kestrel-Kids?node-id=31-1326).
- [Kestrel Kids team notes](https://docs.google.com/document/d/169pxovL1VTBcF8m6CQ-_svcRMfCxiEE90rEpQ8imDfg/edit?tab=t.0) and the Kestrel Kids case brief.
