// Prints what a pending tokens.json change adds, removes and changes.
//
//   npm run tokens:diff        (also run by tokens:build)
//
// Compares the working tokens.json with the committed one. Tokens are matched by
// path (admin.light.page and admin.dark.page are different tokens that share a CSS
// name), and an alias change shows the colour it resolves to as well.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { committedTokens } from './check-usage.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const EXTENSION = 'com.artefacts.css';

/** Map of dotted path -> { name, value } for every token in a tokens.json document. */
export function flatten(tokens) {
	const flat = new Map();
	(function walk(node, path) {
		for (const [key, value] of Object.entries(node)) {
			if (key.startsWith('$') || typeof value !== 'object') continue;
			if ('$value' in value) {
				flat.set([...path, key].join('.'), {
					name: value.$extensions?.[EXTENSION]?.name ?? null,
					value: value.$value
				});
			} else walk(value, [...path, key]);
		}
	})(tokens, []);
	return flat;
}

const show = (value) => (typeof value === 'string' ? value : JSON.stringify(value));

/** Follow {a.b} references to the value at the end of the chain. */
function resolve(flat, value, seen = new Set()) {
	const ref = typeof value === 'string' && value.match(/^\{(.+)\}$/);
	if (!ref || seen.has(ref[1]) || !flat.has(ref[1])) return value;
	return resolve(flat, flat.get(ref[1]).value, seen.add(ref[1]));
}

/** What shows for a value: the alias, and what it resolves to when it is one. */
function describe(flat, value) {
	const resolved = resolve(flat, value);
	return resolved === value ? show(value) : `${show(value)} (${show(resolved)})`;
}

/** { added, removed, changed } between two tokens.json documents, each entry with a path. */
export function diffTokens(before, after) {
	const a = flatten(before);
	const b = flatten(after);
	const added = [];
	const removed = [];
	const changed = [];
	for (const [path, token] of b) {
		if (!a.has(path)) added.push({ path, name: token.name, value: describe(b, token.value) });
	}
	for (const [path, token] of a) {
		if (!b.has(path)) {
			removed.push({ path, name: token.name, value: describe(a, token.value) });
			continue;
		}
		const next = b.get(path);
		const was = describe(a, token.value);
		const now = describe(b, next.value);
		// An alias whose target changed reads the same in the file but not on screen.
		if (was !== now || token.name !== next.name) {
			changed.push({ path, name: next.name, was, now, renamed: token.name !== next.name });
		}
	}
	return { added, removed, changed };
}

export const isEmpty = (diff) => !diff.added.length && !diff.removed.length && !diff.changed.length;

/** The diff as text for a terminal or an email to the designer. */
export function formatDiff(diff) {
	if (isEmpty(diff)) return 'No token changes.';
	const lines = [
		`${diff.changed.length} changed, ${diff.added.length} added, ${diff.removed.length} removed`
	];
	const label = (item) => (item.name ? `${item.path} (${item.name})` : item.path);
	for (const item of diff.changed) {
		lines.push(
			`  ~ ${label(item)}: ${item.was} -> ${item.now}${item.renamed ? ' [CSS name changed]' : ''}`
		);
	}
	for (const item of diff.added) lines.push(`  + ${label(item)}: ${item.value}`);
	for (const item of diff.removed) lines.push(`  - ${label(item)}: ${item.value}`);
	return lines.join('\n');
}

/** One line for the preview index: the counts and the first few token paths. */
export function summarise(diff, listed = 3) {
	if (isEmpty(diff)) return 'No token changes';
	const counts = [
		[diff.changed.length, 'changed'],
		[diff.added.length, 'added'],
		[diff.removed.length, 'removed']
	]
		.filter(([count]) => count)
		.map(([count, word]) => `${count} ${word}`)
		.join(', ');
	const paths = [...diff.changed, ...diff.added, ...diff.removed].map((item) => item.path);
	const more = paths.length > listed ? `, +${paths.length - listed} more` : '';
	return `${counts}: ${paths.slice(0, listed).join(', ')}${more}`;
}

/** Diff of the working tokens.json against the committed one (null when none is committed). */
export function pendingDiff() {
	const before = committedTokens();
	if (!before) return null;
	return diffTokens(before, JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8')));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const diff = pendingDiff();
	console.log(
		diff ? formatDiff(diff) : 'tokens:diff skipped: no committed tokens.json to compare with'
	);
}
