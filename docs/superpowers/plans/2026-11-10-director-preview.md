# Director preview improvements

**Goal:** Implement the owner's Director requests while retaining the shared fixed frame.
**Architecture:** Existing browser-only preview, shared in-memory seed data, no new backend calls. Notifications are explicitly fictional; real delivery is deferred until preview approval.
**Stack:** Plain JavaScript, CSS, Playwright.

- [ ] Add acceptance coverage for overview consent reminders and complete scrollable lists.
- [ ] Add parent alert composition and top notification centre with preview delivery labels.
- [ ] Match guardian cards and form styling, show program/group, add arrow Back and X dialog controls.
- [ ] Use a qualification dropdown and validate one complete emergency contact.
- [ ] Replace group search plus select with an accessible keyboard combobox; Enter never submits the group form.
- [ ] Remove group child-edit links while retaining membership and capacity checks.
- [ ] Clarify Auto-assign behavior with owner before changing its assignment rules.
- [ ] Verify phone/desktop flows, build, doctor, quality scan, final checks.

November 9 shared direction: fixed brand/footer and section cards; popup X and page arrow buttons use white/green/grey styling; text selection; guardian Alerts; floating instructor reporting, current-time default with time controls, account/sign-in switching and incidents in every role remain shared follow-up scope unless confirmed for this pass. Bib meaning awaits clarification.
