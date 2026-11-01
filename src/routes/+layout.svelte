<script lang="ts">
	import '$ui/tokens/index.css';
	import '$ui/styles/reset.css';
	import '$ui/styles/base.css';
	import '$ui/styles/utilities.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

{@render children?.()}
