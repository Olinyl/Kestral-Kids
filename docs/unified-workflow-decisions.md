# Unified workflow decisions — draft for the updated preview

## UI correction confirmed after reviewing the replacement preview

- The owner rejected the separate `/unified` redesign. The original `/prototype` role views are the visual baseline. Do not remove or relocate their core controls or Account tabs, and do not make specialized role views identical.
- Shared alerts may be redesigned consistently across roles. Other shared controls may receive small consistency refinements only; native popup chrome, button styling and form behavior should feel related without replacing the surrounding layout.
- Instructor notices are restricted to assigned groups; Director and Desk can target wider group audiences. Parent notices stay in the existing Alerts tab between My children and Account. Patrol retains Active alerts and all its emergency tools.
- Director keeps the existing top Alerts entry and popup; the same notification cards are reused there and in the full Alerts screen. This avoids a seventh bottom tab on small phones.
- Latest merged source: 5750175, including the teammate's Patrol layout, confirmation and bib changes. Preserve this as the baseline for subsequent work.

## Confirmed by the owner

- Keep the Parent/Guardian role: these are two names for the same role. Remove bib information from that role, not the whole screen.
- Before check-in, a child already has a group assignment. At check-in Desk enters the physical bib number, an integer from 1 to 400. Staff-facing identification combines the assigned group number and bib number with a dash, for example 14-237. Keep the two underlying values separate; bibs are not permanent child identities.
- Final bib choice: use one shared physical inventory organized by group, issue an available bib at each daily check-in, and collect it at pickup. Do not reserve a bib for a child for the season or randomly generate a number that does not correspond to the physical bib. A child's bib may differ next week. Reuse between Saturday and Sunday requires matching printed group numbers or physically replaceable group labels.
- The proposed season model is one intake with Saturday and Sunday programs, each having eight lesson dates. The case does not describe staggered starts or give all holiday-break dates; exact dates remain an explicit assumption until confirmed. Registration and group membership persist while attendance, check-in, bib issue and pickup are date-specific.
- Add the bib to Patrol information; another teammate is implementing that Patrol presentation, so coordinate rather than replacing their work.
- Patrol may see only currently missing children. Once found, remove the case and revoke access to its child details, including through old notification links.
- Director, Desk, Patrol and the assigned instructor can mark a missing child found. Record the person and time of the change.
- Director can report a missing child from the child profile using the same reporting form and incident record as the other authorized roles.
- All application alerts are in-app. Use Piezas-backed inbox records through the SDK inbox helper, with recipient selection and access checks on the server. Do not treat the email-notification service as a per-user inbox.
- Desk needs an Alerts tab. Distinguish active incidents from routine notifications using text and urgency as well as colour.
- A missing child must be visibly identified across authorized staff views. Forms, summaries, medical information and popups use the same shared records and presentation rules.
- The preview must start from a 300-row registration import. Every role uses the imported records, not independent hand-authored role fixtures. The existing fictional export contains 200 rows and is not a real store connection.

## Recommended behaviour, not yet confirmed

- Show a combined staff-facing label such as Bib 14-237; avoid adding another standalone group-number field to every child card. Keep group context and ability level where useful.
- Prevent duplicate physical bib assignments for the same lesson day. Never overwrite a preassigned group when recording a bib.
- Import validates rows and reports missing or invalid information. Re-import must match a stable source registration/line-item identifier, not names, and preserve locally recorded consent, medical, attendance, bib and incident information.
- Missing, updated and found incident notifications go to Director, Desk, Patrol and the assigned instructor while access remains authorized. Do not automatically notify parents about a missing child: the case brief assigns family communication to the emergency procedure.
- Missing-consent reminders go to the linked guardian, with operational readiness visible to Director and Desk.
- Relevant care-information changes go to Director, Desk and the assigned instructor; Patrol receives necessary medical information only through an active missing-child case.
- Group operational notices go only to the chosen affected groups and authorized recipients; sending permissions still need confirmation.

## Still to resolve before live implementation

- Real registration export format, stable source identifier and which columns it supplies; how group assignments are obtained before check-in.
- Alert types, sending permissions, recipients, acknowledgement requirements and removal rules. Reading an alert must not close a missing-child case.
- How parent consent and medical changes are supplied when those fields are absent from registration imports.
- Verified guarantees for immutable audit history; automatic lift information requires a confirmed supported source.
- The existing preview has not yet been approved for live backend wiring.

## Current source evidence

- Directly read all 10 pages of Pending Chaos at Kestrel Kids (Case).pdf and visually checked Exhibit 4 on PDF pages 6–7. Section 3 says weekend registrations are exported and children sorted into groups beforehand; numbered bibs are handed out at 8:30–9:15 check-in. Exhibit 2 repeats this handout timing. Neither specifies bib format, stock management or assignment permanence.
- Exhibit 4A contains one sample registration export row, not a 300-row file. Its fields are order number, child, birth date, program, level, account holder, relationship, phone, email and the original free-text child notes. Exhibit 4B supplies separate consent, contacts, medical, medication, pickup and photo-consent information. Exhibit 4C is a separate preprepared Group 14 class list, not a group field in the registration export.
- The case reports 400 children across the previous season (220 Saturday, 180 Sunday), and 312 current registrations. The owner requests 300 fictional import rows for the demo; keep program-day rosters separate.
- Physical printing detail still open: reusable bibs may have permanent unique physical numbers 1–400 plus a replaceable group-number panel, or fixed full group–bib printing with stock prepared by group. The case leaves this physical numbering choice open; daily assignment has now been chosen.
- Proposed check-in: open the imported child, resolve consent/readiness, verify their existing group, take an available physical bib from that group's stock, type its 1–400 number, compare the composed group–bib label with the physical bib, confirm/save, then hand it over. Do not preassign a physical bib to an absent child or mark issued before a successful save.
- Proposed controls: one active physical bib assignment per lesson day; duplicate assignment rejected across all groups; missing-child bibs cannot be reassigned; replacements and post-check-in group moves retain assignment history and require the physical label/bib to be updated too. Record bib returns separately from child pickup. A missing return must not block an otherwise authorized child release. Return at daily pickup has now been chosen; readiness for later reuse requires the physical bib to be available and correctly labelled.

## Next preview acceptance walkthrough

1. Start with a 300-row fictional file using Exhibit 4A's columns. Import and review errors; derive every role's records from those imported rows. Do not invent signed consent, verified pickup permissions or medical confirmation when those are absent from the export.
2. Use one imported child to complete the parent's separate consent and care information. Confirm Desk and Director see readiness and the assigned instructor sees necessary care details only.
3. Prepare a group assignment, then use Desk to confirm an available physical bib and check in. The assigned instructor sees the same child, group and composed group–bib identifier. Parents see no bib.
4. Report that child missing using the shared form. Authorized staff see a missing indicator; Patrol can open only the active missing case. Director, Desk, Patrol or the assigned instructor can mark found, immediately removing Patrol's detailed access including old links.
5. Use consistent in-app alert presentation with a draft recipient matrix: missing-child events for authorized responders; readiness tasks for parents, Desk and Director; necessary care changes for Desk, Director and the assigned instructor; group operational notices for selected affected groups. Sending permissions and acknowledgement expectations remain proposals to review in the mock.
6. Complete authorized pickup and record the bib return separately. Retain that lesson day's history when switching to the next date.
7. This walkthrough is still a fictional-data preview, not completed Piezas authentication or backend enforcement. Real wiring begins only after the owner's preview approval. Immutable audit guarantees and live lift-data support must be resolved before claiming production readiness.

- docs/case-requirements.md summarizes the case brief and its privacy, consent, pickup and radio-handoff rules.
- public/store-import.js is a generated fictional registration export with 200 rows; it supplies order number, child name, birth date, program, ability, account-holder contact details, relationship and child notes. It does not supply signed consent, verified pickup permissions or medical confirmation.
- The published SDK exposes createInboxStore and INBOX_SCHEMA for per-user in-app inbox records and read state. Its helper does not replace recipient authorization or retention checks.
