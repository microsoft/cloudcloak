# Copilot instructions for Cloud Cloak

## Repository overview
- This repository is a Manifest V3 browser extension written in plain JavaScript, HTML, and static assets.
- Keep changes lightweight and dependency-free unless a new dependency is clearly necessary.
- Prefer small, focused edits that fit the existing style of the codebase.

## Key files
- `manifest.json` defines the extension entry points, permissions, and web-accessible resources.
- `common.js` is the shared source of truth for supported domains and cloakable pattern definitions.
- `background.js` handles tab events, script injection, and badge updates.
- `popup.js` renders and persists toggle state for masking options.
- `cloak.js` contains the DOM-masking logic that runs in the page context.

## Coding guidance
- Preserve compatibility with browser extension APIs used in this repo (`chrome.*` APIs, MV3 service worker, content script injection).
- Use ES modules when modifying shared code because `background.js` and `popup.js` import from `common.js`.
- Avoid introducing a build step, transpiler, or framework for routine changes.
- Reuse existing shared data structures from `common.js` instead of duplicating domain or pattern definitions.
- Prefer simple DOM operations and defensive null checks because the extension runs against many third-party pages with changing markup.
- Keep regex and masking logic readable and narrowly scoped to the sensitive data being targeted.

## Test guidance
- The repo includes a minimal `package.json` with `type: module` so Node treats `.js` files as ES modules during validation and tests.
- Pull requests are validated by `.github/workflows/pull-request-ci.yml`, which runs syntax checks, manifest validation, the Node test suite, and the extension packaging step.
- Use Node's built-in test runner for automated coverage in `tests/*.test.mjs`.
- For documentation-only or metadata-only changes, do not add tests.
- For behavior changes, prefer extracting small pure functions from DOM-heavy code so they can be tested with minimal setup.
- If test coverage is added, keep it lightweight, dependency-free, and focused on the changed behavior.
- Prioritize tests for:
  - regex detection and matching behavior
  - supported-domain logic
  - toggle-state or masking decisions that can be validated without a browser

## Change expectations
- Do not alter permissions, host access, or injection behavior unless the task explicitly requires it.
- Do not duplicate masking rules across files; update the shared definition in `common.js` when appropriate.
- When adding new masking behavior, consider both applying and removing the mask so toggling remains reversible.
- Update README or user-facing documentation only when the change affects usage or setup.
