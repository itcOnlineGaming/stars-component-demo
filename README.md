# STARS Student Component Demo & Starter Repository

This repository is the starter template and reference implementation (**Git & Rebase Self-Efficacy Checklist**) for building a standalone Svelte 5 component that integrates directly into **STARS**.

---

## Directory Layout

```text
component_demo/
├── src/
│   ├── lib/
│   │   └── component/                     # <-- ONLY THIS FOLDER IS PULLED INTO STARS
│   │       ├── SelfEfficacyChecklist.svelte
│   │       ├── SelfEfficacyChecklist.stories.ts
│   │       ├── SelfEfficacyChecklist.test.ts
│   │       ├── checklistFixture.json      # Stage 1 static JSON payload
│   │       ├── mockSelfEfficacyApi.ts     # Stage 1 in-memory Mock JSON API
│   │       ├── httpSelfEfficacyApi.ts     # Stage 2 live fetch() HTTP API adapter
│   │       ├── types.ts                   # Shared TypeScript interfaces
│   │       └── index.ts
│   └── routes/
│       ├── +layout.svelte                 # Loads design tokens & base styles
│       └── +page.svelte                   # Local sandbox (4-theme & Stage 1/2 switcher)
├── ui/                                    # Shared $ui design system (tokens & primitives)
│   ├── components/                        # Button, Card, Badge, Input, Modal, Tag, etc.
│   ├── styles/                            # reset.css, base.css, utilities.css
│   └── tokens/                            # tokens.json, sd.config.mjs, check-usage.mjs
├── tests/
│   └── checklist.e2e.ts                   # Playwright E2E tests (role & label locators)
└── stylelint.config.mjs                   # Enforces 0 raw CSS values
```

> **Important:** The automated STARS pull script copies **only** `src/lib/component/` into `web/stars`. Everything your component needs must live inside `src/lib/component/` or come from `$ui/components`.

---

## Building Your Component in Two Stages

### Stage 1: Mock JSON API (No Backend Server Required)
During Stage 1, your component works against a typed async API interface (`SelfEfficacyApi` in `src/lib/component/types.ts`) backed by static JSON (`checklistFixture.json` + `mockSelfEfficacyApi.ts`).
- Every action (`loadChecklist`, `updateSkillConfidence`, `recordMilestoneSnapshot`, `resetChecklist`) returns a `Promise` of JSON data.
- In `npm run dev`, click **"Inspect API JSON"** in the top sandbox bar to view the live JSON payloads returned by each action.

### Stage 2: Live Backend API Calls
When the backend endpoints are ready in Stage 2:
- Implement the exact same `SelfEfficacyApi` interface in `httpSelfEfficacyApi.ts` using `fetch()`.
- Pass `createHttpSelfEfficacyApi()` to `<SelfEfficacyChecklist api={...} />` (or toggle **"Stage 2: Live HTTP API"** in the sandbox bar).
- **Zero changes** are needed inside `SelfEfficacyChecklist.svelte`.

---

## Updating Design Tokens (`tokens.json`)

Whenever an updated `tokens.json` file is published:

1. Replace `ui/tokens/tokens.json` with the latest file.
2. Regenerate the CSS custom properties and verify token usage:
   ```bash
   npm run tokens:generate
   ```

---

## Quick Start & Quality Gates

Install dependencies and start the local sandbox:

```bash
npm install
npm run dev
```

Before merging your feature branch into `main`, run all checks (these are the exact checks the instructor pull-and-deploy script runs):

```bash
npm run lint:css      # Stylelint (0 raw CSS values) + check-usage.mjs --strict
npm run check         # svelte-check (valid Svelte 5 & TypeScript)
npm run test:unit     # Vitest unit tests (using role/label locators)
npm run storybook     # Preview across all 4 themes (Standard/Gamified x Light/Dark)
```
