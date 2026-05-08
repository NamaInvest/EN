import { toolRegistry } from './tool-registry';
import { BusinessContext } from '../context/business-context';

export async function streamChain(
  chainName: string,
  input: any,
  ctx: BusinessContext
): Promise<ReadableStream> {
  // Langchain and ChatGoogleGenerativeAI mock for streaming support
  const tools = await toolRegistry.getAllowedTools(ctx);
  
  return new ReadableStream({
    async start(controller) {
      // Simulate chunking
      const responseText = `[Streaming from ${chainName}] Received input: ${JSON.stringify(input)}. Allowed tools: ${tools.map(t => t.name).join(', ')}`;
      const chunks = responseText.split(' ');
      
      for (const chunk of chunks) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ content: chunk + ' ' })}\n\n`)
        );
        await new Promise(r => setTimeout(r, 50));
      }
      controller.close();
    },
  });
}
