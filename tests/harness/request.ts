export interface MockRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export function buildMockRequest(url: string, options: MockRequestOptions = {}): Request {
  const method = options.method || 'GET';
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-tenant-id': 'tenant_mock_456',
    ...options.headers
  });

  const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

  return new Request(`https://localhost${url}`, {
    method,
    headers,
    body: bodyStr
  });
}
