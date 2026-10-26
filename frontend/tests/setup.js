// ============================================================================
// Vitest global setup for AlumniConnect.
//
// Adds the @testing-library/jest-dom matchers (toBeInTheDocument, ...) and
// resets the DOM between tests. jsdom does not implement matchMedia, which
// some responsive components rely on, so a tiny stub is provided too.
// ============================================================================
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}
