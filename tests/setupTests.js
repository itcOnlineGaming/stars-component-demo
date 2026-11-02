// /tests/setupTests.js
import '@testing-library/jest-dom/vitest';

// Mock getAnimations to prevent errors in JSDOM
Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
	value: () => []
});

// Mock element.animate to prevent errors from transitions using it
if (!HTMLElement.prototype.animate) {
	// Partial stub: cast so the return type matches the full Animation interface
	HTMLElement.prototype.animate = () =>
		/** @type {Animation} */ (
			/** @type {unknown} */ ({
				onfinish: null,
				cancel: () => {},
				play: () => {},
				pause: () => {},
				finished: Promise.resolve()
			})
		);
}
