import { NextResponse } from 'next/server';

/**
 * AI-11 — OpenAPI 3.1 Specification Endpoint
 * Auto-generated API documentation.
 */
export async function GET() {
    const spec = {
        openapi: '3.1.0',
        info: {
            title: 'NamaSoft ERP API',
            version: '3.0.0',
            description: 'Enterprise Resource Planning API — Accounting, HR, Inventory, Manufacturing, AI Copilot',
            contact: { name: 'NamaSoft Support', email: 'support@namasoft.com' },
        },
        servers: [
            { url: '/api', description: 'Current Environment' },
        ],
        paths: {
            '/ai/copilot/chat': {
                post: {
                    summary: 'AI Copilot Chat',
                    tags: ['AI'],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, conversationId: { type: 'string' } }, required: ['message'] } } } },
                    responses: { '200': { description: 'AI response with conversation context' } },
                },
            },
            '/ai/rag': {
                post: {
                    summary: 'RAG Query (Knowledge Base)',
                    tags: ['AI'],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } } },
                    responses: { '200': { description: 'Answer grounded in knowledge base documents' } },
                },
            },
            '/search/semantic': {
                get: {
                    summary: 'Semantic Document Search',
                    tags: ['Search'],
                    parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }, { name: 'k', in: 'query', schema: { type: 'integer', default: 10 } }],
                    responses: { '200': { description: 'Vector similarity search results' } },
                },
            },
            '/treasury/cash-position': {
                get: { summary: 'Get Cash Position', tags: ['Treasury'], responses: { '200': { description: 'Latest cash position snapshots' } } },
            },
            '/treasury/liquidity/forecast': {
                get: { summary: 'Get Liquidity Forecast', tags: ['Treasury'], responses: { '200': { description: '13-week liquidity forecast data' } } },
            },
            '/sales/atp/check': {
                post: {
                    summary: 'Available-to-Promise Check',
                    tags: ['Sales'],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { productId: { type: 'string' }, qty: { type: 'number' }, requestedDate: { type: 'string' }, warehouseId: { type: 'string' } } } } } },
                    responses: { '200': { description: 'ATP result with availability breakdown' } },
                },
            },
            '/ap/capture': {
                get: { summary: 'List Invoice Captures', tags: ['AP'], responses: { '200': { description: 'Invoice capture inbox' } } },
                post: { summary: 'Upload & OCR Invoice', tags: ['AP'], responses: { '200': { description: 'Extracted invoice data with confidence score' } } },
            },
            '/manufacturing/shopfloor': {
                get: { summary: 'Active Shop Floor Sessions', tags: ['Manufacturing'], responses: { '200': { description: 'Active MES sessions and Andon calls' } } },
                post: { summary: 'Shop Floor Actions', tags: ['Manufacturing'], responses: { '200': { description: 'Session action result' } } },
            },
            '/finance/budget': {
                get: { summary: 'List Budget Versions', tags: ['Finance'], responses: { '200': { description: 'Budget versions with line counts' } } },
                post: { summary: 'Budget Actions', tags: ['Finance'], responses: { '200': { description: 'Budget action result' } } },
            },
            '/admin/llm-costs': {
                get: { summary: 'AI Cost Dashboard', tags: ['Admin'], responses: { '200': { description: 'Token usage and cost metrics' } } },
            },
        },
        tags: [
            { name: 'AI', description: 'AI Copilot, RAG, and ML endpoints' },
            { name: 'Treasury', description: 'Cash position and liquidity' },
            { name: 'Sales', description: 'ATP and order management' },
            { name: 'AP', description: 'Accounts Payable automation' },
            { name: 'Manufacturing', description: 'MES and shop floor' },
            { name: 'Finance', description: 'Budget, consolidation, period close' },
            { name: 'Search', description: 'Semantic and keyword search' },
            { name: 'Admin', description: 'System administration' },
        ],
    };

    return NextResponse.json(spec);
}
