import type { Meta, StoryObj } from '@storybook/sveltekit';
import SelfEfficacyChecklist from './SelfEfficacyChecklist.svelte';
import { createMockSelfEfficacyApi } from './mockSelfEfficacyApi';

const meta = {
	title: 'StudentDemo/SelfEfficacyChecklist',
	component: SelfEfficacyChecklist,
	parameters: {
		layout: 'fullscreen'
	}
} satisfies Meta<typeof SelfEfficacyChecklist>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultStage1Mock: Story = {
	args: {
		api: createMockSelfEfficacyApi()
	}
};

export const FreshStartBaseline: Story = {
	args: {
		api: createMockSelfEfficacyApi({
			ratings: {
				q1: 1,
				q2: 1,
				q3: 1,
				q4: 1,
				q5: 1,
				q6: 1,
				q7: 1,
				q8: 1,
				q9: 1,
				q10: 1,
				q11: 1,
				q12: 1,
				q13: 1
			}
		})
	}
};

export const HighConfidence: Story = {
	args: {
		api: createMockSelfEfficacyApi({
			ratings: {
				q1: 5,
				q2: 5,
				q3: 5,
				q4: 5,
				q5: 5,
				q6: 5,
				q7: 4,
				q8: 4,
				q9: 5,
				q10: 5,
				q11: 5,
				q12: 5,
				q13: 5
			}
		})
	}
};
