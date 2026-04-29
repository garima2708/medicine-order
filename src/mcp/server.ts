import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";
import {
  getCartSummary,
  searchMedicinesByName,
  updateCart,
} from "@/lib/db";

const host = process.env.MCP_HOST ?? process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.MCP_PORT ?? process.env.PORT ?? 3333);

const mcpServer = new McpServer({
  name: "medicine-order-mcp",
  version: "1.0.0",
});

mcpServer.registerTool(
  "GetCart",
  {
    description: "Get all cart items with totals.",
  },
  async () => {
    const cart = getCartSummary();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(cart, null, 2),
        },
      ],
      structuredContent: cart,
    };
  },
);

mcpServer.registerTool(
  "UpdateCart",
  {
    description: "Replace cart with the provided medicine quantities.",
    inputSchema: {
      items: z
        .array(
          z.object({
            medicineId: z.number().int().positive(),
            quantity: z.number().int().nonnegative(),
          }),
        )
        .min(0),
    },
  },
  async ({ items }) => {
    updateCart(items);
    const cart = getCartSummary();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              message: "Cart updated successfully.",
              cart,
            },
            null,
            2,
          ),
        },
      ],
      structuredContent: {
        success: true,
        cart,
      },
    };
  },
);

mcpServer.registerTool(
  "searchMedicine",
  {
    description: "Search medicines by name.",
    inputSchema: {
      medicineName: z.string().min(1),
    },
  },
  async ({ medicineName }) => {
    const medicines = searchMedicinesByName(medicineName);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(medicines, null, 2),
        },
      ],
      structuredContent: {
        items: medicines,
      },
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
