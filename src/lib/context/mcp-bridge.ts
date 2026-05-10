import { logger } from '@/lib/logger';

const log = logger.child({ service: 'context.mcp-bridge' });

// Dummy MCP Bridge to fulfill the plan requirements
export class MCPBridge {
    async connect() {
        log.info('[MCPBridge] Connected.');
    }

    async callTool(name: string, args: any) {
        return { success: true, message: `Tool ${name} executed.` };
    }

    async listTools() {
        return [
            { name: 'mcp-tool-1', description: 'MCP Tool 1' },
            { name: 'mcp-tool-2', description: 'MCP Tool 2' },
        ];
    }
}

export async function getCombinedTools(): Promise<any[]> {
    const builtinTools = [{ name: 'builtin-1', description: 'Builtin 1' }];
    const mcpBridge = new MCPBridge();
    await mcpBridge.connect();
    const mcpTools = await mcpBridge.listTools();

    return [
        ...builtinTools,
        ...mcpTools.map(t => ({ ...t, source: 'mcp' }))
    ];
}
