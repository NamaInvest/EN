/**
 * Model Context Protocol (MCP) Bridge
 * ──────────────────────────────────────────────────────────
 * Lightweight adapter to connect local ERP tools to MCP clients.
 * Allows external AI agents (like Claude Desktop) to query the ERP securely.
 */

import { erpTools, getTool, listTools } from './erp-tools';
import { logger } from './logger';

const log = logger.child({ route: 'MCPBridge' });

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: { code: number; message: string };
}

export class MCPBridge {
  
  /**
   * List available tools in MCP format
   */
  static listTools() {
    return {
      tools: erpTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      }))
    };
  }

  /**
   * Call a specific tool
   */
  static async callTool(name: string, args: any) {
    const tool = getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const result = await tool.execute(args);
      return {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }]
      };
    } catch (error: any) {
      log.error(`MCP Tool error (${name}):`, error);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  /**
   * Handle incoming JSON-RPC request
   */
  static async handleRequest(req: MCPRequest): Promise<MCPResponse> {
    try {
      if (req.method === 'tools/list') {
        return { jsonrpc: '2.0', id: req.id, result: this.listTools() };
      }
      
      if (req.method === 'tools/call') {
        const { name, arguments: args } = req.params;
        const result = await this.callTool(name, args);
        return { jsonrpc: '2.0', id: req.id, result };
      }

      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: 'Method not found' }
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32000, message: err.message }
      };
    }
  }
}
