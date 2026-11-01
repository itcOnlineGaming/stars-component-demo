// tokens.json for the Storybook token pages (Tokens/Swatches, Tokens/Playground).
//
// Browser-safe: the other scripts here read files with node:fs, so this keeps its own
// small walk. Each token comes back with its path, CSS name, type, value as written and
// the value at the end of any {alias} chain.
import tokens from './tokens.json';

const EXTENSION = 'com.artefacts.css';
const GENERIC_FAMILIES = new Set([
	'system-ui',
	'ui-monospace',
	'sans-serif',
	'serif',
	'monospace',
	'cursive'
]);

/** Every token in a tokens.json document as { path, name, type, value, resolved }. */
export function tokenList(doc = tokens) {
	const found = [];
	(function walk(node, path) {
		for (const [key, value] of Object.entries(node)) {
			if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
			if ('$value' in value) {
				found.push({
					path: [...path, key].join('.'),
					name: value.$extensions?.[EXTENSION]?.name ?? null,
					type: value.$type ?? null,
					value: value.$value
				});
			} else walk(value, [...path, key]);
		}
	})(doc, []);
	const byPath = new Map(found.map((token) => [token.path, token]));
	const resolve = (value, seen = new Set()) => {
		const ref = typeof value === 'string' && value.match(/^\{(.+)\}$/);
		if (!ref || seen.has(ref[1]) || !byPath.has(ref[1])) return value;
		return resolve(byPath.get(ref[1]).value, seen.add(ref[1]));
	};
	return found.map((token) => ({ ...token, resolved: resolve(token.value) }));
}

const formatShadow = (layer) =>
	[layer.offsetX, layer.offsetY, layer.blur, layer.spread === '0' ? null : layer.spread, layer.color]
		.filter(Boolean)
		.join(' ');

/** A token's resolved value as CSS text, written the way sd.config.mjs writes it. */
export function cssText(token) {
	const value = token.resolved;
	switch (token.type) {
		case 'shadow':
			return (Array.isArray(value) ? value : [value]).map(formatShadow).join(', ');
		case 'cubicBezier':
			return `cubic-bezier(${value.join(', ')})`;
		case 'fontFamily':
			return value.map((name) => (GENERIC_FAMILIES.has(name) ? name : `'${name}'`)).join(', ');
		default:
			return String(value);
	}
}

/** The colour tokens, in the sections the swatch page shows. */
export function colourSections(list = tokenList()) {
	const colours = list.filter((token) => token.type === 'color');
	const depth = (token) => token.path.split('.').length;
	return [
		{
			title: 'Semantic',
			note: 'Use these in components.',
			tokens: colours.filter((t) => t.path.startsWith('color.') && depth(t) === 2)
		},
		{
			title: 'Palette',
			note: 'Tier 1: referenced by the semantic colours, never by components.',
			tokens: colours.filter((t) => t.path.startsWith('color.') && depth(t) === 3)
		},
		{
			title: 'Standard dark',
			note: 'Same CSS names as the semantic colours; set Theme to dark to see these swatches.',
			tokens: colours.filter((t) => t.path.startsWith('color-dark.'))
		},
		{
			title: 'Gamified dark',
			note: 'Same CSS names; set Look to gamified and Theme to dark to see these swatches.',
			tokens: colours.filter((t) => t.path.startsWith('color-gamified-dark.'))
		},
		{
			title: 'Gamified light',
			note: 'Same CSS names; set Look to gamified and Theme to light to see these swatches.',
			tokens: colours.filter((t) => t.path.startsWith('color-gamified-light.'))
		}
	];
}

// The groups the playground edits, in the order its Controls categories appear. The
// other themes (color-dark, color-gamified-*) and shadow-dark are left out: they share
// CSS names with color and shadow, so one edit would land in every theme.
const EDITABLE_GROUPS = [
	'color',
	'spacing',
	'radius',
	'border-width',
	'size',
	'shadow',
	'motion',
	'typography'
];

/** The Controls category a token's picker sits under. */
function category(token) {
	const [group, second] = token.path.split('.');
	if (group === 'color') return token.path.split('.').length === 2 ? 'Semantic colours' : 'Palette';
	if (group === 'typography') return `Typography: ${second}`;
	if (group === 'motion') return `Motion: ${second}`;
	if (group === 'size') return `Size: ${second}`;
	if (group === 'border-width') return 'Border width';
	return group[0].toUpperCase() + group.slice(1);
}

/** The Storybook control for a token's type. */
function control(token) {
	switch (token.type) {
		case 'color':
			return 'color';
		case 'fontWeight':
			return { type: 'number', min: 100, max: 900, step: 100 };
		case 'number':
			return { type: 'number', step: 0.05 };
		default:
			return 'text';
	}
}

/**
 * The tokens the playground can change, as { path, name, key, css, category, control }.
 * `key` is the CSS name without its dashes (an arg name), `css` the current CSS value.
 */
export function editableTokens(list = tokenList()) {
	return list
		.filter((token) => EDITABLE_GROUPS.includes(token.path.split('.')[0]) && token.name)
		.map((token) => ({
			path: token.path,
			name: token.name,
			key: token.name.slice(2),
			css: cssText(token),
			category: category(token),
			control: control(token)
		}));
}

// Playground edits, kept in this browser so every story can show them: { cssName: value }.
// Storage can be missing or blocked (private windows, tests), so every access is guarded.
//
// The browser keeps one storage per site, and every published preview is a folder on
// the same site (/storybook/dev/<build id>/), so the key includes the folder. Edits made
// in one preview then never show in another, and a new preview opens as its tokens.json.

/** The storage key for the Storybook served from `pathname`'s folder. */
export const editsKey = (pathname) =>
	`artefacts.tokens.playground:${pathname.replace(/[^/]*$/, '')}`;

function currentKey() {
	return editsKey(globalThis.location?.pathname ?? '/');
}

/** The saved playground edits, or {} when there are none. */
export function loadEdits() {
	try {
		return JSON.parse(localStorage.getItem(currentKey()) ?? '{}');
	} catch {
		return {};
	}
}

/** Save `edits` ({ cssName: value }), or forget them when there are none. */
export function saveEdits(edits) {
	try {
		if (Object.keys(edits).length) localStorage.setItem(currentKey(), JSON.stringify(edits));
		else localStorage.removeItem(currentKey());
	} catch {
		// Not saved: the playground still shows the edits, other stories do not.
	}
}

/** Set the saved edits on `root` as inline custom properties, or clear them when `on` is false. */
export function applyEdits(root, on, edits = loadEdits()) {
	for (const token of editableTokens()) root.style.removeProperty(token.name);
	if (!on) return;
	for (const [name, value] of Object.entries(edits)) root.style.setProperty(name, value);
}
