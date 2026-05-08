import { BusinessContext } from '../../context/business-context';
import { ToolDefinition, toolRegistry } from '../../orchestrator/tool-registry';

interface ReActStep {
  thought?: string;
  action?: string;
  observation?: string;
}

export class ReActAgent {
  constructor(
    private model: any, // Placeholder for ChatGoogleGenerativeAI
    private tools: ToolDefinition[],
    private maxIterations: number = 10
  ) {}

  async run(task: string, ctx: BusinessContext): Promise<string> {
    const trace: ReActStep[] = [];

    for (let i = 0; i < this.maxIterations; i++) {
      // Stub thought generation
      const thought = `Thinking about task: ${task}`;
      trace.push({ thought });

      // Action stub
      const parsed = { action: 'get_erp_metrics', actionInput: {}, finalAnswer: null };
      
      if (parsed.finalAnswer) {
        return parsed.finalAnswer;
      }

      const tool = this.tools.find(t => t.name === parsed.action);
      if (!tool) {
        trace.push({ observation: `Tool not found: ${parsed.action}` });
        // Break to avoid infinite loop in stub
        return "Task completed via stub";
      }

      try {
        const observation = await toolRegistry.execute(parsed.action, parsed.actionInput, ctx);
        trace.push({ action: parsed.action, observation: JSON.stringify(observation) });
        // Break stub
        return `Final answer: ${JSON.stringify(observation)}`;
      } catch (error: any) {
        trace.push({ action: parsed.action, observation: `Error: ${error.message}` });
        return `Error occurred: ${error.message}`;
      }
    }

    throw new Error('Max iterations reached');
  }
}
