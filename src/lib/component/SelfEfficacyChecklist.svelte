<script lang="ts">
	import { Button, Card } from '$ui/components';
	import { createMockSelfEfficacyApi, findMinimumSkill } from './mockSelfEfficacyApi';
	import type {
		CompetencyQuestion,
		ConfidenceRating,
		ProgressDateEntry,
		SelfEfficacyApi
	} from './types';

	interface Props {
		/**
		 * Staged API adapter:
		 * - Stage 1: defaults to `createMockSelfEfficacyApi()` (returns static JSON in memory)
		 * - Stage 2: pass `createHttpSelfEfficacyApi()` (or the live STARS API client)
		 */
		api?: SelfEfficacyApi;
	}

	let { api = createMockSelfEfficacyApi() }: Props = $props();

	const RATING_LEVELS: {
		value: ConfidenceRating;
		legendLabel: string;
		ariaLabel: string;
	}[] = [
		{ value: 1, legendLabel: 'Not at all confident', ariaLabel: '1 Not at all confident' },
		{ value: 2, legendLabel: 'Low confidence', ariaLabel: '2' },
		{ value: 3, legendLabel: 'Moderate confidence', ariaLabel: '3' },
		{ value: 4, legendLabel: 'Confident', ariaLabel: '4' },
		{ value: 5, legendLabel: 'Very confident', ariaLabel: '5 Very confident' }
	];

	let title = $state('Git Self-Efficacy Checklist');
	let history = $state<ProgressDateEntry[]>([]);
	let questions = $state<CompetencyQuestion[]>([]);
	let ratings = $state<Record<string, ConfidenceRating>>({});
	let isLoading = $state(true);
	let errorMessage = $state('');

	const minimumSummary = $derived(findMinimumSkill(questions, ratings));

	const todayIso = new Date().toISOString().slice(0, 10);

	function parseDayAndMonth(isoDate: string): { day: string; month: string } {
		const parsed = new Date(`${isoDate}T12:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			return { day: isoDate, month: '' };
		}
		return {
			day: String(parsed.getDate()),
			month: parsed.toLocaleDateString('en-IE', { month: 'short' })
		};
	}

	const chartBars = $derived.by(() => {
		const rawEntries = [
			...history.map((item) => ({
				date: item.date,
				minRating: item.minRating,
				isToday: false
			})),
			{
				date: todayIso,
				minRating: minimumSummary.minRating,
				isToday: true
			}
		];

		let previousMonth = '';
		return rawEntries.map((entry) => {
			const { day, month } = parseDayAndMonth(entry.date);
			const showMonth = month !== previousMonth;
			previousMonth = month;
			return {
				...entry,
				day,
				month,
				showMonth
			};
		});
	});

	async function hydrateFromApi(activeApi: SelfEfficacyApi) {
		isLoading = true;
		errorMessage = '';
		try {
			const payload = await activeApi.loadChecklist();
			title = payload.title;
			history = payload.history ?? [];
			questions = payload.questions;
			ratings = payload.ratings;
		} catch (err) {
			errorMessage =
				err instanceof Error
					? err.message
					: 'Unable to load checklist data from the configured API.';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		void hydrateFromApi(api);
	});

	async function handleRatingChange(questionId: string, rating: ConfidenceRating) {
		errorMessage = '';
		ratings = { ...ratings, [questionId]: rating };
		try {
			const result = await api.updateQuestionRating(questionId, rating);
			ratings = result.ratings;
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'Could not save confidence rating update.';
		}
	}

	async function handleResetChecklist() {
		errorMessage = '';
		try {
			const payload = await api.resetChecklist();
			ratings = payload.ratings;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Could not reset checklist.';
		}
	}
</script>

<div class="checklist-shell">
	<Card variant="raised" padding="md" shadow="sm">
		<div class="header-top">
			<h1 class="checklist-title">{title}</h1>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				disabled={isLoading}
				onclick={handleResetChecklist}
			>
				Reset checklist
			</Button>
		</div>

		<div class="bar-chart" role="region" aria-label="Progress by date">
			{#each chartBars as bar (bar.date + (bar.isToday ? '-today' : ''))}
				<div
					class="bar-column"
					aria-label={bar.isToday
						? `Today (${bar.day} ${bar.month}) minimum level: ${bar.minRating}`
						: `${bar.day} ${bar.month} minimum level: ${bar.minRating}`}
					title="{bar.day} {bar.month}{bar.isToday ? ' (Today)' : ''}: Level {bar.minRating}/5"
				>
					<div class="bar-area">
						<div
							class="bar-block level-{bar.minRating}"
							style:height="{bar.minRating * 20}%"
						>
							<span class="bar-number">{bar.minRating}</span>
						</div>
					</div>
					<span class="bar-day{bar.isToday ? ' bar-day--today' : ''}">{bar.day}</span>
					<span class="bar-month{bar.isToday ? ' bar-month--today' : ''}">
						{bar.showMonth ? bar.month : '\u00A0'}
					</span>
				</div>
			{/each}
		</div>

		<ul class="legend-list" aria-label="Confidence scale legend">
			{#each RATING_LEVELS as item (item.value)}
				<li class="legend-item">
					<span class="swatch swatch--sm level-{item.value}">{item.value}</span>
					<span>{item.legendLabel}</span>
				</li>
			{/each}
		</ul>
	</Card>

	{#if errorMessage}
		<div class="error-banner" role="alert">
			<span>{errorMessage}</span>
		</div>
	{/if}

	<Card variant="raised" padding="md" shadow="sm">
		{#if isLoading}
			<p class="loading-text">Loading questions...</p>
		{:else}
			<ol class="question-list">
				{#each questions as question (question.id)}
					{@const currentRating = ratings[question.id] ?? 1}
					<li class="question-row">
						<div class="question-copy">
							<span class="question-number">Question {question.questionNumber}</span>
							<p class="question-statement">{question.statement}</p>
						</div>

						<fieldset class="rating-squares">
							<legend class="sr-only">
								Question {question.questionNumber}: {question.statement}
							</legend>
							{#each RATING_LEVELS as option (option.value)}
								{@const isSelected = currentRating === option.value}
								<label
									class="square-choice level-{option.value}{isSelected
										? ' square-choice--selected'
										: ''}"
									title="{option.value}: {option.legendLabel}"
								>
									<input
										type="radio"
										class="sr-only"
										name="rating-{question.id}"
										value={option.value}
										aria-label={option.ariaLabel}
										checked={isSelected}
										onchange={() => handleRatingChange(question.id, option.value)}
									/>
									<span>{option.value}</span>
								</label>
							{/each}
						</fieldset>
					</li>
				{/each}
			</ol>
		{/if}
	</Card>
</div>

<style>
	.checklist-shell {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-5);
		max-width: var(--container-md);
		margin: var(--spacing-0) auto;
		padding: var(--spacing-6) var(--spacing-4);
		font-family: var(--font-sans);
		color: var(--color-text-primary);
	}

	.header-top {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-3);
		margin-bottom: var(--spacing-4);
	}

	.checklist-title {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		line-height: var(--leading-tight);
		margin: var(--spacing-0);
	}

	.bar-chart {
		display: inline-flex;
		align-items: flex-end;
		gap: var(--spacing-0);
		padding-bottom: var(--spacing-4);
		border-bottom: var(--border-width-1) solid var(--color-border);
	}

	.bar-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: var(--spacing-8);
	}

	.bar-area {
		width: 100%;
		height: var(--spacing-16);
		display: flex;
		align-items: flex-end;
		border-bottom: var(--border-width-2) solid var(--color-border-hover);
	}

	.bar-block {
		width: 100%;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: var(--spacing-1);
		transition: height var(--duration-fast) var(--ease-standard);
	}

	.bar-number {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: var(--font-bold);
		line-height: var(--leading-tight);
	}

	.bar-day {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-primary);
		padding-top: var(--spacing-1);
		line-height: var(--leading-tight);
	}

	.bar-day--today {
		font-weight: var(--font-bold);
		color: var(--color-brand-text);
	}

	.bar-month {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: var(--leading-tight);
	}

	.bar-month--today {
		font-weight: var(--font-bold);
		color: var(--color-brand-text);
	}

	/* 5 graduated shades of the same colour (--color-brand) */
	.swatch {
		display: inline-grid;
		place-items: center;
		min-width: var(--spacing-8);
		height: var(--spacing-8);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--font-bold);
		border: var(--border-width-1) solid var(--color-border);
	}

	.swatch--sm {
		min-width: var(--spacing-6);
		height: var(--spacing-6);
		font-size: var(--text-xs);
	}

	.level-1 {
		background: color-mix(in srgb, var(--color-brand) 12%, var(--color-surface-raised));
		color: var(--color-text-primary);
	}

	.level-2 {
		background: color-mix(in srgb, var(--color-brand) 30%, var(--color-surface-raised));
		color: var(--color-text-primary);
	}

	.level-3 {
		background: color-mix(in srgb, var(--color-brand) 52%, var(--color-surface-raised));
		color: var(--color-on-brand);
	}

	.level-4 {
		background: color-mix(in srgb, var(--color-brand) 76%, var(--color-surface-raised));
		color: var(--color-on-brand);
	}

	.level-5 {
		background: var(--color-brand);
		color: var(--color-on-brand);
	}

	.legend-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3) var(--spacing-5);
		margin: var(--spacing-4) var(--spacing-0) var(--spacing-0) var(--spacing-0);
		padding: var(--spacing-0);
		list-style: none;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.error-banner {
		padding: var(--spacing-3) var(--spacing-4);
		border-radius: var(--radius-lg);
		font-size: var(--text-sm);
		background: var(--color-danger-surface);
		color: var(--color-danger-text);
		border: var(--border-width-1) solid var(--color-danger);
	}

	.question-list {
		list-style: none;
		margin: var(--spacing-0);
		padding: var(--spacing-0);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
	}

	.question-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-4);
		padding: var(--spacing-3) var(--spacing-4);
		background: var(--color-surface);
		border: var(--border-width-1) solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.question-copy {
		flex: 1;
		min-width: var(--column-min-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.question-number {
		font-size: var(--text-xs);
		font-weight: var(--font-bold);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.question-statement {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		margin: var(--spacing-0);
	}

	.rating-squares {
		display: flex;
		gap: var(--spacing-2);
		border: none;
		padding: var(--spacing-0);
		margin: var(--spacing-0);
	}

	.square-choice {
		display: inline-grid;
		place-items: center;
		min-width: var(--spacing-8);
		height: var(--spacing-8);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: var(--font-bold);
		cursor: pointer;
		opacity: 0.45;
		border: var(--border-width-2) solid transparent;
		transition:
			opacity var(--duration-fast) var(--ease-standard),
			border-color var(--duration-fast) var(--ease-standard);
	}

	.square-choice:hover {
		opacity: 0.8;
	}

	.square-choice--selected {
		opacity: 1;
		border-color: var(--color-text-primary);
	}

	.square-choice:focus-within {
		opacity: 1;
		outline: var(--border-width-2) solid var(--color-focus);
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: var(--spacing-0);
	}

	.sr-only {
		position: absolute;
		width: var(--border-width-1);
		height: var(--border-width-1);
		padding: var(--spacing-0);
		margin: var(--spacing-0);
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: var(--spacing-0);
	}
</style>
