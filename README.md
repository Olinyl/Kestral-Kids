# Kestrel Kids Safety Desk

This is the shared starter for the hackathon. It includes a demo role selector, lesson-day navigation, and a small fictional roster. See [START-HERE.md](START-HERE.md) for team ownership and [SPEC.md](SPEC.md) for upcoming workflows.

Install Node.js 22 or later. Run `npm run dev` and open http://127.0.0.1:3000. The preview runs without npm packages, credentials, or Piezas services.

- `npm run build` packages the standalone server and public files under `build/runtime`.
- To run the acceptance tests, install development dependencies with `npm install`, install the browser with `npx playwright install chromium`, and run `npm test`.
- The demo role selector changes the preview. Real sign-in and access controls belong in the Piezas integration milestone.

GitHub tracks source. Keep generated builds and private environment files out of commits.
