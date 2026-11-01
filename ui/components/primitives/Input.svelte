<!--
  Input
  -----
  Labelled text input for forms. Renders a <label> + <input> pair so the
  label is always associated with the control (no aria-label needed).

  Props
  -----
  type        — HTML input type (text | email | password | search | url | tel)
  label       — Visible label text shown above the field.
  placeholder — Placeholder hint shown inside the field.
  value       — Bindable current value.
  disabled    — Greyed-out; pointer events removed.
  error       — When set, renders the field in error state and shows the message below.
  id          — Forwarded to <input>; auto-generated from label when omitted.
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type InputType = 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'id'> {
		type?: InputType;
		label: string;
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		error?: string;
		id?: string;
	}

	let {
		type = 'text',
		label,
		placeholder = '',
		value = $bindable(''),
		disabled = false,
		error = '',
		id,
		class: extraClass = '',
		...rest
	}: Props = $props();

	const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
	const errorId = `${inputId}-error`;
</script>

<div class="field{extraClass ? ' ' + extraClass : ''}">
	<label class="field__label" for={inputId}>{label}</label>
	<input
		{type}
		{placeholder}
		{disabled}
		id={inputId}
		bind:value
		class="field__input{error ? ' field__input--error' : ''}"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : undefined}
		{...rest}
	/>
	{#if error}
		<span id={errorId} class="field__error" role="alert">{error}</span>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.field__label {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
		line-height: var(--leading-tight);
	}

	.field__input {
		font-family: var(--font-sans);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		background: var(--color-surface-raised);
		border: var(--border-width-1) solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-2) var(--spacing-3);
		width: 100%;
		box-sizing: border-box;
		transition: border-color var(--duration-fast) var(--ease-standard);
	}

	.field__input::placeholder {
		color: var(--color-text-muted);
	}

	.field__input:focus {
		outline: var(--border-width-2) solid var(--color-brand);
		outline-offset: 2px;
		border-color: var(--color-brand);
	}

	.field__input--error {
		border-color: var(--color-danger);
	}

	.field__input--error:focus {
		outline-color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.field__input:disabled {
		opacity: var(--opacity-disabled, 0.5);
		cursor: not-allowed;
		background: var(--color-neutral-surface);
	}

	.field__error {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		color: var(--color-danger-text);
		line-height: var(--leading-tight);
	}
</style>
