import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const server = new Server(
  {
    name: "nama-invest-mcp",
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
        name: "get_daily_sales",
        description: "Retrieve complete sales figures for a specific branch or globally for today.",
        inputSchema: {
          type: "object",
          properties: {
            branchId: { type: "number", description: "Optional Branch ID" }
          }
        }
      },
      {
        name: "get_active_tenants",
        description: "Retrieves a count of active SaaS companies and their subscription plans",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "check_product_stock",
        description: "Checks real-time inventory for a product name or barcode",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Product name or barcode" }
          },
          required: ["query"]
        }
      }
    ]
  };
});

// Implement Tool Logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "get_daily_sales": {
        const branchId = request.params.arguments?.branchId;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const whereClause = { date: { gte: today } };
        if (branchId) whereClause.branchId = branchId;

        const invoices = await prisma.salesInvoice.findMany({ where: whereClause });
        const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);

        return {
          content: [{ type: "text", text: \`Total sales for today: \${totalSales} SAR generated from \${invoices.length} invoices.\` }]
        };
      }

      case "get_active_tenants": {
        const companies = await prisma.company.findMany({
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        const active = companies.filter(c => c.subscriptions?.[0]?.status === 'ACTIVE').length;
        
        return {
          content: [{ type: "text", text: \`There are \${active} fully active tenants on the Nama Invest SaaS Platform, out of \${companies.length} total registered.\` }]
        };
      }

      case "check_product_stock": {
        const query = request.params.arguments.query;
        const products = await prisma.product.findMany({
          where: { OR: [{ name: { contains: query } }, { barcode: { contains: query } }] },
          take: 5
        });

        const strings = products.map(p => \`[\${p.barcode || 'N/A'}] \${p.name}: \${p.currentStock} units in stock. Price: \${p.sellPrice} SAR.\`);
        return {
          content: [{ type: "text", text: strings.length > 0 ? strings.join('\\n') : 'No products found matching that query.' }]
        };
      }

      default:
        throw new Error("Unknown tool");
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: \`Error executing tool: \${err.message}\` }],
      isError: true
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Nama Invest MCP Bridge initialized via STDIO.");
}

run().catch(console.error);
