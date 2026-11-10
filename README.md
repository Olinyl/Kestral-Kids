# Kestrel Kids Safety Desk

This app keeps the existing fictional preview and adds a live, authenticated staff workflow. See [START-HERE.md](START-HERE.md) for team ownership and [SPEC.md](SPEC.md) for the current workflows.

Install Node.js 22 or later. Clone https://github.com/Olinyl/Kestral-Kids, then run:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:3000. The fictional preview works without credentials. Staff sign-in and shared reports use the Piezas app and need a server-side `PIEZAS_API_KEY` plus live staff records.

- `npm run build` creates the static preview in `build/preview` and the server app in `build/runtime`.
- To run the acceptance tests, install development dependencies with `npm install`, install the browser with `npx playwright install chromium`, and run `npm test`.
- The demo role selector changes fictional preview data. **Staff sign in** opens the live role view; production roles are determined by Piezas, never by the preview selector.

GitHub tracks source. Keep generated builds and private environment files out of commits.

## Shared team setup

- Repository: https://github.com/Olinyl/Kestral-Kids
- Piezas app: [Kestrel-Kids](https://app.piezas.ai/apps/5f6d96c7-a11c-489f-a1f8-bcc5734401b7), in SFU Experience Ventures.
- Preview address after publishing: https://kestrel-kids.apps.piezas.ai
- Team workflow and ownership: [START-HERE.md](START-HERE.md).
- Current milestone and checks: [SPEC.md](SPEC.md). Deferred features: [ROADMAP.md](ROADMAP.md).

Piezas hosts the app. It does not automatically sync this GitHub repository; a maintainer publishes a verified local build. The demo still uses fictional data. Live staff sessions, rosters and missing-child reports use Piezas services.

## Live staff setup

The app defines its Piezas record types at server startup. Create staff accounts with the Piezas Users service, then add an `app_member_profile` record for each staff account. Set `userId` to the Piezas user ID, `email`, `displayName`, `role` (`instructor`, `desk`, or `patrol`), and `active: true`.

Add live `instructor_group` records with `label`, `level`, `meeting`, and `instructorUserId`. Add `child_profile` records with `stableId`, `displayName`, optional `alternateName`, `birthDate`, and `medical`. Link children to groups for the lesson day using `attendance` records with `childRecordId` (child record ID), `groupRecordId` (group record ID), `bib`, `clothing`, and `status`. The instructor sees only records assigned to their Piezas user ID. Do not copy the fictional fixture into the live app.

An instructor report becomes a live `missing_child_report` record visible to Desk and Patrol. The instructor must call them on the physical radio; this app has no radio transmission integration. Patrol can mark a report found. The live workflow does not cache personal records for offline use.

Run browser tests with `npm test`. Run the Piezas checks with `npx piezas doctor` and `npm run check`. The check script uses the published CLI with a Windows-compatible runner command. The original Node starter tests are retained under tests/scenarios/starter.test.js. Browser binaries installed in `node_modules/.cache/ms-playwright` are detected by the Playwright configuration; the normal system browser cache is also supported.

## Publishing (maintainer)

Sign in with `npx piezas login`. The project already records the shared Piezas app; do not create another app or change its identity to a personal copy. After building and running the required quality scan, run `npm run check` last (it invokes Piezas test), then `npx piezas deploy`. Follow the project rules for scan findings or failed checks; do not bypass them.

`build/preview` is the static, fictional-data design preview; it contains no live sign-in or business-service code. `build/runtime` is the separate server app and uses Piezas for authenticated staff sessions and shared operational records. Live routes must verify an active staff profile and role before reading or changing business data. The Guardian store-import and consent workflows and Desk check-in and release workflows are not connected yet.

The repository owner grants GitHub access, and the Piezas organization owner grants console access. Neither access is granted by cloning the repository or sharing a private key.
