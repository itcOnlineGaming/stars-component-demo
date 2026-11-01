// Flags raw values that should be design tokens (ui/tokens/tokens.json): lengths,
// hex, rgb()/hsl() and named colours, and font stacks. Keywords such as 0, auto,
// inherit, transparent and none pass, as do calc(), color-mix() and gradients built
// only from var()s. Custom property declarations are checked too, so a raw value
// cannot hide behind a component variable; the token files themselves are ignored.

/** A raw colour: hex, a colour function or a colour name (not inside a --name). */
const COLOUR = String.raw`#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|(?<![\w-])(white|black|gr[ae]y|silver|red|green|blue|orange|yellow|purple|pink)(?![\w-])`;

/** A raw length in one of `units` (not part of a --name such as --radius-2xl). */
const length = (units) => String.raw`(?<![\w.]|\w-)\d*\.?\d+(${units})\b`;

const any = (...patterns) => `/${patterns.join('|')}/i`;

const DISALLOWED = {
	color: [any(COLOUR)],
	'background-color': [any(COLOUR)],
	background: [any(COLOUR)],
	'border-color': [any(COLOUR)],
	'box-shadow': [any(length('px|rem|em'), COLOUR)],
	'font-size': [any(length('px|rem|em|pt'))],
	padding: [any(length('px|rem|em|pt'))],
	margin: [any(length('px|rem|em|pt'))],
	gap: [any(length('px|rem|em|pt'))],
	'border-radius': [any(length('px|rem|em|pt'))],
	'font-family': [String.raw`/^(?!(var\(--[\w-]+\)|inherit)$).+/`],
	'/^--/': [any(length('px|rem|em|pt'), COLOUR)]
};

// Border and outline widths (--border-width-*) and content column widths (--container-*).
// A max-width inside @media is a breakpoint, not checked.
const WIDTHS = {
	'/^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/': [
		any(length('px|rem|em|pt'))
	],
	'max-width': [any(length('px|rem|em|pt'))]
};

export default {
	overrides: [{ files: ['**/*.svelte'], customSyntax: 'postcss-html' }],
	rules: {
		'color-no-invalid-hex': [true, { severity: 'warning' }],
		'declaration-property-value-disallowed-list': [
			{ ...DISALLOWED, ...WIDTHS },
			{ severity: 'error' }
		]
	},
	ignoreFiles: [
		'ui/tokens/**',
		'**/node_modules/**',
		'**/.svelte-kit/**',
		'**/build/**',
		'**/storybook-static/**'
	]
};
