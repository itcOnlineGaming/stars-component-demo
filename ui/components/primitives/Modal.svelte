<!--
  Modal
  -----
  Accessible dialog built on the native <dialog> element.
  The browser handles focus trap and Escape-to-close automatically.
  Clicking the backdrop also closes.

  Sizes
  -----
  sm   — 480px.  Confirmations, alerts, short forms.
  md   — 640px.  Default. Standard dialogs, moderate content.
  lg   — 900px.  Complex forms, multi-step flows.
  xl   — 1200px. Wide content — data tables, skill selectors.

  Snippets
  --------
  children  — Body content. Rendered in the scrollable middle section.
  footer    — Optional. Rendered in a right-aligned footer bar. Use for action buttons.
              If omitted, no footer renders.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Size = 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		isOpen: boolean;
		title: string;
		onClose: () => void;
		size?: Size;
		children?: Snippet;
		footer?: Snippet;
	}

	let { isOpen, title, onClose, size = 'md', children, footer }: Props = $props();

	let dialogEl: HTMLDialogElement;

	$effect(() => {
		if (!dialogEl) return;
		if (isOpen) {
			dialogEl.showModal();
		} else {
			dialogEl.close();
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) onClose();
	}
</script>

<dialog
	bind:this={dialogEl}
	aria-labelledby="modal-title"
	aria-modal="true"
	class="modal modal--{size}"
	onclose={onClose}
	onclick={handleBackdropClick}
>
	<!-- Inner div stops backdrop clicks propagating into content -->
	<div class="modal-inner" role="presentation" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2 id="modal-title" class="modal-title">{title}</h2>
			<button class="modal-close" aria-label="Close" onclick={onClose}>&times;</button>
		</div>

		<div class="modal-body">
			{@render children?.()}
		</div>

		{#if footer}
			<div class="modal-footer">
				{@render footer()}
			</div>
		{/if}
	</div>
</dialog>

<style>
	.modal {
		/* The shared reset's `* { margin: 0 }` overrides the browser's default
		   `margin: auto` centering for <dialog>, so it must be restored explicitly here. */
		margin: auto;
		padding: var(--spacing-0);
		border: none;
		border-radius: var(--radius-xl);
		max-width: 90vw;
		max-height: 90vh;
		background: var(--color-surface-raised);
		box-shadow: var(--shadow-xl);
	}

	.modal--sm {
		width: 480px;
	}
	.modal--md {
		width: 640px;
	}
	.modal--lg {
		width: 900px;
	}
	.modal--xl {
		width: 1200px;
	}

	.modal::backdrop {
		background: var(--color-scrim);
	}

	/* ── Layout ───────────────────────────────────── */

	.modal-inner {
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-6);
		border-bottom: var(--border-width-1) solid var(--color-border);
		flex-shrink: 0;
	}

	.modal-title {
		margin: var(--spacing-0);
		font-size: var(--text-2xl);
		font-family: var(--font-sans);
		color: var(--color-text-primary);
	}

	.modal-close {
		background: none;
		border: none;
		font-size: var(--text-3xl);
		line-height: 1;
		cursor: pointer;
		padding: var(--spacing-0);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		border-radius: var(--radius-md);
		transition:
			color var(--duration-fast) var(--ease-standard),
			background var(--duration-fast) var(--ease-standard);
	}

	.modal-close:hover {
		color: var(--color-text-primary);
		background: var(--color-neutral-surface);
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-6);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-4);
		padding: var(--spacing-6);
		border-top: var(--border-width-1) solid var(--color-border);
		flex-shrink: 0;
	}
</style>
