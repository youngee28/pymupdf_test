import {
  isSupportedImageFile,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "@/lib/image-upload";
import type { Detection, DetectionResponse } from "@/lib/detections";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const DETECTION_PROMPT = `업로드된 문서 이미지를 분석하고 레이아웃 영역을 감지합니다.
JSON 형식으로만 반환합니다.
마크다운 형식은 반환하지 않습니다.
설명 텍스트는 포함하지 않습니다.

Return this exact schema:
{
  "detections": [
    {
      "label": "string",
      "bbox": {
        "x": 0.0,
        "y": 0.0,
        "width": 0.0,
        "height": 0.0
      },
      "score": 0.0
    }
  ]
}

Rules:
- bbox values must be normalized decimals between 0 and 1.
- origin is top-left.
- width and height must be positive.
- If nothing is found, return {"detections": []}.
- Labels should be short, e.g. title, paragraph, table, figure, header, footer, list, caption.`;

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type RawDetection = {
  label?: unknown;
  bbox?: {
    x?: unknown;
    y?: unknown;
    width?: unknown;
    height?: unknown;
  };
  score?: unknown;
};

type RawDetectionPayload = {
  detections?: RawDetection[];
};

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const rawModel = process.env.GEMINI_MODEL?.trim();
  const normalizedModel = rawModel?.replace(/^models\//, "");
  const model = normalizedModel || DEFAULT_GEMINI_MODEL;

  return { apiKey, model };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function extractGeminiText(payload: GeminiResponse): string {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function extractJsonObject(text: string): string | null {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return null;
  }

  const fencedMatch = trimmedText.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const startIndex = trimmedText.indexOf("{");
  const endIndex = trimmedText.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  return trimmedText.slice(startIndex, endIndex + 1);
}

function normalizeUnitValue(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(Math.max(value, 0), 1);
}

function normalizeDetection(raw: RawDetection, index: number): Detection | null {
  const x = normalizeUnitValue(raw.bbox?.x);
  const y = normalizeUnitValue(raw.bbox?.y);
  const width = normalizeUnitValue(raw.bbox?.width);
  const height = normalizeUnitValue(raw.bbox?.height);

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  const clampedWidth = Math.min(width, 1 - x);
  const clampedHeight = Math.min(height, 1 - y);

  if (clampedWidth <= 0 || clampedHeight <= 0) {
    return null;
  }

  return {
    id: `det_${index + 1}`,
    label:
      typeof raw.label === "string" && raw.label.trim()
        ? raw.label.trim()
        : `region_${index + 1}`,
    bbox: {
      x,
      y,
      width: clampedWidth,
      height: clampedHeight,
    },
    score:
      typeof raw.score === "number" && Number.isFinite(raw.score)
        ? Math.min(Math.max(raw.score, 0), 1)
        : undefined,
  };
}

function parseDetectionPayload(text: string): Detection[] | null {
  const jsonText = extractJsonObject(text);

  if (!jsonText) {
    return null;
  }

  let parsed: RawDetectionPayload;

  try {
    parsed = JSON.parse(jsonText) as RawDetectionPayload;
  } catch {
    return null;
  }

  if (!Array.isArray(parsed.detections)) {
    return null;
  }

  return parsed.detections
    .map((detection, index) => normalizeDetection(detection, index))
    .filter((detection): detection is Detection => detection !== null);
}

export async function POST(request: Request) {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return Response.json(
        { error: "이미지 파일을 보내야 합니다." },
        { status: 400 },
      );
    }

    if (!isSupportedImageFile(image)) {
      return Response.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "이미지 파일 크기는 10MB 이하여야 합니다." },
        { status: 413 },
      );
    }

    const imageBytes = await image.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBytes);

    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: image.type,
                  data: imageBase64,
                },
              },
              {
                text: DETECTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      return Response.json(
        { error: payload.error?.message ?? "Gemini 호출에 실패했습니다." },
        { status: 502 },
      );
    }

    const responseText = extractGeminiText(payload);
    const detections = parseDetectionPayload(responseText);

    if (!detections) {
      return Response.json(
        { error: "Gemini bbox JSON을 해석하지 못했습니다." },
        { status: 502 },
      );
    }

    const result: DetectionResponse = {
      detections,
      image: {
        coordinateSpace: "normalized",
        origin: "top-left",
      },
      finishReason: payload.candidates?.[0]?.finishReason ?? null,
      model,
    };

    return Response.json(result);
  } catch {
    return Response.json(
      { error: "bbox 감지 요청 중 문제가 발생했습니다." },
      { status: 500 },
    );
  }
}
