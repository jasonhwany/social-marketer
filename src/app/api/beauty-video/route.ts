import { NextRequest, NextResponse } from "next/server";
import { buildBeautyPrompt, type BeautyVideoRequest } from "@/lib/beauty-shorts";
import { createSeedanceTask } from "@/lib/video-providers/piapi";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BeautyVideoRequest;

    if (!body.productUrl) {
      return NextResponse.json({ error: "productUrl is required" }, { status: 400 });
    }

    if (!(body.productImageUrls?.length || body.characterImageUrls?.length)) {
      return NextResponse.json(
        { error: "Provide at least one productImageUrls or characterImageUrls reference" },
        { status: 400 },
      );
    }

    const normalized: BeautyVideoRequest = {
      ...body,
      duration: body.duration ?? 10,
      resolution: body.resolution ?? "480p",
      aspectRatio: "9:16",
    };

    const prompt = buildBeautyPrompt(normalized);
    const task = await createSeedanceTask(normalized, prompt);

    return NextResponse.json({
      ok: true,
      provider: "piapi",
      model: process.env.PIAPI_SEEDANCE_MODEL ?? "seedance-2.0-fast",
      taskId: task.taskId,
      statusUrl: `/api/beauty-video/${task.taskId}`,
      generation: {
        duration: normalized.duration,
        resolution: normalized.resolution,
        aspectRatio: normalized.aspectRatio,
      },
      strategy: "curiosity-first / brand-obscured / profile-click",
    });
  } catch (error) {
    console.error("beauty-video create failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
