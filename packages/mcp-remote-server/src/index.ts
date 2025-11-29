/**
 * Remote MCP Server for Claude.ai and ChatGPT
 *
 * Provides Pip bookkeeping assistant as a remote MCP server that users
 * can connect to via Claude.ai Integrations or ChatGPT Apps.
 *
 * Features:
 * - HTTP/SSE transport for remote connections
 * - Multi-tenant Xero OAuth authentication
 * - Pip personality via MCP prompts
 * - Xero accounting tools (invoices, reports, bank transactions)
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  Prompt,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool handlers
import * as xeroTools from "./handlers/xero-tools.js";
import { getXeroStatus } from "./services/xero.js";

// Types
interface Session {
  id: string;
  transport: SSEServerTransport;
  userId?: string;
  xeroConnected: boolean;
  createdAt: Date;
}

// Store active sessions
const sessions = new Map<string, Session>();

// Pip personality system prompt
const PIP_SYSTEM_PROMPT = `You are Pip, a friendly AI bookkeeping assistant for Australian small business owners.

## Your Personality
- Warm, approachable, and genuinely helpful
- Like a trusted colleague who happens to know accounting
- Uses Australian English (organisation, colour, labour)
- Direct and practical - no corporate jargon

## Your Approach
1. Always use tools to get REAL data - never guess
2. Reference specific numbers from Xero
3. Give clear, actionable advice
4. End with a helpful follow-up question when appropriate

## Response Format (for financial questions)
**Assessment**: [Clear answer with reason]

**The Numbers** (from Xero):
- [Actual data points]

**Recommendation**: [Specific, actionable advice]

## Available Tools
- get_invoices: Fetch invoices (filter by status)
- get_profit_and_loss: Get P&L report
- get_balance_sheet: Get current balance sheet
- get_bank_transactions: Get recent transactions
- get_contacts: Get customers/suppliers
- get_organisation: Get company info
- get_aged_receivables: Who owes you money
- get_aged_payables: Who you owe money to
- search_contacts: Find a specific customer/supplier
- get_bank_accounts: Get bank balances`;

// ===========================================
// Lazy-Loading Tool Registry
// Tools organized by category for context efficiency
// ===========================================

interface ToolDefinition extends Tool {
  category: string;
}

// Tool registry with categories
const toolRegistry: ToolDefinition[] = [
  // INVOICES category
  {
    category: "invoices",
    name: "get_invoices",
    description: "Get invoices from Xero. Use status 'AUTHORISED' for unpaid, 'PAID' for paid.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "AUTHORISED", "PAID", "VOIDED"],
          description: "Filter by status. AUTHORISED = unpaid, PAID = paid",
        },
        limit: { type: "number", description: "Max invoices to return (default: 10)" },
      },
    },
  },
  {
    category: "invoices",
    name: "get_aged_receivables",
    description: "Get aged receivables - who owes you money and how overdue",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date for aging (YYYY-MM-DD), defaults to today" },
      },
    },
  },
  {
    category: "invoices",
    name: "get_aged_payables",
    description: "Get aged payables - who you owe money to and how overdue",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date for aging (YYYY-MM-DD), defaults to today" },
      },
    },
  },

  // REPORTS category
  {
    category: "reports",
    name: "get_profit_and_loss",
    description: "Get profit & loss report for a date range",
    inputSchema: {
      type: "object",
      properties: {
        fromDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        toDate: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    category: "reports",
    name: "get_balance_sheet",
    description: "Get balance sheet as of a specific date",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date (YYYY-MM-DD), defaults to today" },
      },
    },
  },

  // BANKING category
  {
    category: "banking",
    name: "get_bank_accounts",
    description: "Get bank accounts and their current balances",
    inputSchema: { type: "object", properties: {} },
  },
  {
    category: "banking",
    name: "get_bank_transactions",
    description: "Get recent bank transactions",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max transactions to return (default: 10)" },
      },
    },
  },

  // CONTACTS category
  {
    category: "contacts",
    name: "get_contacts",
    description: "Get customers and suppliers",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max contacts to return (default: 10)" },
      },
    },
  },
  {
    category: "contacts",
    name: "search_contacts",
    description: "Search for a customer or supplier by name",
    inputSchema: {
      type: "object",
      properties: {
        searchTerm: { type: "string", description: "Name to search for" },
      },
      required: ["searchTerm"],
    },
  },

  // ORGANISATION category
  {
    category: "organisation",
    name: "get_organisation",
    description: "Get company details from Xero",
    inputSchema: { type: "object", properties: {} },
  },
];

// Get unique categories with tool counts
const categories = [...new Set(toolRegistry.map((t) => t.category))];
const categoryOverview = categories
  .map((cat) => {
    const tools = toolRegistry.filter((t) => t.category === cat);
    return `${cat} (${tools.length} tools)`;
  })
  .join(", ");

// Meta-tools for lazy loading (only these are exposed initially)
const metaTools: Tool[] = [
  {
    name: "get_tools_in_category",
    description: `Get available Xero tools by category. Categories: ${categoryOverview}. Call this first to discover what tools are available, then use execute_tool to run them.`,
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: categories,
          description: "The category of tools to list",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "execute_tool",
    description:
      "Execute a Xero tool by name. First use get_tools_in_category to discover available tools and their parameters.",
    inputSchema: {
      type: "object",
      properties: {
        tool_name: {
          type: "string",
          description: "The name of the tool to execute (e.g., 'get_invoices')",
        },
        arguments: {
          type: "object",
          description: "Arguments to pass to the tool",
        },
      },
      required: ["tool_name"],
    },
  },
];

// Prompts for Pip personality
const prompts: Prompt[] = [
  {
    name: "pip_assistant",
    description: "Pip - AI Bookkeeping Assistant for Australian Small Business",
    arguments: [],
  },
];

// JWT secret (shared with main server)
const JWT_SECRET = process.env.JWT_SECRET || "pip-mcp-secret-change-me";

/**
 * Verify JWT token and extract user ID
 */
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Create MCP server for a specific user session
function createMcpServer(userId?: string): Server {
  const server = new Server(
    {
      name: "pip-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  // List available tools (only meta-tools for lazy loading)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: metaTools };
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  // Get prompt content
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === "pip_assistant") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: PIP_SYSTEM_PROMPT,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Handle tool calls with lazy-loading support
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    // Meta-tool: get_tools_in_category (doesn't require auth)
    if (name === "get_tools_in_category") {
      const category = (args as { category: string }).category;
      const categoryTools = toolRegistry.filter((t) => t.category === category);

      if (categoryTools.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown category: ${category}. Available categories: ${categories.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      // Return tool definitions for this category
      const toolList = categoryTools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                category,
                tools: toolList,
                usage: "Use execute_tool with tool_name and arguments to run these tools",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Meta-tool: execute_tool
    if (name === "execute_tool") {
      const { tool_name, arguments: toolArgs } = args as {
        tool_name: string;
        arguments?: Record<string, unknown>;
      };

      // Verify tool exists in registry
      const tool = toolRegistry.find((t) => t.name === tool_name);
      if (!tool) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${tool_name}. Use get_tools_in_category first to discover available tools.`,
            },
          ],
          isError: true,
        };
      }

      // Check if user is authenticated for actual Xero tools
      if (!userId) {
        return {
          content: [
            {
              type: "text",
              text: `To use Xero tools, please authenticate first. Add your auth token to the SSE connection URL: /sse?token=YOUR_TOKEN`,
            },
          ],
        };
      }

      // Execute the actual tool
      return await executeXeroTool(userId, tool_name, toolArgs || {});
    }

    // Unknown meta-tool
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}. Available tools: get_tools_in_category, execute_tool`,
        },
      ],
      isError: true,
    };
  });

  return server;
}

/**
 * Execute a Xero tool by name
 */
async function executeXeroTool(
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    switch (toolName) {
      case "get_invoices":
        return await xeroTools.getInvoices(userId, args as { status?: string; limit?: number });

      case "get_profit_and_loss":
        return await xeroTools.getProfitAndLoss(userId, args as { fromDate?: string; toDate?: string });

      case "get_balance_sheet":
        return await xeroTools.getBalanceSheet(userId, args as { date?: string });

      case "get_bank_accounts":
        return await xeroTools.getBankAccounts(userId);

      case "get_bank_transactions":
        return await xeroTools.getBankTransactions(userId, args as { limit?: number });

      case "get_contacts":
        return await xeroTools.getContacts(userId, args as { limit?: number });

      case "get_organisation":
        return await xeroTools.getOrganisation(userId);

      case "get_aged_receivables":
        return await xeroTools.getAgedReceivables(userId, args as { date?: string });

      case "get_aged_payables":
        return await xeroTools.getAgedPayables(userId, args as { date?: string });

      case "search_contacts":
        return await xeroTools.searchContacts(userId, args as { searchTerm: string });

      default:
        return {
          content: [{ type: "text", text: `Tool not implemented: ${toolName}` }],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error executing ${toolName}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${toolName}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

// Create Express app
const app: express.Application = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    server: "pip-mcp-server",
    version: "0.1.0",
    activeSessions: sessions.size,
  });
});

// SSE endpoint for MCP connections
app.get("/sse", async (req: Request, res: Response) => {
  console.log("New SSE connection request");

  // Extract auth token from query parameter
  const token = req.query.token as string | undefined;
  let userId: string | undefined;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      userId = decoded.userId;
      console.log(`Authenticated user: ${userId}`);

      // Check Xero connection status
      const xeroStatus = await getXeroStatus(userId);
      console.log(`Xero connected: ${xeroStatus.connected}${xeroStatus.tenantName ? ` (${xeroStatus.tenantName})` : ""}`);
    } else {
      console.log("Invalid auth token provided");
    }
  } else {
    console.log("No auth token - tools will require authentication");
  }

  // Create new MCP server instance for this session (with user context)
  const server = createMcpServer(userId);

  // Create SSE transport - it generates its own session ID
  const transport = new SSEServerTransport("/messages", res);

  // Use the transport's built-in session ID
  const sessionId = transport.sessionId;

  // Store session with user info
  const session: Session = {
    id: sessionId,
    transport,
    userId,
    xeroConnected: userId ? (await getXeroStatus(userId)).connected : false,
    createdAt: new Date(),
  };
  sessions.set(sessionId, session);

  console.log(`Session created: ${sessionId}${userId ? ` for user ${userId}` : " (anonymous)"}`);

  // Handle disconnect
  res.on("close", () => {
    console.log(`Session closed: ${sessionId}`);
    sessions.delete(sessionId);
  });

  // Connect server to transport
  await server.connect(transport);
});

// Messages endpoint for MCP
// NOTE: We don't use express.json() for this route because handlePostMessage needs the raw body
app.post("/messages", async (req: Request, res: Response) => {
  // Get session ID from query
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Forward message to transport - pass the already-parsed body from express.json()
  try {
    await session.transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error("Error handling message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// OAuth callback for Xero (placeholder)
app.get("/auth/xero", (req: Request, res: Response) => {
  // TODO: Implement Xero OAuth flow
  res.redirect(
    `https://login.xero.com/identity/connect/authorize?` +
      `client_id=${process.env.XERO_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.BASE_URL + "/auth/xero/callback")}&` +
      `response_type=code&` +
      `scope=offline_access openid profile email accounting.transactions accounting.reports.read accounting.contacts.read accounting.settings.read`
  );
});

app.get("/auth/xero/callback", async (req: Request, res: Response) => {
  // TODO: Handle OAuth callback and store tokens
  res.send("Xero connected successfully! You can close this window.");
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = parseInt(process.env.MCP_PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    Pip MCP Server                          ║
║                                                            ║
║  Remote MCP server for Claude.ai and ChatGPT integration   ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    SSE:      http://localhost:${PORT}/sse                       ║
║    Messages: http://localhost:${PORT}/messages                  ║
║    Health:   http://localhost:${PORT}/health                    ║
║    Xero:     http://localhost:${PORT}/auth/xero                 ║
╠════════════════════════════════════════════════════════════╣
║  Connect from Claude.ai:                                   ║
║    Settings → Connectors → Add Custom Connector            ║
║    Enter: https://your-domain.com/sse                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Export for testing
export { app, sessions };
