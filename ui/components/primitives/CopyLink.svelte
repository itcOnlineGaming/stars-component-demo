<script lang="ts">
	import { Button } from '$ui/components';
	interface Props {
		link: string;
		text: string;
	}
	let { link, text }: Props = $props();
	const copyToClipboard = () => {
		navigator.clipboard.writeText(link);
	};
</script>

<div id="accept-link">
	<p>{text}</p>
	<div class="copy-container">
		<input type="text" class="copy-input" value={link} readonly />
		<Button class="copy-btn" onclick={() => copyToClipboard()}>📋 Copy</Button>
	</div>
</div>

<style>
	.copy-container {
		display: flex;
		flex: 1;

		align-items: center;
		border: var(--border-width-1) solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-surface);

		font-family: var(--font-sans);
	}

	.copy-input {
		flex: 1;
		border: none;
		padding: var(--spacing-2) var(--spacing-2);
		font-size: var(--text-sm);
		font-family: var(--font-mono);
		background: transparent;
		color: var(--color-text-primary);
	}

	.copy-input:focus {
		outline: none;
	}

	#accept-link {
		display: flex;
		gap: var(--spacing-2);
		margin-bottom: var(--spacing-4);
	}
</style>
