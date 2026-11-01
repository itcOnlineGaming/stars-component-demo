// Fails when a token that was removed from tokens.json is still used by a component.
//
//   npm run tokens:check -- [--strict]       (also run by tokens:build)
//
// "Removed" means present in the committed tokens.json (HEAD) and absent from the
// working copy, so it names exactly what a pending change takes away. Custom
// properties that components define for themselves are never flagged: they were
// never tokens.
//
// It also lists var(--name) uses of names that nothing defines: not tokens.json, and
// no CSS declaration, style:--name or setProperty('--name') anywhere in the web
// sources. A use without a fallback is always broken; one with a fallback silently
// shows the fallback, which hides typos. With --strict, uses without a fallback fail.
//
// And it lists components that use a palette step (--slate-900, --white) instead of a
// --color-* role, which would not follow the four themes. PALETTE_ALLOWED names the few
// files that keep fixed colours on purpose. With --strict, any other use fails.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');
const EXTENSION = 'com.artefacts.css';
const SOURCE_DIRS = ['ui', 'src'];
const SOURCE_FILE = /\.(css|svelte|js|ts)$/;
const SKIP_DIRS = new Set(['node_modules', 'build', '.svelte-kit']);
// Where app-wide custom properties are defined outside the component sources.
const DEFINITION_DIRS = ['static'];
const DEFINITION_FILE = /\.(css|svelte|js|ts|html)$/;
// Never loaded (commented out in stars/src/app.html), so it defines nothing.
const NOT_LOADED = /pico\.min\.css$/;
const TEST_FILE = /\.(test|spec)\.[jt]s$/;
// Files that may use palette steps directly, and why.
const PALETTE_ALLOWED = {};

/** Every CSS custom property name a tokens.json document defines. */
export function cssNames(tokens) {
	const names = new Set();
	(function walk(node) {
		for (const [key, value] of Object.entries(node)) {
			if (key.startsWith('$') || typeof value !== 'object') continue;
			if ('$value' in value) names.add(value.$extensions?.[EXTENSION]?.name);
			else walk(value);
		}
	})(tokens);
	names.delete(undefined);
	return names;
}

/** Names in the old document that the new one no longer defines. */
export function removedNames(before, after) {
	const kept = cssNames(after);
	return [...cssNames(before)].filter((name) => !kept.has(name));
}

/** `var(--name` uses of any of `names` in `text`, as { name, line }. */
export function findUses(text, names) {
	const uses = [];
	text.split('\n').forEach((lineText, index) => {
		for (const [, name] of lineText.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
			if (names.has(name)) uses.push({ name, line: index + 1 });
		}
	});
	return uses;
}

/** Custom property names `text` sets: declarations, style:--name and setProperty('--name'). */
export function definedNames(text) {
	const names = new Set();
	for (const [, name] of text.matchAll(/(?:^|[\s;{"'`])(--[\w-]+)\s*:/g)) names.add(name);
	for (const [, name] of text.matchAll(/style:(--[\w-]+)/g)) names.add(name);
	for (const [, name] of text.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) names.add(name);
	return names;
}

/** Every `var(--name` in `text`, as { name, line, fallback }. */
export function varUses(text) {
	const uses = [];
	text.split('\n').forEach((lineText, index) => {
		for (const [, name, comma] of lineText.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
			uses.push({ name, line: index + 1, fallback: Boolean(comma) });
		}
	});
	return uses;
}

function* sourceFiles(dir, pattern = SOURCE_FILE) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			if (!SKIP_DIRS.has(entry)) yield* sourceFiles(path, pattern);
		} else if (pattern.test(entry)) yield path;
	}
}

function* filesIn(dirs, pattern) {
	for (const dir of dirs) {
		try {
			yield* sourceFiles(join(webRoot, dir), pattern);
		} catch {
			// A workspace that is not checked out has nothing to scan.
		}
	}
}

/** Uses of names nothing defines: [{ file, name, line, fallback }]. Test files are skipped. */
export function undefinedUses(tokens) {
	const defined = cssNames(tokens);
	const texts = new Map();
	for (const file of filesIn([...SOURCE_DIRS, ...DEFINITION_DIRS], DEFINITION_FILE)) {
		if (NOT_LOADED.test(file)) continue;
		const text = readFileSync(file, 'utf8');
		texts.set(file, text);
		for (const name of definedNames(text)) defined.add(name);
	}
	const found = [];
	for (const [file, text] of texts) {
		if (TEST_FILE.test(file) || !SOURCE_FILE.test(file)) continue;
		for (const use of varUses(text)) {
			if (!defined.has(use.name)) found.push({ file: relative(webRoot, file), ...use });
		}
	}
	return found;
}

/** The palette's CSS names: white and every family step under `color`, not the roles. */
export function paletteNames(tokens) {
	const names = new Set();
	for (const [key, value] of Object.entries(tokens.color ?? {})) {
		if (typeof value !== 'object' || key.startsWith('$')) continue;
		// The families are groups; at the top level only white is a palette colour, the rest are roles.
		if (!('$value' in value)) for (const name of cssNames(value)) names.add(name);
		else if (key === 'white') names.add(value.$extensions?.[EXTENSION]?.name);
	}
	names.delete(undefined);
	return names;
}

/** Palette steps used outside the token files and PALETTE_ALLOWED: [{ file, name, line }]. */
export function paletteUses(tokens) {
	const palette = paletteNames(tokens);
	const found = [];
	for (const file of filesIn(SOURCE_DIRS, SOURCE_FILE)) {
		const path = relative(webRoot, file);
		if (path.startsWith('ui/tokens/') || TEST_FILE.test(file) || path in PALETTE_ALLOWED) continue;
		for (const use of findUses(readFileSync(file, 'utf8'), palette))
			found.push({ file: path, ...use });
	}
	return found;
}

/** The committed (HEAD) tokens.json text, or null when none is committed. */
export function committedTokensText() {
	for (const candidate of ['HEAD:ui/tokens/tokens.json', 'HEAD:web/ui/tokens/tokens.json']) {
		try {
			return execFileSync('git', ['show', candidate], {
				cwd: webRoot,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore']
			});
		} catch {
			// try next candidate
		}
	}
	return null;
}

export function committedTokens() {
	const text = committedTokensText();
	return text ? JSON.parse(text) : null;
}

/** Uses of removed tokens across the web sources: [{ file, name, line }]. */
export function removedTokenUses(before, after) {
	const removed = new Set(removedNames(before, after));
	if (!removed.size) return [];
	const found = [];
	for (const dir of SOURCE_DIRS) {
		let files;
		try {
			files = [...sourceFiles(join(webRoot, dir))];
		} catch {
			continue;
		}
		for (const file of files) {
			// The generated CSS is the token definitions, not a use.
			if (file.startsWith(here) && /\.css$/.test(file)) continue;
			for (const use of findUses(readFileSync(file, 'utf8'), removed)) {
				found.push({ file: relative(webRoot, file), ...use });
			}
		}
	}
	return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const strict = process.argv.includes('--strict');
	const after = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
	const before = committedTokens();
	if (!before) {
		console.log('tokens:check skipped the removed-token check: no committed tokens.json');
	} else {
		const uses = removedTokenUses(before, after);
		if (uses.length) {
			console.error('Removed tokens are still used:');
			for (const { file, name, line } of uses) console.error(`  ${file}:${line}  ${name}`);
			process.exit(1);
		}
		console.log(`tokens:check ok (${removedNames(before, after).length} removed, none in use)`);
	}

	const undefinedVars = undefinedUses(after);
	const broken = undefinedVars.filter((use) => !use.fallback);
	if (undefinedVars.length) {
		const report = strict ? console.error : console.log;
		report(
			`Custom properties used but never defined: ${broken.length} without a fallback, ` +
				`${undefinedVars.length - broken.length} with one`
		);
		for (const { file, name, line, fallback } of undefinedVars) {
			report(`  ${file}:${line}  ${name}${fallback ? '  (has a fallback)' : ''}`);
		}
		if (strict && broken.length) process.exit(1);
	}

	const palette = paletteUses(after);
	if (palette.length) {
		const report = strict ? console.error : console.log;
		report(`Palette steps used instead of a --color-* role: ${palette.length}`);
		for (const { file, name, line } of palette) report(`  ${file}:${line}  ${name}`);
		if (strict) process.exit(1);
	}
}
