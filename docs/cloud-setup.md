# Kestral Kids cloud environment

Repository: https://github.com/Olinyl/Kestral-Kids
Setup branch: codex/piezas-cloud-and-role-views

Create the environment from Work in > Cloud > Create environment (or Settings > Codex Cloud > Environments). Select the repository and setup branch. Set up and test the environment before publishing it. On mobile, choose the published environment in Codex; the laptop can then be off.

## Installation and checks

Use Node.js 22 or later. Run `bash scripts/cloud-setup.sh` during setup. It installs the locked dependencies, uses `/usr/bin/chromium` when available (otherwise installs Playwright Chromium and its Linux prerequisites), builds the preview, checks the Piezas rules and runs the browser acceptance checks. Run `npm run dev` only when a task needs a local preview; the development server is not permanent hosting.

On cloud machines with preinstalled Chromium, prefix later browser checks with `KESTREL_BROWSER=/usr/bin/chromium`. The Playwright configuration accepts this optional executable override. It avoids requiring administrative package installation or a browser download. Do not enable unrestricted internet access for the mock.

For task instructions, load AGENTS.md and SPEC.md, use the repository's Piezas skills under .agents/skills, and read the relevant .piezas/rules topic before Piezas service work. Published package versions are locked in package-lock.json. Do not copy or edit the toolkit's source.

The two skill files are unmodified copies from the installed Piezas 0.6.2 plugin, with its license. The project rules in AGENTS.md and the live Piezas contract govern any conflicting older workflow examples in those copied skills.

## Piezas access

The current mock needs no private settings. It has no real sign-in or business API calls. The project's shared Piezas app is Kestrel-Kids, ID 5f6d96c7-a11c-489f-a1f8-bcc5734401b7.

When backend wiring is approved, request PIEZAS_API_URL=https://api.piezas.ai and a private PIEZAS_API_KEY through the cloud environment's protected settings. Use a separate test app/key for data tests. Never commit a downloaded .env file or an API key. Piezas CLI account sign-in for publishing must be completed separately in the cloud; desktop credentials and browser sessions do not move with Git.

Allow the package registry and Playwright's documented download hosts during setup. Allow api.piezas.ai for approved service calls, apps.piezas.ai for publishing, and mcp.piezas.ai if connecting the hosted MCP service. Authentication may also use app.piezas.ai. Enable only destinations actually needed by the selected workflow.

## Limits and handoff

Repository skills and command-line Piezas checks travel with the code. Desktop plugin installation, OAuth sessions and hook trust are not automatically transferred; verify them in the cloud environment. Do not claim automatic hooks are active unless the cloud task proves it. The project includes its Piezas hook configuration for hosts that support it.

The reusable cloud environment runs development tasks; Piezas hosting runs the shared app. A published environment is not itself a public app address. A local preview URL on the developer's laptop is not a phone testing link.

Cloud environments currently lack interactive Computer Use and browser tools. Headless Playwright tests run as project commands, subject to successful browser installation and environment verification. Test the published phone UI on a real phone as well.
