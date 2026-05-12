import { NextResponse } from "next/server";
import { getOpenAiToolDefinitions } from "@/lib/medicine-order-tools";

export async function GET() {
  const tools = getOpenAiToolDefinitions();
  return NextResponse.json({ tools });
}
