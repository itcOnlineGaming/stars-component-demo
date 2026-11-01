<script lang="ts">
	let { message = 'Loading...' } = $props();
</script>

<div class="loading-container">
	<div class="spinner"></div>
	<p>{message}</p>
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-8);
		gap: var(--spacing-4);
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: var(--border-width-4) solid
			color-mix(in srgb, var(--color-text-primary) 10%, transparent);
		border-top-color: var(--color-text-primary);
		border-radius: var(--radius-full);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	p {
		margin: var(--spacing-0);
		color: var(--color-text-muted);
		font-size: var(--text-base);
	}
</style>
