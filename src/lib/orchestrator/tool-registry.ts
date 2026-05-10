import { z } from 'zod';
import { BusinessContext } from '../context/business-context';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.orchestrator' });

export interface ToolDefinition<T = any, R = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  handler: (args: T, ctx: BusinessContext) => Promise<R>;
  permissions: string[];
  cost: 'low' | 'medium' | 'high';
  dryRunSupported?: boolean;
  rateLimit?: { calls: number; per: number };
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  async getAllowedTools(ctx: BusinessContext): Promise<ToolDefinition[]> {
    const userPerms = ctx.user?.permissions || [];
    return Array.from(this.tools.values()).filter(tool =>
      tool.permissions.every(p => userPerms.includes(p))
    );
  }

  async execute(name: string, args: any, ctx: BusinessContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);

    const userPerms = ctx.user?.permissions || [];
    if (!tool.permissions.every(p => userPerms.includes(p))) {
      throw new Error(`Permission denied for tool: ${name}`);
    }

    const validated = tool.schema.parse(args);

    // Rate limiting stub
    // if (tool.rateLimit) await rateLimitTool(ctx.tenant.id, name, tool.rateLimit);

    const startTime = Date.now();
    try {
      const result = await tool.handler(validated, ctx);
      // log tool usage stub
      return result;
    } catch (error: any) {
      // log tool usage error stub
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();
