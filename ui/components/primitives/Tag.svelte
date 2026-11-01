<script lang="ts">
	import { X } from '@lucide/svelte';
	interface Props {
		text?: string;
		on_click?: (() => void) | null;
	}

	let { text = '', on_click = null }: Props = $props();
</script>

<span id="tag"
	><span>{text}</span>
	{#if on_click}
		<span id="remove_icon" onclick={on_click} onkeydown={on_click} role="button" tabindex="0"
			><X size={14} /></span
		>
	{/if}
</span>

<style>
	#tag {
		/* A pill in the text colour, so it inverts with the theme and stays readable. */
		background-color: var(--color-text-primary);
		color: var(--color-surface-raised);
		padding: var(--spacing-1);
		padding-bottom: var(--spacing-1);
		font-size: var(--text-sm);
		border-radius: var(--radius-xl);
		margin: var(--spacing-1) var(--spacing-1) var(--spacing-2) var(--spacing-0);
		display: inline-flex;
		align-items: center;
		line-height: 0.7em;
	}

	#remove_icon {
		color: var(--color-surface-raised);
		padding-left: var(--spacing-1);
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	#remove_icon:hover {
		font-weight: bold;
		color: var(--color-surface-raised);
	}
</style>
