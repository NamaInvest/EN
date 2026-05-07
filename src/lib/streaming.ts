/**
 * AI-03 — Streaming Response Utilities
 * Wraps LLM responses as Server-Sent Events (SSE) for typewriter effect.
 */

/**
 * Create an SSE-compatible ReadableStream from an async text generator.
 */
export function createSSEStream(generator: AsyncGenerator<string>): ReadableStream {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of generator) {
                    const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
                    controller.enqueue(encoder.encode(data));
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (err: any) {
                const errorMsg = `data: ${JSON.stringify({ error: err.message })}\n\n`;
                controller.enqueue(encoder.encode(errorMsg));
            } finally {
                controller.close();
            }
        }
    });
}

/**
 * Create SSE Response with correct headers.
 */
export function createSSEResponse(stream: ReadableStream): Response {
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        }
    });
}

/**
 * Simulate streaming by splitting text into word chunks with delay.
 * Useful for wrapping non-streaming LLM responses as SSE.
 */
export async function* simulateStream(text: string, delayMs: number = 30): AsyncGenerator<string> {
    const words = text.split(' ');
    for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}
