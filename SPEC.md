# Kestrel Kids Safety Desk — shared development starter

Status: Milestone 0. A fictional-data preview for three developers and a designer.

## Goal and scope

Give the team one GitHub starting point and one Piezas-hosted preview. Keep the existing workspace, role selector, role navigation and fictional roster. This preview does not authenticate people, save edits or call Piezas business services. A role selection previews a screen; it does not grant access.

The original product plan, future feature scenarios S-003 through S-006, role responsibilities, shared fields and design references are retained in ROADMAP.md. Those features are deferred, not implemented or accepted. They must become active acceptance checks as their owners implement them.

## Requirements

- R-001: A teammate can switch the demo from Desk to Patrol and see the matching workspace and navigation while the fictional-data label remains visible.
- R-002: Desk and Instructor use the same fictional child identifiers and bibs; reloading resets the preview to the shared seed.
- R-003: The director sees today's roster counts, consent gaps, medical alerts and lesson groups, with links to the affected children. (Team notes: director has full operational access and can see missing information.)
- R-004: The director can search and filter children, open a profile, and add or edit identity, emergency contact, medical and pickup details with required fields and phone validation. Consent is displayed as guardian-provided status, not signed by the director. (Team notes; preview interpretation.)
- R-005: The director can find guardians and edit their contact details, with linked children visible. (Team notes: manage all child and parent/guardian information.)
- R-006: The director can add and edit instructors and lesson groups, assign a child to a group, and is prevented from exceeding six children per instructor across groups. (Team notes: manage instructors and groups; each instructor teaches at most six children.)
- R-007: Director edits update the demo's related views, remain during role switching, and reset on reload with a visible fictional-data notice. (Owner request: whole director screen for the development team; milestone 0 constraint.)
- R-008: The director workspace works on a narrow phone and desktop, with labelled inputs, keyboard-operable dialogs and clear empty results. (Preview usability assumption.)
- R-009: Readiness checks both emergency contacts, guardian consent, recorded medical information and a currently authorized pickup adult. Profiles show one stable child ID and alternate registration/consent name. Phone fields reject incomplete numbers. (Case PDF, sections 3–5 and Exhibits 4–5.)
- R-010: Directors can record a pickup adult's relationship and date-limited authorization, and use ability levels 1–6 for lesson groups. Expired or future pickup permissions are not shown as currently authorized. (Case PDF, sections 2–4, Exhibit 5B; date bounds assumed inclusive.)

## Data

All records are fictional and come from demo-fixture.json. There is no database or business API access in this milestone.

- Child: ID, display name, linked demo guardian, consent status.
- Group: ID, display label, assigned demo instructor.
- Attendance: lesson date, child ID, group ID, bib and check-in status.
- Guardian: ID, name, email and phone; fictional child links.
- Child profile details: birth date, emergency contact and phone, medical notes, pickup adults, guardian ID and guardian-provided consent status.
- Case detail additions: second emergency contact and phone, alternate name, structured pickup adults with relationship and inclusive valid-from/valid-until dates. Empty medical notes mean information is missing; an explicit no-conditions statement counts as recorded.
- Instructor: ID, name, email, phone and qualification.
- Lesson group details: ID, label, level, meeting place and instructor ID. Attendance links children to groups for the seeded lesson day.

## Acceptance Scenarios

### S-001: I can preview the Patrol workspace
covers: R-001
Given the shared demo is open in the Desk workspace with fictional data.
When I select Patrol using View as.
Then the workspace title is Patrol workspace, the navigation shows Active alerts, and the demo label remains visible.

### S-002: The same child and bib appear across workspaces
covers: R-002
Given the shared demo is open in Desk with the seeded roster.
When I search for bib 214, switch to Instructor, and reload the page.
Then Maya Chen and Bib 214 appear in both workspaces, and reloading restores the shared roster with two children.

### S-007: I can see what needs attention today
covers: R-003
Given I open the demo and select Director.
When I review the overview and open the incomplete profiles list.
Then today's child and group counts are accurate, Noah's missing consent is visible, and I can open his profile.

### S-008: I can find and update a child's details
covers: R-004
Given I am in the director's Children view.
When I search for Noah, open his profile, try an invalid emergency phone and then save a valid phone and medical note.
Then the invalid entry is rejected, the valid details appear when reopened, and no control lets me sign guardian consent.

### S-009: I can update a guardian's contact details
covers: R-005
Given I am in the director's Guardians view.
When I open Maya's guardian and save a new valid phone.
Then the linked child is visible and the saved phone appears in the guardian list.

### S-010: I can manage groups without overloading an instructor
covers: R-006
Given I am in the director workspace.
When I add an instructor and a group, assign a child, and try to put a seventh child with one instructor.
Then the instructor and group appear, the assignment is reflected in the roster, and the seventh assignment is rejected with an explanation.

### S-011: My demo edits stay consistent and reset on reload
covers: R-007
Given I edit Maya's name in the director workspace.
When I switch to Desk, return to Director, and reload.
Then the edited name is shared before reload, the original Maya Chen returns after reload, and the demo notice remains visible.

### S-012: I can use the director workspace on my phone and keyboard
covers: R-008
Given I open the director workspace on a 390-pixel-wide screen.
When I search for an unknown child, clear the search, open a profile and press Escape.
Then a clear empty result appears, the roster returns, the dialog closes, and the page has no horizontal overflow.

### S-013: I can identify a child and both emergency contacts
covers: R-009
Given I am in Director and open Noah's incomplete profile.
When I fill the second emergency contact and record an explicit no-conditions medical statement.
Then both emergency contacts and the stable child ID are visible, searching an alternate name finds the same child, and missing guardian consent still keeps the profile incomplete.

### S-014: I can set dated pickup permissions and numbered lesson levels
covers: R-010
Given I open a child's director profile and a lesson group.
When I give a pickup adult an authorization that ended before the lesson date and set the group to Level 3.
Then the pickup adult is labelled expired for that lesson day and the group displays Level 3.

## Architecture and build order

Use the existing Node.js development server and plain JavaScript UI. npm run build produces both build/runtime for future server hosting and build/preview for this static milestone. Only six public files are uploaded for the preview; no key, server source, private settings or dependencies are uploaded.

Use the existing Kestrel-Kids app identified by the owner's downloaded key. No additional app is needed. Team membership is administered by the owner in the Piezas console and GitHub repository settings.

The director expansion follows the full-operational-access role in the team's notes: https://docs.google.com/document/d/169pxovL1VTBcF8m6CQ-_svcRMfCxiEE90rEpQ8imDfg/edit. Keep the existing green visual language and separate director code from the other role owners' work. The preview has no emails, bulk messages, lift scans or account management.

Additional source: C:/Users/olive/Downloads/Pending Chaos at Kestrel Kids (Case).pdf, read in full. It requires two emergency contacts and lists ability levels 1–6. Store import, bulk messages and offline use are stretch goals. Registration/payment, instructor scheduling/pay and assessments stay outside this screen. The document says lift access is included while the team notes assume a separate fee; this preview does not implement pricing or lift access, so it makes no claim either way.

Assumed: pickup dates include both boundary dates and are evaluated against the visible lesson day. Director changes are demo-only and do not impersonate a guardian's consent. Only fictional information is used.

The next milestone needs approval of the preview before backend wiring. Then return the deployment mode to server-runtime, select build/runtime, add the SDK report button, and implement Piezas users and records with server-side access checks. See ROADMAP.md and START-HERE.md for feature ownership. The roadmap's S-003 through S-006 remain reserved for their original features.

## Open conflicts

None.
