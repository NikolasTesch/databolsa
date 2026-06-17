// Definido antes de qualquer importação que dependa de jwt.ts para satisfazer o
// fail-fast de JWT_SECRET (SPEC-0028 REQ-05).
process.env.JWT_SECRET = 'test-secret-for-vitest';

import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
