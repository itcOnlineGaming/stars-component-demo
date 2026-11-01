<!--
  Icon
  ----
  Slot-based wrapper for inline SVGs. Sets a consistent size and ensures the
  SVG inherits the surrounding text colour via currentColor.

  Pass the raw <svg> as a child — the slot renders it inline. The SVG should
  use `fill="currentColor"` or `stroke="currentColor"` so it responds to the
  Icon's own colour or the inherited text colour.

  Sizes   em value   Typical use
  -----   --------   -----------
  xs      0.75em     Inline with caption / label text
  sm      1em        Inline with body text (default)
  md      1.25em     Standalone icon in a button or nav item
  lg      1.5em      Feature icons, empty-state illustrations

  Props
  -----
  size   — xs | sm | md | lg. Defaults to 'sm'.
  label  — Accessible label. When provided, renders aria-label and role="img".
           Omit for decorative icons (aria-hidden is set automatically).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		size?: Size;
		label?: string;
		class?: string;
		children?: Snippet;
	}

	let { size = 'sm', label = '', class: extraClass = '', children }: Props = $props();
</script>

<span
	class="icon icon--{size}{extraClass ? ' ' + extraClass : ''}"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	{@render children?.()}
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		line-height: 1;
		color: inherit;
	}

	/* SVG children inherit size via font-relative units on the parent */
	.icon :global(svg) {
		display: block;
		width: 1em;
		height: 1em;
		fill: currentColor;
	}

	.icon--xs {
		font-size: var(--text-xs);
	}
	.icon--sm {
		font-size: var(--text-sm);
	}
	.icon--md {
		font-size: var(--text-lg);
	}
	.icon--lg {
		font-size: var(--text-xl);
	}
</style>
