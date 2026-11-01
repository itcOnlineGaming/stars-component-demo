// /tests/setupTests.js
import '@testing-library/jest-dom/vitest';

// Mock getAnimations to prevent errors in JSDOM
Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
	value: () => []
});

// Mock element.animate to prevent errors from transitions using it
if (!HTMLElement.prototype.animate) {
	HTMLElement.prototype.animate = () => ({
		onfinish: null,
		cancel: () => {},
		play: () => {},
		pause: () => {},
		finished: Promise.resolve()
	});
}
