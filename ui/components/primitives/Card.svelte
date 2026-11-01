<!--
  Card
  ----
  Content container with consistent border, background, and shadow.

  Variants
  --------
  raised  — White/surface-raised background. Default for panels, dialogs, and interactive cards.
  flat    — Surface background (slightly tinted). For sections nested inside a raised surface.

  Padding
  -------
  none  — No padding. Use when children manage their own spacing.
  sm    — Compact. Good for dense UIs or table-like content.
  md    — Standard. Default.
  lg    — Generous. For hero or prominent content areas.

  Shadow
  ------
  none  — No shadow. Flat areas or cards inside other raised surfaces.
  sm    — Subtle lift. Default.
  md    — Moderate lift. Floating panels.
  lg    — Strong lift. Overlaid content.
-->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'raised' | 'flat';
	type Padding = 'none' | 'sm' | 'md' | 'lg';
	type Shadow = 'none' | 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: Variant;
		padding?: Padding;
		shadow?: Shadow;
		children?: Snippet;
	}

	let {
		variant = 'raised',
		padding = 'md',
		shadow = 'sm',
		class: extraClass = '',
		children,
		...rest
	}: Props = $props();
</script>

<div
	class="card card--{variant} card--pad-{padding} card--shadow-{shadow}{extraClass
		? ' ' + extraClass
		: ''}"
	{...rest}
>
	{@render children?.()}
</div>

<style>
	.card {
		border-radius: var(--radius-xl);
		border: var(--border-width-1) solid var(--color-border);
	}

	/* ── Variants ─────────────────────────────────── */

	.card--raised {
		background: var(--color-surface-raised);
	}

	.card--flat {
		background: var(--color-surface);
	}

	/* ── Padding ──────────────────────────────────── */

	.card--pad-none {
		padding: var(--spacing-0);
	}

	.card--pad-sm {
		padding: var(--spacing-4);
	}

	.card--pad-md {
		padding: var(--spacing-6);
	}

	.card--pad-lg {
		padding: var(--spacing-8);
	}

	/* ── Shadow ───────────────────────────────────── */

	.card--shadow-none {
		box-shadow: var(--shadow-none);
	}

	.card--shadow-sm {
		box-shadow: var(--shadow-sm);
	}

	.card--shadow-md {
		box-shadow: var(--shadow-md);
	}

	.card--shadow-lg {
		box-shadow: var(--shadow-lg);
	}
</style>
