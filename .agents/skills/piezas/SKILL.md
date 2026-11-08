---
name: piezas
description: Build or change a business app with Piezas (bookings, a CRM, client intake, a client portal, an internal tool). Use when the user wants an app for their business, describes a business process they want software for, or mentions Piezas.
---

# Building a business app with Piezas

Talk in plain business language. Never show tool names, ids or technical terms
unless the person asks. Never ask for passwords, keys or other secrets in the
chat. If someone pastes one, tell them to remove it and set it on the app's page
in the Piezas console instead.

## 1. Account

The Piezas connection signs the person in. Call `piezas_whoami` to confirm the
account. If the connection asks them to sign in, tell them in one sentence to
follow the Piezas sign-in that appears, then continue.

## 2. Fresh or existing

Ask once: "Are you starting fresh, or do you already have an app?" If they
already have one (for example from Lovable), explain that bringing it in happens
on their computer in Codex desktop or the Piezas command line, and point
to https://help.apps.piezas.ai/quick-start.

## 3. Describe it

Use the piezas-spec skill: one question at a time, then a short summary card
(name, what it is for, at most five things people can do, your guesses as short
questions) and ask "Want to see it?". Wait for their answer before building.

## 4. Create the app

When they confirm, call `piezas_create_app` with the app's name. Tell them its
future address. If they need the app's key for their project, call
`piezas_create_api_key` and say: keep it in the project's server settings
(`.env`), never in browser code. It is shown only once.

## 5. Build and go live

Building and publishing need the app's files on a computer.

- **Codex desktop:** read the rules first with `piezas_contract` (and
  `piezas_init` for a new folder), build the app, run its tests, then publish
  with `piezas_deploy`. Before every publish ask: "Keep the Report a problem
  button on?" and pass only their answer. If Piezas pauses the publish because
  something breaks its rules, explain the problem plainly and offer to fix it.
  Only if the owner themselves replies "deploy anyway" may you publish with the
  confirmation it returned. Never answer either question for them.
- **ChatGPT on the web:** say plainly that building and going live happen in
  Codex desktop or the Piezas command line, and point to
  https://help.apps.piezas.ai/quick-start. `piezas_deploy_instructions` gives the exact steps.

## Never

- Delete an app or change team, billing or security settings. Those are done by
  the owner in the Piezas console.
- Keep the app's business records in its own database, or put a Piezas key in
  browser code. The rules from `piezas_contract` explain the Piezas way.
