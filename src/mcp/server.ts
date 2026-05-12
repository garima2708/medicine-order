import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import {
  executeMedicineTool,
  mcpToolInputSchemas,
} from "@/lib/medicine-order-tools";

const host = process.env.MCP_HOST ?? process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.MCP_PORT ?? process.env.PORT ?? 3333);

const mcpServer = new McpServer({
  name: "medicine-order-mcp",
  version: "1.0.0",
});

function asStructuredContent(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

mcpServer.registerTool(
  "GetCart",
  {
    description: "Get all cart items with totals.",
  },
  async () => {
    const outcome = await executeMedicineTool("GetCart", {});
    if (!outcome.ok) {
      throw new Error(outcome.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(outcome.result, null, 2),
        },
      ],
      structuredContent: asStructuredContent(outcome.result),
    };
  },
);

mcpServer.registerTool(
  "UpdateCart",
  {
    description: "Replace cart with the provided medicine quantities.",
    inputSchema: mcpToolInputSchemas.UpdateCart,
  },
  async (args) => {
    const outcome = await executeMedicineTool("UpdateCart", args);
    if (!outcome.ok) {
      throw new Error(outcome.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(outcome.result, null, 2),
        },
      ],
      structuredContent: asStructuredContent(outcome.result),
    };
  },
);

mcpServer.registerTool(
  "searchMedicine",
  {
    description: "Search medicines by name.",
    inputSchema: mcpToolInputSchemas.searchMedicine,
  },
  async (args) => {
    const outcome = await executeMedicineTool("searchMedicine", args);
    if (!outcome.ok) {
      throw new Error(outcome.error);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(outcome.result, null, 2),
        },
      ],
      structuredContent: asStructuredContent(outcome.result),
    };
  },
);

const app = createMcpExpressApp({ host });
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req: any, res: any) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId) {
      transport = transports.get(sessionId);
    }

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports.set(newSessionId, transport!);
        },
        enableJsonResponse: true,
      });

      transport.onclose = () => {
        if (transport?.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      await mcpServer.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/health", (_req: any, res: any) => {
  res.status(200).json({ ok: true });
});

app.listen(port, host, () => {
  console.log(`MCP server listening at http://${host}:${port}/mcp`);
});
