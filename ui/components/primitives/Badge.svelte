<!--
  Badge
  -----
  Small inline pill for status labels, counts, and tags.

  Variants
  --------
  success  — Confirmed, complete, active, passed.          Green pill.
  warning  — Needs attention, pending, in-progress.        Amber pill.
  danger   — Error, failed, rejected, overdue.             Red pill.
  neutral  — Default / informational. No semantic meaning. Grey pill.
-->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'success' | 'warning' | 'danger' | 'neutral';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: Variant;
		children?: Snippet;
	}

	let { variant = 'neutral', class: extraClass = '', children, ...rest }: Props = $props();
</script>

<span class="badge badge--{variant}{extraClass ? ' ' + extraClass : ''}" {...rest}>
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: var(--font-medium);
		line-height: var(--leading-tight);
		padding: var(--spacing-1) var(--spacing-2);
		border-radius: var(--radius-full);
		white-space: nowrap;
	}

	.badge--success {
		background: var(--color-success-surface);
		color: var(--color-success-text);
	}

	.badge--warning {
		background: var(--color-warning-surface);
		color: var(--color-warning-text);
	}

	.badge--danger {
		background: var(--color-danger-surface);
		color: var(--color-danger-text);
	}

	.badge--neutral {
		background: var(--color-neutral-surface);
		color: var(--color-neutral-text);
	}
</style>
