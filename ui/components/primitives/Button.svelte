<!--
  Variants
  --------
  primary   — The one important action on a screen. Submit, Save, Create, Start.
              Use once per view; blue filled box.

  secondary — Supporting actions alongside a primary: Cancel, Back, Edit, View.
              Default variant; white/surface box with a border.

  danger    — Irreversible or destructive actions: Delete, Remove, Reject.
              Red filled box. Pair with a confirmation step for critical ops.

  ghost     — Standalone navigation that reads like text: ← Back, ← Return to my work.
              No box, no underline at rest; underlines on hover. Zero side padding
              so it aligns with surrounding text.

  link      — Inline text action that lives inside a sentence or label: Login, Learn more.
              No box, permanent underline, normal font weight.
-->
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		active?: boolean;
		children?: Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		type = 'button',
		disabled = false,
		active = false,
		class: extraClass = '',
		children,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class="btn btn--{variant} btn--{size}{active ? ' active' : ''}{extraClass
		? ' ' + extraClass
		: ''}"
	{...rest}
>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		font-family: var(--font-sans);
		font-weight: var(--font-medium);
		font-size: var(--text-base);
		line-height: var(--leading-tight);
		border-radius: var(--radius-md);
		border: var(--border-width-1) solid transparent;
		cursor: pointer;
		white-space: nowrap;
		text-decoration: none;
		transition:
			background var(--duration-fast) var(--ease-standard),
			color var(--duration-fast) var(--ease-standard),
			border-color var(--duration-fast) var(--ease-standard),
			opacity var(--duration-fast) var(--ease-standard);
	}

	/* ── Sizes ────────────────────────────────────── */

	.btn--sm {
		font-size: var(--text-sm);
		padding: var(--spacing-1) var(--spacing-3);
	}

	.btn--md {
		padding: var(--spacing-2) var(--spacing-4);
	}

	.btn--lg {
		font-size: var(--text-lg);
		padding: var(--spacing-3) var(--spacing-6);
	}

	/* ── Variants ─────────────────────────────────── */

	.btn--primary {
		background: var(--color-brand);
		color: var(--color-on-brand);
		border-color: var(--color-brand);
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--color-brand-hover);
		border-color: var(--color-brand-hover);
	}

	.btn--secondary {
		background: var(--color-surface);
		color: var(--color-text-primary);
		border-color: var(--color-border);
	}

	.btn--secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-border-hover);
	}

	.btn--danger {
		background: var(--color-danger);
		color: var(--color-on-brand);
		border-color: var(--color-danger);
	}

	.btn--danger:hover:not(:disabled) {
		background: var(--color-danger-hover);
		border-color: var(--color-danger-hover);
	}

	/* ghost: text-only, used for back-navigation and subtle actions */
	.btn--ghost {
		background: transparent;
		color: var(--color-brand-text);
		border-color: transparent;
		font-weight: var(--font-normal);
		padding-left: var(--spacing-0);
		padding-right: var(--spacing-0);
	}

	.btn--ghost:hover:not(:disabled) {
		color: var(--color-brand-hover);
		text-decoration: underline;
	}

	/* link: inline flow, no box */
	.btn--link {
		background: transparent;
		color: var(--color-brand-text);
		border-color: transparent;
		font-weight: var(--font-normal);
		text-decoration: underline;
		padding-left: var(--spacing-0);
		padding-right: var(--spacing-0);
	}

	.btn--link:hover:not(:disabled) {
		color: var(--color-brand-hover);
	}

	/* ── States ───────────────────────────────────── */

	.btn:disabled {
		opacity: var(--opacity-disabled, 0.5);
		cursor: not-allowed;
	}

	.btn:focus-visible {
		outline: var(--border-width-2) solid var(--color-brand);
		outline-offset: 2px;
	}
</style>
