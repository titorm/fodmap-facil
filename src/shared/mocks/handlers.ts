import { http, HttpResponse } from 'msw';
import { mockReintroductionTests, mockUser } from '../fixtures/reintroductionTests';

/**
 * Mock Service Worker handlers para testes
 * Simula respostas da API Supabase
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';

export const handlers = [
  // Auth - Sign In
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // Auth - Sign Up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'new-user-id',
        email: body.email,
        created_at: new Date().toISOString(),
      },
    });
  }),

  // Auth - Sign Out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Auth - Get Session
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Reintroduction Tests - List
  http.get(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (userId) {
      const userTests = mockReintroductionTests.filter((test) => test.userId === userId);
      return HttpResponse.json(userTests);
    }

    return HttpResponse.json(mockReintroductionTests);
  }),

  // Reintroduction Tests - Get by ID
  http.get(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      const test = mockReintroductionTests.find((t) => t.id === id);
      if (test) {
        return HttpResponse.json([test]);
      }
      return HttpResponse.json([], { status: 404 });
    }

    return HttpResponse.json(mockReintroductionTests);
  }),

  // Reintroduction Tests - Create
  http.post(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, async ({ request }) => {
    const body = await request.json();

    const newTest = {
      id: `test-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json([newTest], { status: 201 });
  }),

  // Reintroduction Tests - Update
  http.patch(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();

    if (id) {
      const test = mockReintroductionTests.find((t) => t.id === id);
      if (test) {
        const updatedTest = {
          ...test,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return HttpResponse.json([updatedTest]);
      }
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Reintroduction Tests - Delete
  http.delete(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      return HttpResponse.json({ success: true }, { status: 204 });
    }

    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  // Symptoms - List
  http.get(`${SUPABASE_URL}/rest/v1/symptoms`, ({ request }) => {
    const url = new URL(request.url);
    const testId = url.searchParams.get('test_id');

    if (testId) {
      const test = mockReintroductionTests.find((t) => t.id === testId);
      if (test) {
        return HttpResponse.json(test.symptoms || []);
      }
    }

    return HttpResponse.json([]);
  }),

  // Symptoms - Create
  http.post(`${SUPABASE_URL}/rest/v1/symptoms`, async ({ request }) => {
    const body = await request.json();

    const newSymptom = {
      id: `symptom-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json([newSymptom], { status: 201 });
  }),
];

/**
 * Handlers para cenários de erro
 */
export const errorHandlers = [
  // Network error
  http.get(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, () => {
    return HttpResponse.error();
  }),

  // Server error
  http.post(`${SUPABASE_URL}/rest/v1/reintroduction_tests`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  // Unauthorized
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),
];
