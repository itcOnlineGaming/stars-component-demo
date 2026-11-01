import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SelfEfficacyChecklist from './SelfEfficacyChecklist.svelte';
import { createMockSelfEfficacyApi } from './mockSelfEfficacyApi';

describe('SelfEfficacyChecklist (Git Self-Efficacy Checklist)', () => {
	it('renders the title, date progress bar graph, and Today minimum level', async () => {
		const api = createMockSelfEfficacyApi();
		render(SelfEfficacyChecklist, { props: { api } });

		expect(
			await screen.findByRole('heading', { name: 'Git Self-Efficacy Checklist' })
		).toBeInTheDocument();

		const dateRegion = screen.getByRole('region', { name: 'Progress by date' });
		expect(within(dateRegion).getByLabelText('5 Oct minimum level: 1')).toBeInTheDocument();
		expect(within(dateRegion).getByLabelText('26 Oct minimum level: 2')).toBeInTheDocument();
		expect(within(dateRegion).getByLabelText(/Today .* minimum level: 3/)).toBeInTheDocument();
	});

	it('updates the Today bar in the date graph when a question is rated lower', async () => {
		const api = createMockSelfEfficacyApi();
		render(SelfEfficacyChecklist, { props: { api } });

		await screen.findByLabelText(/Today .* minimum level: 3/);

		const q1Group = screen.getByRole('group', {
			name: /Question 1: I can create a feature branch/
		});
		const level1Radio = within(q1Group).getByRole('radio', {
			name: '1 Not at all confident'
		});
		await level1Radio.click();

		expect(await screen.findByLabelText(/Today .* minimum level: 1/)).toBeInTheDocument();
	});

	it('resets all questions to level 1 when Reset checklist is clicked', async () => {
		const api = createMockSelfEfficacyApi();
		render(SelfEfficacyChecklist, { props: { api } });

		await screen.findByLabelText(/Today .* minimum level: 3/);

		await screen.getByRole('button', { name: 'Reset checklist' }).click();

		expect(await screen.findByLabelText(/Today .* minimum level: 1/)).toBeInTheDocument();
	});
});
