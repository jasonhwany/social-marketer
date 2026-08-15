import { NextRequest, NextResponse } from "next/server";
import { getSeedanceTask } from "@/lib/video-providers/piapi";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params;
    const task = await getSeedanceTask(taskId);
    return NextResponse.json({ ok: true, provider: "piapi", taskId, task });
  } catch (error) {
    console.error("beauty-video status failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
