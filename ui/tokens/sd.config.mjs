// Generates the CSS in this directory from tokens.json (Style Dictionary).
//
//   npm run tokens:build        (from web/stars)
//
// Each token names its own CSS custom property in
// $extensions["com.artefacts.css"].name, so --names stay exactly as components
// use them. Style Dictionary resolves every {reference} and fails the build on
// one that points nowhere. Values are written from the token's original value
// so aliases stay var(--other).
import StyleDictionary from 'style-dictionary';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const HEADER = '/* Generated from tokens.json — do not edit */';
const EXTENSION = 'com.artefacts.css';
const GENERIC_FAMILIES = new Set([
	'system-ui',
	'ui-monospace',
	'sans-serif',
	'serif',
	'monospace',
	'cursive'
]);

const cssName = (token) => token.$extensions[EXTENSION].name;
const group =
	(...names) =>
	(token) =>
		names.includes(token.path[0]);

const formatShadow = (layer) =>
	[
		layer.offsetX,
		layer.offsetY,
		layer.blur,
		layer.spread === '0' ? null : layer.spread,
		layer.color
	]
		.filter(Boolean)
		.join(' ');

/** The CSS text for a token's value, written from the original so an alias stays var(--other). */
function cssValue(token, byPath) {
	const value = token.original.$value;
	if (typeof value === 'string' && /^\{.+\}$/.test(value)) {
		return `var(${cssName(byPath.get(value.slice(1, -1)))})`;
	}
	switch (token.$type) {
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

StyleDictionary.registerFormat({
	name: 'artefacts/css',
	format: ({ dictionary, file }) => {
		const { preamble, blocks } = file.options;
		const byPath = new Map(dictionary.allTokens.map((token) => [token.path.join('.'), token]));
		const out = [HEADER];
		if (preamble) out.push(`/*\n${preamble}\n */`);
		for (const block of blocks) {
			const tokens = dictionary.allTokens.filter(block.filter);
			const lines = tokens.map((token) => `\t${cssName(token)}: ${cssValue(token, byPath)};`);
			if (block.comment) lines.unshift(`\t/* ${block.comment.replace(/\n/g, '\n\t   ')} */`);
			out.push(`${block.selector} {\n${lines.join('\n')}\n}`);
		}
		return `${out.join('\n\n')}\n`;
	}
});

const root = (filter) => ({ selector: ':root', filter });

const COLORS_PREAMBLE = ` * Tier 1: the palette (--slate-50, --purple-600 ...), white and six families.
 *
 * Tier 2: the colour roles (--color-*). Components use these, never tier 1 directly. Each
 * role has a value in four themes: the app picks the look with data-look on <html>
 * (standard or gamified) and the person picks light or dark with data-theme.
 *
 * brand          primary action fill (buttons). -hover, -surface (a tint behind brand
 *                content), -text (brand-coloured text and links), on-brand (text on a fill).
 * accent         secondary colour (decoration, highlights, not primary actions).
 * surface        the page. surface-raised: cards, panels, menus. surface-hover. scrim: the
 *                dimmer behind a dialog.
 * text-primary   body copy and headings. text-muted: secondary text, labels.
 * border         dividers and inputs. border-hover: stronger lines. focus: focus rings.
 * success / danger / warning / info / neutral: the base is a fill or an icon, -surface a
 *                tint, -text the text on that tint (and status-coloured text anywhere).
 *                success-border: a green border, outline or ring.
 * reward / reward-strong / on-reward, glow, edge: stars, rewards and game cards.
 * header-bg / header-text / header-rule / nav-hover / nav-active: the app header bar.`;

const COLORS_DARK_COMMENT = `Standard dark, switched on by the skills app's toggle (one data-theme attribute
on <html>); the stars app never sets it, so this block is inert there. Every
semantic colour has a value here, so nothing stays light in dark mode. The brand
blue stays deep: it is a fill behind white button text, which a lighter shade
would take below 4.5:1.`;

const GAMIFIED_DARK_COMMENT = `Gamified dark: the same --color-* names in the skills app's gamified look. The app
picks the look (data-look on <html>), the person picks light or dark (data-theme);
gamified is dark unless data-theme is light. Same specificity as the standard dark
block and written after it, so the gamified look wins.`;

const GAMIFIED_LIGHT_COMMENT = `Gamified light.`;

const FILES = [
	{
		destination: '_colors.css',
		options: {
			preamble: COLORS_PREAMBLE,
			blocks: [
				root(group('color')),
				{
					selector: ":root[data-theme='dark']",
					comment: COLORS_DARK_COMMENT,
					filter: group('color-dark')
				},
				{
					selector: ":root[data-look='gamified']",
					comment: GAMIFIED_DARK_COMMENT,
					filter: group('color-gamified-dark')
				},
				{
					selector: ":root[data-look='gamified'][data-theme='light']",
					comment: GAMIFIED_LIGHT_COMMENT,
					filter: group('color-gamified-light')
				}
			]
		}
	},
	{ destination: '_spacing.css', options: { blocks: [root(group('spacing'))] } },
	{ destination: '_radius.css', options: { blocks: [root(group('radius'))] } },
	{ destination: '_border.css', options: { blocks: [root(group('border-width'))] } },
	{ destination: '_size.css', options: { blocks: [root(group('size'))] } },
	{
		destination: '_shadow.css',
		options: {
			blocks: [
				root(group('shadow')),
				{ selector: ":root[data-theme='dark']", filter: group('shadow-dark') }
			]
		}
	},
	{ destination: '_motion.css', options: { blocks: [root(group('motion'))] } },
	{ destination: '_typography.css', options: { blocks: [root(group('typography'))] } }
];

/** Build every generated file into `destination` (default: this directory). */
export async function build(destination = here, { quiet = false } = {}) {
	const sd = new StyleDictionary({
		source: [join(here, 'tokens.json')],
		usesDtcg: true,
		log: {
			warnings: 'warn',
			verbosity: quiet ? 'silent' : 'default',
			errors: { brokenReferences: 'throw' }
		},
		platforms: {
			css: {
				transforms: ['name/kebab'],
				buildPath: `${destination}/`,
				files: FILES.map((file) => ({ ...file, format: 'artefacts/css' }))
			}
		}
	});
	await sd.buildAllPlatforms();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
