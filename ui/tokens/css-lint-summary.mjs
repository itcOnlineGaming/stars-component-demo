// Counts the stylelint warnings for raw values (lengths, colours, fonts) that should be
// design tokens, per app and per property.
//
//   npm run lint:css:summary -- [--max N]
//
// The rule is in web/stylelint.config.mjs. With --max it fails when there are more than N
// warnings, so CI can hold the count while apps move to tokens.
import stylelint from 'stylelint';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');
export const APPS = [
	'stars/src',
	'ui',
	'skills/src',
	'polling/src',
	'admin-skills/src',
	'admin-class-groups/src',
	'admin-exercises/src'
];

/** { total, files, byApp, byProperty } for a list of stylelint results. */
export function summarise(results, root = webRoot) {
	const byApp = {};
	const byProperty = {};
	let total = 0;
	let files = 0;
	for (const result of results) {
		const warnings = result.warnings.filter(
			(w) => w.rule === 'declaration-property-value-disallowed-list'
		);
		if (!warnings.length) continue;
		files++;
		const app = relative(root, result.source).split('/')[0];
		byApp[app] = (byApp[app] ?? 0) + warnings.length;
		for (const warning of warnings) {
			const name = warning.text.match(/for property "([\w-]+)"/)?.[1] ?? '?';
			// Each component names its own custom properties; count them together.
			const property = name.startsWith('--') ? 'custom properties' : name;
			byProperty[property] = (byProperty[property] ?? 0) + 1;
			total++;
		}
	}
	return { total, files, byApp, byProperty };
}

const sorted = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1]);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	const maxAt = args.indexOf('--max');
	const max = maxAt === -1 ? null : Number(args[maxAt + 1]);
	const { results } = await stylelint.lint({
		files: APPS.map((app) => join(webRoot, app, '**/*.{css,svelte}')),
		configFile: join(webRoot, 'stylelint.config.mjs'),
		ignorePath: join(webRoot, '.stylelintignore'),
		allowEmptyInput: true
	});
	const { total, files, byApp, byProperty } = summarise(results);
	console.log(`${total} raw values in ${files} of ${results.length} files`);
	console.log('\nBy app:');
	for (const [app, n] of sorted(byApp)) console.log(`  ${String(n).padStart(5)}  ${app}`);
	console.log('\nBy property:');
	for (const [property, n] of sorted(byProperty)) {
		console.log(`  ${String(n).padStart(5)}  ${property}`);
	}
	if (max !== null && total > max) {
		console.error(`\n${total} is over the limit of ${max}.`);
		process.exit(1);
	}
}
