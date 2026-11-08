# Kestrel Kids Safety Desk

This is the shared starter for the hackathon. It includes the director workspace, a demo role selector, lesson-day navigation, and a small fictional roster. See [START-HERE.md](START-HERE.md) for team ownership and [SPEC.md](SPEC.md) for the current workflows.

Install Node.js 22 or later. Clone https://github.com/Olinyl/Kestral-Kids, then run:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:3000. The preview uses fictional records and needs no credentials or Piezas account to run locally.

- `npm run build` creates the public mock in `build/preview` and preserves the standalone Node server in `build/runtime` for the later backend milestone.
- To run the acceptance tests, install development dependencies with `npm install`, install the browser with `npx playwright install chromium`, and run `npm test`.
- The demo role selector changes the preview. Real sign-in and access controls belong in the Piezas integration milestone.

GitHub tracks source. Keep generated builds and private environment files out of commits.

## Shared team setup

- Repository: https://github.com/Olinyl/Kestral-Kids
- Piezas app: [Kestrel-Kids](https://app.piezas.ai/apps/5f6d96c7-a11c-489f-a1f8-bcc5734401b7), in SFU Experience Ventures.
- Preview address after publishing: https://kestrel-kids.apps.piezas.ai
- Team workflow and ownership: [START-HERE.md](START-HERE.md).
- Current milestone and checks: [SPEC.md](SPEC.md). Deferred features: [ROADMAP.md](ROADMAP.md).

Piezas hosts the shared preview. It does not automatically sync this GitHub repository; a maintainer publishes a verified local build. The current preview is public and contains only fictional data. Real accounts, saved edits and ski-school workflows are not connected yet.

Run browser tests with `npm test`. Run the Piezas checks with `npx piezas doctor` and `npm run check`. The check script uses the published CLI with a Windows-compatible runner command. The original Node starter tests are retained under tests/scenarios/starter.test.js. Browser binaries installed in `node_modules/.cache/ms-playwright` are detected by the Playwright configuration; the normal system browser cache is also supported.

## Publishing (maintainer)

Sign in with `npx piezas login`. The project already records the shared Piezas app; do not create another app or change its identity to a personal copy. After building and running the required quality scan, run `npm run check` last (it invokes Piezas test), then `npx piezas deploy`. Follow the project rules for scan findings or failed checks; do not bypass them.

Only `build/preview` is published in this milestone. It contains index.html, workspace.js, styles.css, director.js, director.css and demo-fixture.json. Open `/?view=director` to go straight to the director workspace. The preview uses no key, guest session or business service. Before backend development, restore server-runtime hosting and build/runtime, declare required server settings, add the SDK report button, and implement the roadmap's access checks.

The repository owner grants GitHub access, and the Piezas organization owner grants console access. Neither access is granted by cloning the repository or sharing a private key.
