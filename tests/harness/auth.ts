import { vi } from 'vitest';

export interface MockUserSession {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function createMockSession(overrides: Partial<MockUserSession> = {}): MockUserSession {
  return {
    userId: 'mock_user_123',
    email: 'test@namainvist.com',
    role: 'ADMIN',
    permissions: ['*'],
    ...overrides
  };
}

let activeSession = createMockSession();

export function setMockSession(session: MockUserSession) {
  activeSession = session;
}

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(async () => activeSession),
  requireAuth: vi.fn(async () => activeSession),
}));
export function mockAuthService(session: MockUserSession) {
  setMockSession(session);
}
