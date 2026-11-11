# Tool servers

A Settings → **Tools** page for the DeepSeek Harness Web GUI. It manages MCP
(Model Context Protocol) servers and registers their tools on `ctx.tools`, so
agents can call them as `mcp__<server>__<tool>`.

## What it does

- Lists every configured server with its live status, protocol revision, target,
  tool count, and per-server error.
- Adds, edits, connects, disconnects, and deletes servers from the page.
- Reveals or masks environment values and Bearer tokens while editing.
- Sets a per-tool permission — **always allow**, **requires approval**, or
  **deny** — grouped into read-only, write/delete, and other tools, with a
  block-level selector that applies to a whole group at once.
- Speaks two transports:
  - **Local command** — spawns the program and exchanges newline-delimited
    JSON-RPC over stdio.
  - **Remote URL** — MCP Streamable HTTP, with optional Bearer authentication.
- Auto-connects selected servers when the Harness starts.
- Persists the server list and permissions in `$DSH_HOME/mcp-tools/servers.json`
  (mode `0600`).

## Permissions

Every discovered tool defaults to **always allow**. Changing it takes effect
immediately:

- **Always allow** — the tool is registered and runs without asking.
- **Requires approval** — the tool stays registered, but the Host answers the
  `tools/pre-execute` waterfall with an approval request before dispatch. It
  never weakens a stronger decision taken elsewhere in the chain.
- **Deny** — the tool is removed from `ctx.tools`, so the model does not see it
  and cannot call it. Re-allowing registers it again. Denial is also re-checked
  by the tool body, so a registration captured before the change cannot run.

Permissions have two levels:

- **Per tool** — the segment control on each row. It affects exactly that tool
  name.
- **Per block** — the selector on the *read-only*, *write/delete*, and *other*
  group headers. It is a durable policy: it applies to the tools the server
  publishes later and to any tool its name classifies into that block, and it
  clears the per-tool overrides it replaces.

A per-tool deny is not a guarantee about an operation when the same server
exposes a second tool that performs it. Kubernetes, for instance, publishes both
`pods_delete` and the generic `resources_delete`, so denying only the former
still leaves pod deletion reachable. The page warns about that overlap and
offers a one-click deny for the whole write/delete block.

## Test

`npm test` runs the permission suite against a real stdio MCP child — deny,
ask and allow resolution, the block policy, the `tools/pre-execute` gate, and
the dispose-before-register refresh that keeps allowed tools alive when a policy
changes — followed by the browser render check, which also exercises the overlap
warning and the block selector.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: MCP client, connection manager, tool registration, settings route. |
| `client.js` | Browser half: the Settings section and its add/edit form. |
| `cordis.patch.yml` | Loader row inserted by the bundle. |
| `locale/*.json` | Plugin title and description for the inventory. |
| `test/fixtures/demo-mcp-server.mjs` | A tiny stdio MCP server used to verify a connection. |
| `test/fixtures/http-mcp-server.mjs` | A Streamable HTTP MCP server with optional Bearer auth. |
| `test/render-check.mjs` | Executes the browser half under a minimal React runtime: list, add form, submit. |

## Try it

Add a **Local command** server:

- Name: `Demo`
- Command: `node`
- Arguments: `<absolute path>/test/fixtures/demo-mcp-server.mjs`

The card turns green with `3 herramientas`; the agent can then call
`mcp__demo__echo`, `mcp__demo__add`, and `mcp__demo__server_info`.

## Notes

- Stdio children inherit a scrubbed environment: credential-shaped names
  (`KEY`, `PASSWORD`, `SECRET`, `TOKEN`) and `DSH_*` are removed before the
  server's own environment merges on top, so pass a token explicitly when a
  server needs one.
- The settings route only answers requests carrying the page's custom header,
  and it is served on the local listener only.
