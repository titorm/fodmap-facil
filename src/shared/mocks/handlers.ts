import { http, HttpResponse } from 'msw';
import { mockReintroductionTests, mockUser } from '../fixtures/reintroductionTests';

/**
 * Mock Service Worker handlers para testes
 * Simula respostas da API Appwrite
 */

const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';

export const handlers = [
  // Auth - Create Session (Sign In)
  http.post(`${APPWRITE_ENDPOINT}/account/sessions/email`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        $id: 'mock-session-id',
        userId: mockUser.$id,
        expire: new Date(Date.now() + 3600000).toISOString(),
        provider: 'email',
        providerUid: body.email,
        current: true,
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  // Auth - Create Account (Sign Up)
  http.post(`${APPWRITE_ENDPOINT}/account`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      $id: 'new-user-id',
      email: body.email,
      name: body.name || '',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
    });
  }),

  // Auth - Delete Session (Sign Out)
  http.delete(`${APPWRITE_ENDPOINT}/account/sessions/current`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  // Auth - Get Account
  http.get(`${APPWRITE_ENDPOINT}/account`, () => {
    return HttpResponse.json(mockUser);
  }),

  // TablesDB - List Rows (Tests)
  http.get(`${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`, ({ request }) => {
    const url = new URL(request.url);
    const queries = url.searchParams.get('queries');

    if (queries) {
      try {
        const parsedQueries = JSON.parse(queries);
        const userIdQuery = parsedQueries.find((q: string) => q.includes('userId'));

        if (userIdQuery) {
          const userId = userIdQuery.match(/equal\("userId",\s*\["([^"]+)"\]\)/)?.[1];
          if (userId) {
            const userTests = mockReintroductionTests.filter((test) => test.userId === userId);
            return HttpResponse.json({ rows: userTests, total: userTests.length });
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return HttpResponse.json({
      rows: mockReintroductionTests,
      total: mockReintroductionTests.length,
    });
  }),

  // TablesDB - Get Row (Test by ID)
  http.get(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows/:rowId`,
    ({ params }) => {
      const { rowId } = params;
      const test = mockReintroductionTests.find((t) => t.id === rowId);

      if (test) {
        return HttpResponse.json(test);
      }

      return HttpResponse.json({ message: 'Row not found' }, { status: 404 });
    }
  ),

  // TablesDB - Create Row (Test)
  http.post(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`,
    async ({ request }) => {
      const body = await request.json();

      const newTest = {
        $id: body.rowId || `test-${Date.now()}`,
        ...body.data,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };

      return HttpResponse.json(newTest, { status: 201 });
    }
  ),

  // TablesDB - Update Row (Test)
  http.patch(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows/:rowId`,
    async ({ request, params }) => {
      const { rowId } = params;
      const body = await request.json();
      const test = mockReintroductionTests.find((t) => t.id === rowId);

      if (test) {
        const updatedTest = {
          ...test,
          ...body.data,
          $updatedAt: new Date().toISOString(),
        };
        return HttpResponse.json(updatedTest);
      }

      return HttpResponse.json({ message: 'Row not found' }, { status: 404 });
    }
  ),

  // TablesDB - Delete Row (Test)
  http.delete(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows/:rowId`,
    ({ params }) => {
      const { rowId } = params;
      const test = mockReintroductionTests.find((t) => t.id === rowId);

      if (test) {
        return HttpResponse.json({}, { status: 204 });
      }

      return HttpResponse.json({ message: 'Row not found' }, { status: 404 });
    }
  ),
];

/**
 * Handlers para cenários de erro
 */
export const errorHandlers = [
  // Network error
  http.get(`${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`, () => {
    return HttpResponse.error();
  }),

  // Server error
  http.post(`${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`, () => {
    return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
  }),

  // Unauthorized
  http.get(`${APPWRITE_ENDPOINT}/account`, () => {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),
];
