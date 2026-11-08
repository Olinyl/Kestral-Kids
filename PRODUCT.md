# Kestrel Kids

## Platform
Web app. The current milestone is a public fictional-data preview for the development team and designer.

## Users and jobs
The director manages child and guardian information, instructors and groups, and identifies missing information. Instructors teach at most six children. Desk, Guardian and Patrol belong to separate feature owners.

## Sources
The owner's request is to build the whole director screen with the Piezas spec skill. Operational requirements come from the Kestrel Kids team Google Doc linked in SPEC.md. Future production access and workflows remain in ROADMAP.md.

The owner also supplied Pending Chaos at Kestrel Kids (Case).pdf. It adds two emergency contacts, ability levels 1–6, multiple family names and dated pickup changes. Registration/payment, scheduling/pay and assessments are out of scope. Import, group messaging and offline use are stretch goals.

## Stack
Existing plain JavaScript, CSS and Node.js server. Piezas hosts the mock as static public files. Real business services and sign-in wait for mock approval.

## Constraints
Keep shared child and group IDs. Use fictional data. Demo edits last until reload and are not shared between teammates. Never represent the role selector as authentication or let a director sign guardian consent.

## Open decisions
Live access rules, production retention, messaging and lift scanning are outside this preview.
