<!--
  Typography
  ----------
  Renders semantic text elements with design-system styles.

  The `variant` prop controls visual weight/size. The `as` prop controls the
  rendered HTML element — they are independent so you can render an h2-styled
  heading as an <h3> for correct document outline without breaking the design.

  Variants     Default element
  --------     ---------------
  h1           h1    — Page title. One per page.
  h2           h2    — Section heading.
  h3           h3    — Sub-section heading.
  h4           h4    — Card/panel heading.
  body         p     — Default paragraph text.
  body-sm      p     — Smaller body copy (helper text, descriptions).
  caption      span  — Labels, timestamps, fine print.

  Props
  -----
  variant  — Visual style (see table above). Defaults to 'body'.
  as       — Override the rendered HTML element.
  muted    — Apply --color-text-muted instead of --color-text-primary.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption';

	const defaultElement: Record<Variant, string> = {
		h1: 'h1',
		h2: 'h2',
		h3: 'h3',
		h4: 'h4',
		body: 'p',
		'body-sm': 'p',
		caption: 'span'
	};

	interface Props {
		variant?: Variant;
		as?: string;
		muted?: boolean;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'body', as, muted = false, class: extraClass = '', children }: Props = $props();

	const tag = as ?? defaultElement[variant];
</script>

<svelte:element
	this={tag}
	class="text text--{variant}{muted ? ' text--muted' : ''}{extraClass ? ' ' + extraClass : ''}"
>
	{@render children?.()}
</svelte:element>

<style>
	.text {
		font-family: var(--font-sans);
		color: var(--color-text-primary);
		margin: 0;
	}

	.text--muted {
		color: var(--color-text-muted);
	}

	.text--h1 {
		font-size: var(--text-3xl);
		font-weight: var(--font-bold);
		line-height: var(--leading-tight);
	}

	.text--h2 {
		font-size: var(--text-2xl);
		font-weight: var(--font-semibold);
		line-height: var(--leading-tight);
	}

	.text--h3 {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		line-height: var(--leading-tight);
	}

	.text--h4 {
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
		line-height: var(--leading-tight);
	}

	.text--body {
		font-size: var(--text-base);
		font-weight: var(--font-normal);
		line-height: var(--leading-normal);
	}

	.text--body-sm {
		font-size: var(--text-sm);
		font-weight: var(--font-normal);
		line-height: var(--leading-normal);
	}

	.text--caption {
		font-size: var(--text-xs);
		font-weight: var(--font-normal);
		line-height: var(--leading-normal);
		color: var(--color-text-muted);
	}
</style>
