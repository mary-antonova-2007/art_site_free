import { describe, test } from 'vitest';

describe('page revision contract', () => {
  test.todo('creates or updates a draft revision when the first editor change happens');
  test.todo('keeps previously published revisions immutable');
  test.todo('promotes a validated draft to published without rewriting history');
  test.todo('hides draft-only content from the public renderer');
});
