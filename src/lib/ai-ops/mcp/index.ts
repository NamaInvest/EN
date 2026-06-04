import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { assertReadOnlyMcpOperation } from "./read-only-policy";
import { maskSecrets } from "./masking";
import { readTmpReport, listTmpReports } from "./report-reader";
import { readPM2Status, readServiceLogs } from "./health-reader";
import { readProvisioningRuns, readTenantAccounts, getOnboardingStats } from "./onboarding-reader";
import { readSecurityStatus } from "./security-reader";
import { generateSupportOverview, suggestTroubleshootingSteps } from "./support-summarizer";

const server = new Server(
  {
    name: "nama-invest-ai-ops-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available Tools for the AI
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_tmp_report",
        description: "Retrieve content of a specific customer-onboarding-*.md report file inside tmp folder.",
        inputSchema: {
          type: "object",
          properties: {
            fileName: { type: "string", description: "The filename of the report (e.g. customer-onboarding-ga-policy-runtime-revalidation-report.md)" }
          },
          required: ["fileName"]
        }
      },
      {
        name: "list_tmp_reports",
        description: "List all customer-onboarding-*.md reports found inside tmp folder.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "read_pm2_status",
        description: "Retrieve status, cpu, memory, and restart count of PM2 processes running on the server.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "read_service_logs",
        description: "Read service console logs with automatic secret masking.",
        inputSchema: {
          type: "object",
          properties: {
            serviceName: { type: "string", description: "Service name: main-site, n1-main, saas-app, staging" },
            linesCount: { type: "number", description: "Number of lines to read (max 100, default 50)" }
          },
          required: ["serviceName"]
        }
      },
      {
        name: "list_provisioning_runs",
        description: "Retrieve latest 50 tenant provisioning runs details from database.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "list_tenant_accounts",
        description: "Retrieve latest 50 active/pending SaaS tenant accounts from database.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_onboarding_stats",
        description: "Retrieve statistics and counts of tenant provisioning runs grouped by status.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "read_security_status",
        description: "Retrieve security posture status and runtime revalidation results.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "generate_support_overview",
        description: "Retrieve unified summary overview for support daily checks.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "suggest_troubleshooting_steps",
        description: "Retrieve recommended troubleshooting advice for a given onboarding failure error code.",
        inputSchema: {
          type: "object",
          properties: {
            errorCode: { type: "string", description: "The error code (e.g. DATABASE_CREATION_FAILED)" },
            errorMessage: { type: "string", description: "The error details message string" }
          },
          required: ["errorCode", "errorMessage"]
        }
      }
    ]
  };
});

// Implement Tool Logic with strict policy checks and output masking
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};
  
  try {
    // 1. Enforce strict read-only policy check on tool name and arguments
    assertReadOnlyMcpOperation(toolName, args);

    let resultText = "";

    switch (toolName) {
      case "read_tmp_report": {
        resultText = await readTmpReport(args.fileName as string);
        break;
      }
      case "list_tmp_reports": {
        const list = await listTmpReports();
        resultText = list.length > 0 ? list.join("\n") : "No onboarding reports found.";
        break;
      }
      case "read_pm2_status": {
        const pm2List = await readPM2Status();
        resultText = JSON.stringify(pm2List, null, 2);
        break;
      }
      case "read_service_logs": {
        resultText = await readServiceLogs(args.serviceName as string, args.linesCount as number);
        break;
      }
      case "list_provisioning_runs": {
        const runs = await readProvisioningRuns();
        resultText = JSON.stringify(runs, null, 2);
        break;
      }
      case "list_tenant_accounts": {
        const accounts = await readTenantAccounts();
        resultText = JSON.stringify(accounts, null, 2);
        break;
      }
      case "get_onboarding_stats": {
        const stats = await getOnboardingStats();
        resultText = JSON.stringify(stats, null, 2);
        break;
      }
      case "read_security_status": {
        resultText = await readSecurityStatus();
        break;
      }
      case "generate_support_overview": {
        resultText = await generateSupportOverview();
        break;
      }
      case "suggest_troubleshooting_steps": {
        resultText = suggestTroubleshootingSteps(args.errorCode as string, args.errorMessage as string);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [{ type: "text", text: maskSecrets(resultText) }]
    };
  } catch (err) {
    const error = err as Error;
    return {
      content: [{ type: "text", text: maskSecrets(`Error executing tool: ${error.message}`) }],
      isError: true
    };
  }
});

export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only execute directly if this file is run directly in Node
if (require.main === module) {
  runMcpServer().catch(err => {
    console.error("Failed to start AI Ops MCP Server:", err);
    process.exit(1);
  });
}
