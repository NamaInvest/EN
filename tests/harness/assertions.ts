import { expect } from 'vitest';

export function assertUnauthorized(response: Response) {
  expect(response.status).toBe(401);
}

export function assertForbidden(response: Response) {
  expect(response.status).toBe(403);
}

export function assertBadRequest(response: Response) {
  expect(response.status).toBe(400);
}

export function assertOk(response: Response) {
  expect(response.status).toBe(200);
}

export function assertCreated(response: Response) {
  expect(response.status).toBe(201);
}
