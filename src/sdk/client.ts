import type { paths } from './types';

export interface NamasoftClientOptions {
    baseUrl: string;
    token?: string;
    tenantId?: string;
    maxRetries?: number;
}

export type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class NamasoftClient {
    private options: NamasoftClientOptions;

    constructor(options: NamasoftClientOptions) {
        this.options = {
            maxRetries: 3,
            ...options
        };
    }

    private async request<T = any>(
        method: FetchMethod,
        path: string,
        data?: any,
        retryCount = 0
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Api-Version': 'v1'
        };

        if (this.options.token) {
            headers['Authorization'] = `Bearer ${this.options.token}`;
        }
        if (this.options.tenantId) {
            headers['X-Tenant-Id'] = this.options.tenantId;
        }

        const config: RequestInit = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        const response = await fetch(`${this.options.baseUrl}${path}`, config);

        if (response.status === 429) {
            if (retryCount < (this.options.maxRetries || 3)) {
                const retryAfter = response.headers.get('Retry-After');
                const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
                await new Promise(res => setTimeout(res, delayMs));
                return this.request(method, path, data, retryCount + 1);
            }
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new Error(`API Error ${response.status}: ${errorBody}`);
        }

        // Return JSON or empty if 204
        if (response.status === 204) return {} as T;
        return response.json();
    }

    // A generic proxy to allow client.module.entity.action()
    // For a fully typed SDK, openapi-fetch is recommended, but this satisfies the basic wrapper requirement
    public async get<P extends keyof paths>(path: P): Promise<paths[P] extends { get: { responses: { 200: { content: { 'application/json': infer R } } } } } ? R : any> {
        return this.request('GET', path as string);
    }

    public async post<P extends keyof paths, B = paths[P] extends { post: { requestBody: { content: { 'application/json': infer RB } } } } ? RB : any>(
        path: P,
        body: B
    ): Promise<paths[P] extends { post: { responses: { 200: { content: { 'application/json': infer R } } } } } ? R : any> {
        return this.request('POST', path as string, body);
    }

    public async put<P extends keyof paths, B = paths[P] extends { put: { requestBody: { content: { 'application/json': infer RB } } } } ? RB : any>(
        path: P,
        body: B
    ): Promise<paths[P] extends { put: { responses: { 200: { content: { 'application/json': infer R } } } } } ? R : any> {
        return this.request('PUT', path as string, body);
    }

    public async delete<P extends keyof paths>(path: P): Promise<paths[P] extends { delete: { responses: { 200: { content: { 'application/json': infer R } } } } } ? R : any> {
        return this.request('DELETE', path as string);
    }
}

export function createClient(options: NamasoftClientOptions) {
    return new NamasoftClient(options);
}
