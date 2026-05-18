import { afterEach, vi } from 'vitest';

process.env.TZ = 'UTC';

vi.mock('server-only', () => ({}));

afterEach(() => {
  // Placeholder for cleanup hooks once app-level mocks and factories land.
});
