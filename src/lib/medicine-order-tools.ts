import { z } from "zod";
import {
  getCartSummary,
  searchMedicinesByName,
  updateCart,
} from "@/lib/db";

/** OpenAI Chat Completions `tools[]` entry shape (`type: "function"`). */
export type OpenAiToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const updateCartArgsSchema = z.object({
  items: z
    .array(
      z.object({
        medicineId: z.number().int().positive(),
        quantity: z.number().int().nonnegative(),
      }),
    )
    .min(0),
});

const searchMedicineArgsSchema = z.object({
  medicineName: z.string().min(1),
});

export function getOpenAiToolDefinitions(): OpenAiToolDefinition[] {
  return [
    {
      type: "function",
      function: {
        name: "getCart",
        description: "Get all cart items with totals.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "updateCart",
        description: "Replace cart with the provided medicine quantities.",
        parameters: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medicineId: { type: "integer", minimum: 1 },
                  quantity: { type: "integer", minimum: 0 },
                },
                required: ["medicineId", "quantity"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "searchMedicine",
        description: "Search medicines by name.",
        parameters: {
          type: "object",
          properties: {
            medicineName: { type: "string", minLength: 1 },
          },
          required: ["medicineName"],
          additionalProperties: false,
        },
      },
    },
  ];
}

export type ToolExecutionSuccess = {
  ok: true;
  name: string;
  result: unknown;
};

export type ToolExecutionFailure = {
  ok: false;
  name: string;
  error: string;
};

export type ToolExecutionOutcome = ToolExecutionSuccess | ToolExecutionFailure;

export async function executeMedicineTool(
  name: string,
  rawArguments: unknown,
): Promise<ToolExecutionOutcome> {
  try {
    switch (name) {
      case "getCart": {
        if (rawArguments != null && typeof rawArguments !== "object") {
          return {
            ok: false,
            name,
            error: "Arguments must be an object or omitted",
          };
        }
        const cart = getCartSummary();
        return { ok: true, name, result: cart };
      }
      case "updateCart": {
        const { items } = updateCartArgsSchema.parse(rawArguments);
        updateCart(items);
        const cart = getCartSummary();
        return {
          ok: true,
          name,
          result: { success: true, cart },
        };
      }
      case "searchMedicine": {
        const { medicineName } = searchMedicineArgsSchema.parse(rawArguments);
        const medicines = searchMedicinesByName(medicineName);
        return { ok: true, name, result: { items: medicines } };
      }
      default:
        return { ok: false, name, error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, name, error: message };
  }
}

/** Used by MCP `registerTool` `inputSchema` fields. */
export const mcpToolInputSchemas = {
  UpdateCart: {
    items: z
      .array(
        z.object({
          medicineId: z.number().int().positive(),
          quantity: z.number().int().nonnegative(),
        }),
      )
      .min(0),
  },
  searchMedicine: {
    medicineName: z.string().min(1),
  },
} as const;
