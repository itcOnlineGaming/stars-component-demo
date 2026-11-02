import type { StorybookConfig } from '@storybook/sveltekit';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|ts)'],
	addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
	framework: '@storybook/sveltekit',
	viteFinal: async (config) => {
		config.resolve ??= {};
		config.resolve.alias = {
			...config.resolve.alias,
			$ui: resolve(__dirname, '../ui'),
			$lib: resolve(__dirname, '../src/lib'),
			$components: resolve(__dirname, '../src/lib/component')
		};
		// Storybook replaces vite.config.ts's `server` block, so re-allow ui/ here
		config.server ??= {};
		config.server.fs ??= {};
		config.server.fs.allow = [...(config.server.fs.allow ?? []), resolve(__dirname, '../ui')];
		return config;
	}
};

export default config;
