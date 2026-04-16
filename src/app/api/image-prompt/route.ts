import {
  isSupportedImageFile,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "@/lib/image-upload";
import type { ResultPart } from "@/lib/result-parts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-3-pro-image-preview";

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
        inline_data?: {
          mime_type?: string;
          data?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const rawModel = process.env.GEMINI_MODEL?.trim();
  const normalizedModel = rawModel?.replace(/^models\//, "");
  const model = normalizedModel || DEFAULT_GEMINI_MODEL;

  return { apiKey, model };
}

function extractGeminiText(payload: GeminiResponse): string | null {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n") || null;
}

function extractGeminiParts(payload: GeminiResponse): ResultPart[] {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];

  return parts.flatMap((part): ResultPart[] => {
    const text = part.text?.trim();

    if (text) {
      return [{ type: "text", text }];
    }

    const inlineImage = part.inlineData ??
      (part.inline_data
        ? {
            mimeType: part.inline_data.mime_type,
            data: part.inline_data.data,
          }
        : undefined);

    if (inlineImage?.mimeType && inlineImage.data) {
      return [
        {
          type: "image",
          mimeType: inlineImage.mimeType,
          data: inlineImage.data,
        },
      ];
    }

    return [];
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
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
    const prompt = formData.get("prompt");

    if (!(image instanceof File) || typeof prompt !== "string") {
      return Response.json(
        { error: "이미지 파일과 프롬프트를 함께 보내야 합니다." },
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

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return Response.json(
        { error: "프롬프트가 비어 있습니다." },
        { status: 400 },
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
                text: trimmedPrompt,
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

    const resultParts = extractGeminiParts(payload);

    if (resultParts.length > 0) {
      return Response.json({
        parts: resultParts,
        finishReason: payload.candidates?.[0]?.finishReason ?? null,
      });
    }

    const text = extractGeminiText(payload);

    if (!text) {
      return Response.json(
        {
          error: "Gemini 응답에서 렌더링할 텍스트나 이미지를 찾지 못했습니다.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      parts: [{ type: "text", text } satisfies ResultPart],
      finishReason: payload.candidates?.[0]?.finishReason ?? null,
    });
  } catch {
    return Response.json(
      { error: "Gemini 요청 중 문제가 발생했습니다." },
      { status: 500 },
    );
  }
}
