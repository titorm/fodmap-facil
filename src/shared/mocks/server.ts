import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Mock Service Worker server para testes Node.js (Jest)
 */
export const server = setupServer(...handlers);

// Estabelece interceptação de requests antes de todos os testes
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reseta handlers após cada teste
afterEach(() => server.resetHandlers());

// Limpa após todos os testes
afterAll(() => server.close());
