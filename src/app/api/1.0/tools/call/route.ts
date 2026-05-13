import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { executeMedicineTool } from "@/lib/medicine-order-tools";

const batchBodySchema = z.object({
  tool_calls: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.literal("function"),
        function: z.object({
          name: z.string().min(1),
          arguments: z.string().optional(),
        }),
      }),
    )
    .min(1),
});

function parseArguments(raw: string | undefined): unknown {
  if (raw === undefined) {
    return {};
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = batchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tool_calls } = parsed.data;

  type TextContent = { type: "text"; text: string };
  type ToolResult = { content: TextContent[]; isError?: true };
  type ResultEntry = { tool_call_id: string; result: ToolResult };

  function textResult(value: unknown): ToolResult {
    const text =
      typeof value === "string" ? value : JSON.stringify(value);
    return { content: [{ type: "text", text }] };
  }

  function errorResult(message: string): ToolResult {
    return { content: [{ type: "text", text: message }], isError: true };
  }

  const results: ResultEntry[] = [];

  for (const call of tool_calls) {
    const tool_call_id = call.id;
    const { name } = call.function;

    let args: unknown;
    try {
      args = parseArguments(call.function.arguments);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({
        tool_call_id,
        result: errorResult(`Invalid arguments JSON: ${message}`),
      });
      continue;
    }

    const outcome = await executeMedicineTool(name, args);
    if (outcome.ok) {
      results.push({
        tool_call_id,
        result: textResult(outcome.result),
      });
      if (name === "UpdateCart") {
        revalidatePath("/");
      }
    } else {
      results.push({
        tool_call_id,
        result: errorResult(outcome.error),
      });
    }
  }

  return NextResponse.json({ results });
}
