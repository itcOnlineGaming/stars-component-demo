// A copy of tokens.json the designer can load into Tokens Studio (Figma).
//
//   npm run tokens:export -- [--out token_export.json]
//
// Tokens Studio keeps one object per token set, plus $metadata and $themes. Each top
// level group of tokens.json becomes a set and every token keeps its full path, so
// {color.blue.600} still resolves across sets. The four colour themes stay ordinary
// sets (color, color-dark, color-gamified-dark, color-gamified-light) because
// multi-dimensional themes are a paid Tokens Studio feature.
//
// Some tokens are left out on purpose; omitted() is the one list of them, so the
// import can tell "the designer removed this" from "it was never sent".
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const isToken = (node) => typeof node === 'object' && node !== null && '$value' in node;
const isRawCss = (value) =>
	typeof value === 'string' && value.includes('var(') && !/^\{.+\}$/.test(value);

/** Why a token is not sent, or null when it is. */
export function omittedReason(path, token) {
	// A gradient, a shadow written as one string, a colour mixed in CSS: no $type, and
	// Figma has no type to give them.
	if (!token.$type) return 'a CSS expression Figma cannot hold';
	// A var(--x, fallback) points at the skills app's own variables; Figma cannot follow it.
	if (isRawCss(token.$value)) return 'points at a CSS variable outside the tokens';
	return null;
}

/** Every token as { path, token } in file order. */
export function listTokens(tokens) {
	const found = [];
	(function walk(node, path) {
		for (const [key, value] of Object.entries(node)) {
			if (key.startsWith('$') || typeof value !== 'object') continue;
			if (isToken(value)) found.push({ path: [...path, key], token: value });
			else walk(value, [...path, key]);
		}
	})(tokens, []);
	return found;
}

/** Dotted paths of the tokens left out of the export, with the reason. */
export function omitted(tokens) {
	return listTokens(tokens)
		.map(({ path, token }) => ({ path: path.join('.'), reason: omittedReason(path, token) }))
		.filter(({ reason }) => reason);
}

function setIn(root, path, token) {
	let node = root;
	for (const key of path.slice(0, -1)) node = node[key] ??= {};
	const { $value, $type, $description } = token;
	node[path.at(-1)] = {
		$value,
		...($type && { $type }),
		...($description && { $description })
	};
}

/** tokens.json -> a Tokens Studio file: one set per top-level group. */
export function toTokensStudio(tokens) {
	const doc = {};
	const order = [];
	for (const { path, token } of listTokens(tokens)) {
		if (omittedReason(path, token)) continue;
		if (!(path[0] in doc)) {
			doc[path[0]] = {};
			order.push(path[0]);
		}
		setIn(doc[path[0]], path, token);
	}
	return { ...doc, $themes: [], $metadata: { tokenSetOrder: order } };
}

/**
 * A Tokens Studio file -> plain { path: value } for the tokens in it (every set merged).
 * Reads both $value and the older value spelling.
 */
export function fromTokensStudio(doc) {
	const found = {};
	const sets = Object.keys(doc).filter((key) => !key.startsWith('$'));
	for (const set of sets) {
		(function walk(node, path) {
			for (const [key, value] of Object.entries(node)) {
				if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
				const raw = '$value' in value ? value.$value : value.value;
				if (raw !== undefined) found[[...path, key].join('.')] = raw;
				else walk(value, [...path, key]);
			}
		})(doc[set], []);
	}
	return found;
}

function option(args, name) {
	const index = args.indexOf(name);
	return index === -1 ? null : args[index + 1];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	const tokens = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
	const pad = (n) => String(n).padStart(2, '0');
	const now = new Date();
	const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
		now.getHours()
	)}${pad(now.getMinutes())}`;
	const out = option(args, '--out') ?? `token_export_${stamp}.json`;
	const doc = toTokensStudio(tokens);
	writeFileSync(out, `${JSON.stringify(doc, null, '\t')}\n`);
	const sent = listTokens(tokens).length - omitted(tokens).length;
	console.log(`Wrote ${out}: ${sent} tokens in ${doc.$metadata.tokenSetOrder.length} sets`);
	const left = omitted(tokens);
	console.log(`Left out ${left.length} tokens:`);
	for (const { path, reason } of left) console.log(`  ${path}  (${reason})`);
}
