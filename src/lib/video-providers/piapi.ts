import type { BeautyVideoRequest } from "@/lib/beauty-shorts";

const PIAPI_BASE_URL = process.env.PIAPI_BASE_URL ?? "https://api.piapi.ai";

export type PiApiCreateResult = {
  taskId: string;
  raw: unknown;
};

function apiKey() {
  const value = process.env.PIAPI_API_KEY;
  if (!value) throw new Error("PIAPI_API_KEY is not configured");
  return value;
}

export async function createSeedanceTask(
  input: BeautyVideoRequest,
  prompt: string,
): Promise<PiApiCreateResult> {
  const imageUrls = [
    ...(input.characterImageUrls ?? []),
    ...(input.productImageUrls ?? []),
  ];

  if (imageUrls.length === 0) {
    throw new Error("At least one character or product reference image URL is required");
  }

  // PiAPI occasionally changes provider-specific model/input field names.
  // Keep the provider payload isolated here so the rest of the app never depends on them.
  const body = {
    model: process.env.PIAPI_SEEDANCE_MODEL ?? "seedance-2.0-fast",
    task_type: "video_generation",
    input: {
      prompt,
      image_urls: imageUrls,
      duration: input.duration ?? 10,
      resolution: input.resolution ?? "480p",
      aspect_ratio: input.aspectRatio ?? "9:16",
    },
  };

  const response = await fetch(`${PIAPI_BASE_URL}/api/v1/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`PiAPI create task failed (${response.status}): ${JSON.stringify(raw)}`);
  }

  const data = raw as Record<string, any>;
  const taskId = data?.data?.task_id ?? data?.task_id ?? data?.id;
  if (!taskId) throw new Error(`PiAPI response did not contain a task id: ${JSON.stringify(raw)}`);

  return { taskId, raw };
}

export async function getSeedanceTask(taskId: string) {
  const response = await fetch(`${PIAPI_BASE_URL}/api/v1/task/${encodeURIComponent(taskId)}`, {
    headers: { "x-api-key": apiKey() },
    cache: "no-store",
  });
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`PiAPI task lookup failed (${response.status}): ${JSON.stringify(raw)}`);
  }
  return raw;
}
