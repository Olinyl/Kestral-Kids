# Start here · Kestrel Kids

Make one shared workspace with a demo role selector, simple work areas, and the same fictional children in every role. Use [SPEC.md](SPEC.md) as the agreement about scope. Use [demo-fixture.json](demo-fixture.json) to agree on the shared identifiers and status names.

| Owner | First task | Owns after the shell is in place |
|---|---|---|
| Dev 1 | Act as Git lead. Review and bring the working shell and fixture into the first PR. | Guardian intake, director readiness and Piezas account wiring. |
| Dev 2 | Agree on the lesson-day and attendance fields. Write the first check-in and release example against the fixture. | Desk check-in, group assignments and pickup. |
| Dev 3 | Agree with Dev 2 on what the desk records during a radio report and what patrol needs to see. | Instructor group and patrol incidents. |
| Designer | Mark up the header, demo banner, role navigation, spacing, color and status styles in Figma. Call out the narrow phone and wider patrol/desk layouts. | Shared components and role workflow states, starting with a pickup hold and an active incident. |

Before parallel coding, merge the small shell PR and agree on the shared field names. Each developer then branches off the same main branch. Keep role pages separate and coordinate edits to the shared fixture or layout with the Git lead.

For the first walkthrough, choose Desk, find Maya by her bib, then switch to Patrol and confirm the app shows the correct work area. When the features are ready, add the full handoff from check-in to patrol and approved pickup.

This is a fictional-data starter. Follow README.md to run it. The shared Piezas app is Kestrel-Kids, in SFU Experience Ventures; its identity is recorded in piezas.manifest.json and was verified from the owner's downloaded key.

## Getting the team working

1. The repository owner adds developers through [GitHub repository access](https://github.com/Olinyl/Kestral-Kids/settings/access). Team members accept their invitations themselves.
2. Each developer clones the repository, installs Node.js 22+, runs `npm ci`, `npx playwright install chromium`, then `npm run dev`. No private key is needed for this milestone.
3. Each developer creates a feature branch from the shared main branch and opens a pull request. The Git lead coordinates shared layout, fixture and hosting changes. Do not commit .env, node_modules or build output.
4. The designer reviews the hosted fictional-data preview and records layout and workflow feedback in the existing Figma file. The designer needs no key or command-line setup to view the preview.
5. Developers who need to publish sign in with their own Piezas account. The organization owner gives them access to the existing Kestrel-Kids app in the Piezas console. Preview viewers do not need console access.
6. A maintainer builds, runs the required quality scan and checks, and publishes the current preview. GitHub changes do not automatically publish to Piezas.

Use this prompt with an AI coding assistant in the cloned repository:

> Use the Piezas skill. Read AGENTS.md, SPEC.md, ROADMAP.md and START-HERE.md. Continue my assigned feature in this existing app. Keep the shared Piezas app identity and use fictional data until the preview is approved.

## Before backend work

The mock is hosted as static public files with no business API access. Keep all real child information out of it. The role selector is a demo control, not sign-in. Future features and their acceptance checks remain in ROADMAP.md; move each into the active plan as it is implemented. The next milestone uses a server to keep Piezas keys private and verifies access for every signed-in role.
