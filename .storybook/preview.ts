import type { Preview } from '@storybook/sveltekit';
import '../ui/tokens/index.css';
import '../ui/styles/reset.css';
import '../ui/styles/base.css';
import { applyEdits } from '../ui/tokens/story-tokens.js';

const preview: Preview = {
	globalTypes: {
		look: {
			description: 'Look',
			toolbar: { title: 'Look', icon: 'grid', items: ['standard', 'gamified'], dynamicTitle: true }
		},
		theme: {
			description: 'Colour theme',
			toolbar: { title: 'Theme', icon: 'paintbrush', items: ['light', 'dark'], dynamicTitle: true }
		},
		tokenEdits: {
			description: 'Show tokens changed in Tokens/Playground in every story',
			toolbar: {
				icon: 'contrast',
				items: [
					{ value: 'on', title: 'Playground edits: on' },
					{ value: 'off', title: 'Playground edits: off' }
				],
				dynamicTitle: true
			}
		}
	},
	initialGlobals: { look: 'standard', theme: 'light', tokenEdits: 'on' },
	decorators: [
		(story, { globals }) => {
			document.documentElement.dataset.look = globals.look;
			document.documentElement.dataset.theme = globals.theme;
			applyEdits(document.documentElement, globals.tokenEdits !== 'off');
			return story();
		}
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},
		a11y: {
			test: 'todo'
		}
	}
};

export default preview;
