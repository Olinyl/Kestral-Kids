# Developer and designer setup Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this setup inline.

**Goal:** Give the existing development team one GitHub starter and a Piezas-hosted fictional-data preview.

**Architecture:** Keep the Node.js development server and the existing UI. Publish a static copy of the mock, with no service calls or credentials, to the existing app identified by the owner's downloaded key. Future backend work will return hosting to server-runtime.

**Tech Stack:** Node.js 22+, plain JavaScript, Playwright, published Piezas CLI and SDK.

**Spec:** SPEC.md; original future feature requirements retained in ROADMAP.md.

## Global Constraints

- Use fictional records only. No real accounts or business record wiring in this milestone.
- Keep private .env files out of Git and the preview build.
- Use existing Piezas app Kestrel-Kids, verified through SDK whoami; create no additional app.
- Preserve existing starter checks and future feature requirements.
- Team membership changes stay with the owner in GitHub and Piezas settings.

## Review Focus

- Preview output must contain only index.html, workspace.js, styles.css and demo-fixture.json.
- Existing starter tests must still pass, including role switching and reload reset.
- Playwright must listen and connect on the same port on Windows.
- Future work must remain clearly deferred rather than described as working.
- Cloning the repository must not require copying the owner's private key.

## Task 1: Prepare and verify the shared starter

- [ ] Retain the original product requirements in ROADMAP.md; express current starter requirements in Piezas's checkable format.
- [ ] Record the verified app identity and static mock build directory in piezas.manifest.json.
- [ ] Extend scripts/build.js to export the four public preview files alongside the existing runtime build.
- [ ] Fix Playwright's port, browser location and test discovery; add named scenario files preserving the existing assertions.
- [ ] Update README.md and START-HERE.md with team onboarding, access boundaries and publish commands.
- [ ] Run build, browser tests and piezas doctor; inspect the output file allowlist.

## Task 2: Publish and hand off

- [ ] Run the required quality scan in a separate context and fix findings.
- [ ] Run piezas test last on the final code.
- [ ] Publish the verified preview through Piezas and verify its public address.
- [ ] Report the preview URL and the owner's remaining membership actions; do not claim invitations or a Git push happened.
