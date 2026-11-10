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
- R-009: Readiness checks at least one complete emergency contact (a second is optional), guardian consent, recorded medical information and a currently authorized pickup adult. Profiles show one stable child ID and alternate registration/consent name. Phone fields reject incomplete numbers. (Case PDF, sections 3–5 and Exhibits 4–5.)
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
- Preview parent alert: guardian ID/name, child references, text and creation time; fictional browser-memory activity only, never real delivery.
- Patrol alert: case number, stable child ID, registration and consent names, age, group and level, active status, issuing desk, last-seen time and place, visibility, reported clothing and its confidence, equipment, injuries, medical alert, optional lift scan, emergency contacts and escalation guidance.
- Lesson group details: ID, label, level, meeting place and instructor ID. Attendance links children to groups for the seeded lesson day.

## Role preview expansion

- R-023: Staff sign in with Piezas Users. Instructors see their assigned live group and save missing-child reports to Piezas for Desk and Patrol. Instructors call by physical radio; the app does not transmit radio. Desk and Patrol can review active reports; Patrol can mark a child found.
- R-024: The server verifies the staff session, active role, child attendance and instructor assignment before accepting a report. Client-supplied identity or group is never trusted.

- R-011: The instructor view shows the group number, level, meeting place and assigned children. Checked-in children and children not checked in appear in separate categories; the latter cards are grey, and medical alerts only include children checked in today. Each card has a View child button that opens details without family contact lists and allows clothing and equipment updates.
- R-012: An instructor can prepare a missing-child radio report with an editable last-seen time defaulted to local time, an initially blank place, clothing, equipment and concerns. Clothing, equipment and medical concerns prefill from the selected child's record; missing values show N/A. Patrol receives the last-seen time in AM/PM format. The app saves the report but does not transmit radio.
- R-013: Desk staff can search by name, alternate name, bib or group, inspect both emergency contacts and medical information, and record current clothing and equipment at check-in. Missing guardian consent blocks check-in, with no staff override. (Owner decision, 2026-11-07.)
- R-014: Desk pickup uses adults authorized on the lesson date; staff must choose one, record verifying staff and confirm the identity check. Release records retain adult, staff and time. An unlisted adult cannot release a child.
- R-015: Desk staff can log an instructor radio report with child identity, last seen details, clothing/equipment and injuries. The log states that patrol handoff happens by radio; it does not send notifications.
- R-016: Desk and director lists support 200 or more children with full-roster search, visible result counts and pages of 25; desk also has group/status filters. A local-only prototype offers demo, 200, 1,000, worst-case, empty and one-child data; every instructor still has at most six children. (Owner scale concern; page size is an implementation assumption.)
- R-017: Every role uses the same fixed bottom navigation style with safe-area padding and content clear of controls. Desk tabs are Roster and Incidents, with drop-off and verified pickup in each child's details; director tabs are Overview, Children, Guardians, Instructors and Lesson groups. The same layout works on phones, tablets and desktops. (Owner's explicit navigation requests; Figma desk frame 2:101.)
- R-018: Every role keeps the owner's green palette, using Figma only for layout inspiration: compact phone rosters and visible group medical reminders. Keep readable touch controls and real data-driven identities; do not claim offline functionality. (Owner's design ideas, Figma frames 2:45 and 2:101, file CDfKgyYvSobrwn8xAfzuEr.)
- R-019: Directors manage group membership directly in Lesson groups: add, remove or move a child. Child details are edited from Children, not from group membership. Membership changes are staged until the group is saved, respect the six-child limit per instructor, and show a warning for a manual placement at a different recorded ability level. (Owner clarification.)
- R-020: Directors can preview and apply automatic assignment of unassigned children to existing groups with matching recorded ability levels. Preserve existing assignments and respect the six-child limit per instructor across groups. Explain children left unassigned for missing ability level, missing matching group or capacity. Never guess a child's level. (Owner agreed to recorded ability levels, 2026-11-07.)
- R-021: Desktop desk check-in keeps a searchable child list on the left and selected child's details on the right. Clothing entry, consent gating and contacts remain visible in that panel. Phones use a single list with a details dialog. (Owner's desktop reference at the bottom left of Figma, visually inspected after connector rate limit.)
- R-022: Patrol sees active missing-child alerts issued by the school desk, with stable identity across registration and consent names, age, group and level, last-seen details, visibility, reported clothing with confidence, equipment, injuries, medical alerts, emergency contacts, escalation guidance and the latest lift scan when available. Unknown or conflicting details stay labelled as unknown or unverified; unavailable scans explain that the pass number is not linked. Patrol can request a lift scan, call police after the protocol threshold, and copy a police report. In this fictional-data preview, those actions never contact external services; feedback explains the limitation, while report details can be copied locally. Police lead family communication. (Patrol.png and Pending Chaos at Kestrel Kids case.)


## Acceptance Scenarios

### S-038: I can switch between five demo accounts without the demo bar
Given the preview has a signed-in sample account for every role.
When I open Accounts, switch to another profile, sign out and continue with another account.
Then the selected role's workspace appears, signing out shows the account chooser, the old Interactive demo bar is absent, and the accounts are clearly labelled as fictional.

### S-039: Buttons look and behave consistently on every device
Given I open each role on phone, tablet and desktop.
When I use its actions and open its forms.
Then text actions use 44-pixel minimum targets, 14-pixel type, consistent eight-pixel corners, natural single-action widths, clear primary/secondary/danger styles, and paired lesson-group actions share a row on phones.

### S-040: I can preview sign-up and sign-in without creating real accounts
Given I open Create account in the account chooser.
When I enter a name, email and matching passwords and preview email verification.
Then I see that no real account or email was created, the new preview profile is a Guardian with no linked children, no password is stored, and the sign-in screen can resume a demo account without granting staff access.

### S-032: I can remind parents about missing consent
Given I am in the Director preview with children whose consent is incomplete.
When I open Missing consent forms on Overview and preview reminders, or alert a parent from Children.
Then I can review the recipients and text, create a fictional alert, and see clear confirmation that no real message was sent.

### S-033: I can review every overview profile on my phone
Given the Director preview has more than five medical alerts and missing consent forms.
When I scroll either overview list.
Then every matching child is available, only incomplete consent appears in Missing consent forms, and the fixed header and tabs remain visible.

### S-034: I can edit Director profiles with familiar forms and navigation
Given I use Director Children, Guardians and Instructors.
When I open and close forms and navigate back.
Then the forms follow Guardian styling, popups have X buttons, peer tabs have no Back button, nested pages use an arrow beside the title, guardian cards show program and group instead of birthday, qualifications use a dropdown, and one complete emergency contact is enough.

### S-035: I can find and add a child without accidentally saving a group
Given I edit a lesson group in Director.
When I search by child name or bib, use the combobox results and press Enter.
Then a matching child is selected or added, the popup stays open until Save, membership changes remain staged, capacity checks still work, and the group list has no child-edit buttons.

### S-036: I can see new preview notifications at the top
Given I am in Director preview.
When I create a parent alert or a child profile changes.
Then the top notification count and list update immediately, I can read and dismiss them, and they are clearly labelled as preview activity.

### S-037: I can choose safe automatic assignment or preview rebalancing
Given I manage groups with recorded ability levels and no more than six children per instructor.
When I choose Assign ungrouped children or Rebalance groups before check-in and review the proposed changes.
Then the first mode preserves current assignments, the second can move eligible expected children, checked-in, released and actively missing children stay in place, known program days match, capacity is respected, and nothing changes until Apply.

### S-031: Every workspace has the same frame and clear sections
Given I open any of the five preview roles on a phone or desktop.
When I switch roles and use the workspace navigation.
Then the logo and top bar sit inside one shared outer card, sections have separate cards, and the content and navigation fit the screen.

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

### S-015: I can see my own group on my phone
covers: R-011
Given I open Instructor on a 390-pixel-wide screen.
When I open Maya with View child, update her clothing and equipment, and return to the roster.
Then checked-in children appear separately from greyed-out children who are not checked in, medical alerts only include checked-in children, and child details contain the editable clothing and equipment section without family phone lists.

### S-016: I can prepare a clear radio handoff
covers: R-012
Given I am viewing Maya in Instructor.
When I choose a child and edit the local-time default, last-seen place, clothing, equipment and concerns.
Then missing details start as N/A, the last-seen place starts blank, Patrol receives the selected time in AM/PM format, and the app says no radio message was sent.

### S-017: I can find a child and review check-in information
covers: R-013
Given I open School desk on desktop.
When I search by Cedar 1 and open Noah.
Then I see Noah's consent gap, both emergency contact slots, medical information gap and clothing entry.

### S-018: I can release a child only to an authorized adult
covers: R-014
Given Maya is checked in and I open the desk roster.
When I open Maya, choose Daniel Chen, enter verifying staff and confirm the identity check.
Then release is recorded with Daniel, staff and time, and Maya cannot be released twice.

### S-019: I can log an instructor radio report at the desk
covers: R-015
Given I open Incidents at the desk.
When I log a radio report for Maya with last seen time and place, clothing, equipment, injuries and receiving staff.
Then the report appears with bib 214 and those details and does not claim patrol was notified automatically.

Assumptions: all new workflows are fictional-data previews in shared page memory. The instructor has one fixed demo identity. Actual authentication and access isolation belong to the later Piezas-backed milestone.

### S-020: Missing guardian consent prevents check-in
covers: R-013
Given Noah has no guardian consent and is expected today.
When I open his desk profile and enter current clothing.
Then check-in is disabled with a guardian-consent explanation, and Noah remains expected after I reopen the profile.

### S-021: I can find children in a large lesson-day roster
covers: R-016
Given I load the local prototype with 200 fictional children.
When I move to the next page, search for the last child's bib and filter by consent needed.
Then each page has at most 25 rows, the last child is found across the whole roster, and the filter shows only children missing consent; the same search works with 1,000 children.

### S-022: Desk navigation stays at the bottom
covers: R-017
Given I open the desk on phone and desktop.
When I scroll and select Roster and Incidents.
Then the selected screen appears, every tab remains reachable at the viewport bottom, and the last content stays above the bar.

### S-023: My instructor roster stays small and shows safety reminders
covers: R-018
Given the local prototype has 200 children assigned across instructors.
When I select Instructor and open a child.
Then checked-in and not-checked-in children appear in separate categories, unchecked cards are grey, medical alerts exclude unchecked children, each card has View child, and the heading shows group number and level.

### S-024: I can manage children from Lesson groups
covers: R-019
Given I am in the director's Lesson groups view.
When I open Spruce 3, remove Maya, add Noah from Cedar 1, and save.
Then Spruce 3 contains Noah and no Maya, Cedar 1 no longer contains Noah, and child details remain editable from Children rather than group membership.

### S-025: I can review automatic assignment by ability level
covers: R-020
Given existing assignments are kept and I add seven unassigned Level 1 children and one child with no recorded level.
When I preview Auto-assign and apply the proposed assignments.
Then only five Level 1 children join Spruce 3, its instructor has six children, the other children remain unassigned with reasons, and existing assignments are unchanged.

### S-026: Every role has consistent bottom navigation
covers: R-017
Given I open the demo on a phone or tablet.
When I switch between Director, School desk, Guardian, Instructor and Patrol and choose their available tabs.
Then every role uses the same bottom navigation style, all five director tabs fit, and the selected page stays reachable without horizontal overflow.

### S-027: Desktop check-in keeps the roster beside child details
covers: R-021
Given I open School desk on a desktop.
When I select Noah and then Maya and save Maya's current clothing.
Then the roster stays visible to the left of the details panel, Noah's check-in is blocked without consent, and Maya's saved clothing appears on the right.

### S-028: Patrol can review active missing-child alerts
covers: R-022
Given I select Patrol in the fictional-data preview.
When I review the active alerts issued by the school desk.
Then Owen Parr's registration name and Owen Okafor-Parr consent name appear together with his stable ID, age, Group 14 Level 3, last-seen time and place, asthma alert, uncertain clothing, unknown equipment and injuries, unavailable lift scan, emergency contacts and police escalation guidance. Request lift scan and Call police explain that the demo cannot contact external services, Copy details copies the report locally, police lead family communication, and the demo label remains visible.

## Architecture and build order

### S-029: My live missing-child report reaches Desk and Patrol
covers: R-023
Given I am a signed-in instructor with an active assigned group and child.
When I save the child's last-seen time, place, clothing, equipment and injuries.
Then the report is stored in Piezas, Desk and Patrol can see it after refresh, and I am told to call them by physical radio because no radio message was sent.

### S-030: I cannot report a child outside my assigned group
covers: R-024
Given I am signed in as an instructor assigned to one group.
When I submit a report for a child outside my assigned attendance roster.
Then the server rejects it and no active report is created.


Use the existing Node.js development server and plain JavaScript UI. npm run build produces both build/runtime for future server hosting and build/preview for this static milestone. Only the built public files are uploaded for the preview; no key, server source, private settings or dependencies are uploaded.

Use the existing Kestrel-Kids app identified by the owner's downloaded key. No additional app is needed. Team membership is administered by the owner in the Piezas console and GitHub repository settings.

The director expansion follows the full-operational-access role in the team's notes: https://docs.google.com/document/d/169pxovL1VTBcF8m6CQ-_svcRMfCxiEE90rEpQ8imDfg/edit. Keep the existing green visual language and separate director code from the other role owners' work. The preview has no emails, bulk messages, lift scans or account management.

Additional source: C:/Users/olive/Downloads/Pending Chaos at Kestrel Kids (Case).pdf, read in full. It requires two emergency contacts and lists ability levels 1–6. Store import, bulk messages and offline use are stretch goals. Registration/payment, instructor scheduling/pay and assessments stay outside this screen. The document says lift access is included while the team notes assume a separate fee; this preview does not implement pricing or lift access, so it makes no claim either way.

Assumed: pickup dates include both boundary dates and are evaluated against the visible lesson day. Director changes are demo-only and do not impersonate a guardian's consent. Only fictional information is used.

The next milestone needs approval of the preview before backend wiring. Then return the deployment mode to server-runtime, select build/runtime, add the SDK report button, and implement Piezas users and records with server-side access checks. See ROADMAP.md and START-HERE.md for feature ownership. The roadmap's S-003 through S-006 remain reserved for their original features.

## Open conflicts

None.
