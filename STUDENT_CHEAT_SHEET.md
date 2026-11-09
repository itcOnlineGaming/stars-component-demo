# Student Component & Design Tokens Cheat Sheet

One-page reference for building, styling, testing and submitting your STARS Svelte 5 component.

---

## 1. How Your Component Fits into STARS

- **`main` is your submission branch.** An automated script pulls the latest `main` from your repository, copies your component into STARS, runs the quality gates below, and deploys your component **only if every check passes**.
- **Work on a branch; never commit straight to `main`.** Merge into `main` only when all checks pass locally.
- **Svelte 5 runes only.** Use `$props()`, `$state()`, and `$derived()`. Do not use legacy Svelte 4 `export let` or `$:` reactive statements.
- **No direct `fetch()` calls.** Your component receives data and actions via `$props()` (for example `let { api, user, group } = $props();`). In your repo, the dev harness passes mock data; in STARS, the host page passes the live API.
- **No global CSS or extra npm packages.** Do not use `:global(...)` selectors that leak styles to the rest of the page, and only import from `svelte`, `@lucide/svelte`, and `$ui/components` (your `package.json` is not copied into STARS).
- **Your component lives in `src/lib/component/` at the root of your repository.** The script copies only that folder, so it must be at exactly that path: not inside a subfolder such as `my-svelte-app/src/lib/component/`. If you copied the demo app into a folder of its own, move its contents up to the repository root, or tell us the folder's path.
- **Leave out `title` in your `*.stories.ts`.** Every team's stories end up in one STARS Storybook, and two stories files with the same title stop the tests from starting, so your component fails the checks and is not deployed. Your own repository holds only your copy, so you will not see the clash there. Without a `title`, Storybook names your stories after your folder, which is always unique. If you started from the demo, delete its `title: 'StudentDemo/SelfEfficacyChecklist'` line, including in the demo checklist if you kept it.

---

## 2. Updating Design Tokens (`tokens.json`)

All styling values live in `ui/tokens/tokens.json`. Never edit the generated `_*.css` files by hand.

Whenever a new `tokens.json` is shared (e.g. on Google Drive):

1. Download `tokens.json` and replace `ui/tokens/tokens.json` in your repository.
2. Run:
   ```bash
   npm run tokens:generate
   ```
   This runs `sd.config.mjs` (regenerating `_colors.css`, `_spacing.css`, `_typography.css`, `_radius.css`, `_border.css`, `_size.css`, `_shadow.css`, `_motion.css`) and `check-usage.mjs` (checking that your component does not reference any token that was renamed or removed).

---

## 3. Pre-Push Checks (Must All Pass Before Merging to `main`)

| Command | What it checks | Passes when |
| :--- | :--- | :--- |
| `npm run lint:css` | Stylelint + `check-usage.mjs --strict` | **0** raw CSS values, **0** undefined `var(--...)` names, **0** Tier-1 palette tokens |
| `npm run check` | `svelte-check` | **0** Svelte 5 / TypeScript compiler errors |
| `npm run test:unit` | `vitest --run` | All component unit tests pass |
| `npm run storybook` | Visual & theme check on `http://localhost:6006` | Readable in all **4 themes** (`standard`/`gamified` × `light`/`dark`) and at `1440px` & `390px` widths |

---

## 4. Design Token Reference (Zero Raw CSS Rule)

Stylelint (`stylelint.config.mjs`) blocks raw colours (`#hex`, `rgb()`, `hsl()`, named colours), font stacks, and raw lengths (`px`, `rem`, `em`, `pt`) on `padding`, `margin`, `gap`, `font-size`, `border-radius`, `box-shadow`, `border`/`outline` widths, `max-width`, and `--*` custom properties. Keywords (`0`, `auto`, `inherit`, `transparent`, `none`, `100%`, `50%`) and `calc()` / `color-mix()` built from `var()`s are allowed.

### Colours (`_colors.css`) — Use Tier-2 Semantic Roles Only

Never use Tier-1 palette steps (`--blue-600`, `--slate-200`, `--white`) in a component — they do not adapt to dark or gamified themes and will fail `check-usage.mjs --strict`.

| Category | Tokens | Usage |
| :--- | :--- | :--- |
| **Surfaces** | `--color-surface`<br>`--color-surface-raised`<br>`--color-surface-hover`<br>`--color-scrim` | Page background<br>Cards, panels, modals, dropdowns<br>Hover state on interactive rows/surfaces<br>Modal backdrop dimmer |
| **Text** | `--color-text-primary`<br>`--color-text-muted` | Body copy and headings<br>Secondary text, captions, labels |
| **Brand & Accent** | `--color-brand`, `--color-brand-hover`<br>`--color-brand-surface`<br>`--color-brand-text`<br>`--color-on-brand`<br>`--color-accent`, `--color-accent-hover` | Primary button/control fill<br>Soft tint background behind brand content<br>Links and brand-coloured text<br>White/contrasting text on a `--color-brand` fill<br>Secondary decorative highlights |
| **Borders & Focus** | `--color-border`, `--color-border-hover`<br>`--color-focus` | Dividers, card borders, input borders<br>Focus ring colour |
| **Status** | `--color-success`, `-surface`, `-text`, `-hover`, `-border`<br>`--color-danger`, `-surface`, `-text`, `-hover`<br>`--color-warning`, `-surface`, `-text`<br>`--color-info`, `-surface`, `-text`<br>`--color-neutral`, `-surface`, `-text` | Base role (`--color-success`, etc.) is for fills/icons.<br>Use `-surface` for badge/alert backgrounds.<br>Use `-text` for text on that surface.<br>Use `--color-success-border` for green borders/rings. |
| **Game / Rewards** | `--color-reward`, `--color-reward-strong`, `--color-on-reward`<br>`--color-glow`, `--color-edge` | Stars, XP, achievement badges, and 3D card edges |

### Spacing, Sizing, Borders, Typography & Elevation

| Property | Allowed Tokens | Values / Notes |
| :--- | :--- | :--- |
| **`padding`, `margin`, `gap`** | `--spacing-0` (`0`), `--spacing-1` (`4px`), `--spacing-2` (`8px`), `--spacing-3` (`12px`), `--spacing-4` (`16px`), `--spacing-5` (`20px`), `--spacing-6` (`24px`), `--spacing-8` (`32px`), `--spacing-10` (`40px`), `--spacing-12` (`48px`), `--spacing-16` (`64px`), `--spacing-20` (`80px`) | Use shorthand with tokens: e.g. `padding: var(--spacing-3) var(--spacing-4);` |
| **`font-family`** | `--font-sans` (Nunito)<br>`--font-display` (Lilita One)<br>`--font-mono` (monospace) | Body copy & UI controls<br>Display headings & celebration numbers<br>Code snippets & IDs |
| **`font-size`** | `--text-xs` (`12px`), `--text-sm` (`14px`), `--text-base` (`16px`), `--text-lg` (`18px`), `--text-xl` (`20px`), `--text-2xl` (`24px`), `--text-3xl` (`30px`), `--text-4xl` (`36px`), `--text-5xl` (`48px`), `--text-6xl` (`64px`) | Also `--font-normal` (`400`), `--font-medium` (`500`), `--font-semibold` (`600`), `--font-bold` (`700`); `--leading-tight` (`1.25`), `--leading-normal` (`1.5`) |
| **`border`, `outline` width** | `--border-width-1` (`1px`)<br>`--border-width-2` (`2px`)<br>`--border-width-3` (`3px`)<br>`--border-width-4` (`4px`) | e.g. `border: var(--border-width-1) solid var(--color-border);`<br>`outline: var(--border-width-2) solid var(--color-focus);` |
| **`max-width`** | `--container-xs` (`20rem` / `320px`)<br>`--container-dialog` (`30rem` / `480px`)<br>`--container-sm` (`40rem` / `640px`)<br>`--container-md` (`50rem` / `800px`)<br>`--container-lg` (`60rem` / `960px`)<br>`--container-xl` (`75rem` / `1200px`) | For reading width on text blocks, `ch` is allowed (e.g. `max-width: 65ch;`), as are `100%` and `fit-content`.<br>*Note:* `@media (max-width: 768px)` breakpoints stay raw `px` because CSS media queries cannot use `var()`. |
| **Grid columns** | `--column-min-sm` (`11rem`), `--column-min-md` (`14rem`) | e.g. `grid-template-columns: repeat(auto-fill, minmax(var(--column-min-md), 1fr));` |
| **`border-radius`** | `--radius-sm` (`4px`), `--radius-md` (`6px`), `--radius-lg` (`8px`), `--radius-xl` (`12px`), `--radius-2xl` (`16px`), `--radius-full` (`9999px`) | Use `--radius-full` for pills and circular avatars/badges |
| **`box-shadow`** | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-none`, `--shadow-focus` | Focus ring: `0 0 0 var(--border-width-2) var(--color-focus)`<br>Glow: `0 0 var(--glow-sm\|md\|lg) var(--color-glow)`<br>3D edge: `0 var(--edge-depth) 0 var(--color-edge)` |
| **Transitions** | `--duration-fast` (`100ms`), `--duration-slow` (`400ms`), `--ease-standard` | e.g. `transition: background var(--duration-fast) var(--ease-standard);` |

---

## 5. Shared UI Primitives (`$ui/components`)

Before styling a button, input, modal, or card from scratch, import the shared primitive:

```svelte
<script>
	import {
		Button,
		Card,
		Input,
		Modal,
		Badge,
		Tag,
		Loading,
		Typography,
		StatusToggle,
		CopyLink
	} from '$ui/components';
</script>

<Card>
	<Input label="Search topic" placeholder="Type a topic..." />
	<Button variant="primary" size="md">Save</Button>
</Card>
```

- `Button` variants: `primary`, `secondary`, `danger`, `ghost`, `link` (sizes: `sm`, `md`, `lg`).

---

## 6. Accessibility & Testing Rules

1. **Semantic HTML first:** Use `<button type="button">` for actions, `<label>` wrapping or linked to `<input>`/`<select>`, and `aria-label` when a button has only an icon.
2. **Role, label, and text locators only:** In your `*.test.js` files, always find elements the way a user does:
   - `screen.getByRole('button', { name: 'Save' })`
   - `screen.getByLabelText('Search topic')`
   - `screen.getByText('No items found')`
   - **Never** use `container.querySelector('.my-css-class')` in tests.

---

## 7. Git Workflow: From Branch to `main`

```bash
git switch -c my-feature                    # 1. Create a feature branch
npm run tokens:generate                     # 2. Ensure tokens CSS is up to date
npm run lint:css && npm run check           # 3. Check 0 raw CSS values & valid Svelte 5
npm run test:unit                           # 4. Run unit tests
git add <files> && git commit               # 5. Commit your changes
git fetch origin && git rebase origin/main  # 6. Rebase onto latest main
git switch main && git pull                 # 7. Fast-forward merge into main and push
git merge --ff-only my-feature
git push
```
