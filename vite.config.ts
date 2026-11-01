/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: process.env.VITEST ? [] : [sveltekit()],
	resolve: {
		alias: {
			$ui: path.resolve(dirname, './ui'),
			$lib: path.resolve(dirname, './src/lib'),
			$components: path.resolve(dirname, './src/lib/component')
		}
	},
	server: {
		fs: {
			allow: [
				path.resolve(dirname, './ui'),
				path.resolve(dirname, './src'),
				path.resolve(dirname, './static'),
				path.resolve(dirname, './.svelte-kit'),
				path.resolve(dirname, './node_modules')
			]
		}
	},
	test: {
		projects: [
			{
				extends: true,
				plugins: [sveltekit(), svelteTesting()],
				test: {
					name: 'unit',
					testTimeout: 15000,
					include: ['src/**/*.{test,spec}.{js,ts}'],
					environment: 'jsdom',
					globals: true,
					setupFiles: './tests/setupTests.js'
				}
			}
		]
	}
});
