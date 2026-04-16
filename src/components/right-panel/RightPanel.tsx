"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Detection } from "@/lib/detections";

type RequestStatus = "idle" | "loading" | "success" | "error";

type RightPanelProps = {
  previewUrl: string | null;
  status: RequestStatus;
  detections: Detection[];
  error: string | null;
};

type Size = {
  width: number;
  height: number;
};

type LoadedImage = Size & {
  src: string;
};

function getStatusMessage(status: RequestStatus, error: string | null) {
  if (status === "loading") {
    return "이미지를 표시하는 동안 bbox 결과를 기다리고 있습니다.";
  }

  if (status === "error") {
    return error ?? "이미지 미리보기를 준비하지 못했습니다.";
  }

  if (status === "success") {
    return "정규화 bbox 좌표를 실제 표시된 이미지 영역 위에 오버레이합니다.";
  }

  return "이미지를 업로드하면 오른쪽 패널에서 bbox 오버레이를 확인할 수 있습니다.";
}

export function RightPanel({
  previewUrl,
  status,
  detections,
  error,
}: RightPanelProps) {
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);

  useEffect(() => {
    const element = previewFrameRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const renderedImageArea = useMemo(() => {
    if (
      !previewUrl ||
      !loadedImage ||
      loadedImage.src !== previewUrl ||
      frameSize.width <= 0 ||
      frameSize.height <= 0 ||
      loadedImage.width <= 0 ||
      loadedImage.height <= 0
    ) {
      return null;
    }

    const scale = Math.min(
      frameSize.width / loadedImage.width,
      frameSize.height / loadedImage.height,
    );
    const width = loadedImage.width * scale;
    const height = loadedImage.height * scale;

    return {
      width,
      height,
      left: (frameSize.width - width) / 2,
      top: (frameSize.height - height) / 2,
    };
  }, [frameSize, loadedImage, previewUrl]);

  const hasPreview = Boolean(previewUrl);

  return (
    <aside className="flex h-full min-h-0 flex-1 flex-col gap-3 border-l border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="shrink-0 space-y-1">
        <h2 className="text-lg font-semibold">이미지 미리보기</h2>
        <p className="text-sm text-black/60 dark:text-white/60">
          {getStatusMessage(status, error)}
        </p>
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
        <div
          ref={previewFrameRef}
          className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-white/5"
        >
          {hasPreview && previewUrl ? (
            <>
              <Image
                src={previewUrl}
                alt="업로드한 미리보기"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 24rem"
                className="object-contain"
                onLoad={(event) => {
                  const imageElement = event.currentTarget;

                  setLoadedImage({
                    src: previewUrl,
                    width: imageElement.naturalWidth,
                    height: imageElement.naturalHeight,
                  });
                }}
              />

              {renderedImageArea
                ? detections.map((detection) => (
                    <div
                      key={detection.id}
                      className="pointer-events-none absolute border border-black shadow-[0_0_0_1px_rgba(255,255,255,0.35)]"
                      style={{
                        left:
                          renderedImageArea.left +
                          detection.bbox.x * renderedImageArea.width,
                        top:
                          renderedImageArea.top +
                          detection.bbox.y * renderedImageArea.height,
                        width: detection.bbox.width * renderedImageArea.width,
                        height: detection.bbox.height * renderedImageArea.height,
                      }}
                    >
                      <span className="absolute left-0 top-0 max-w-full truncate bg-black/80 px-2 py-1 text-[11px] leading-none text-white">
                        {detection.label}
                      </span>
                    </div>
                  ))
                : null}

              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-2">
                {status === "loading" ? (
                  <p className="rounded-lg bg-black/75 px-3 py-2 text-xs text-white">
                    bbox를 감지하고 있습니다...
                  </p>
                ) : null}

                {status === "error" && error ? (
                  <p className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white dark:bg-red-500">
                    {error}
                  </p>
                ) : null}

                {status === "success" && detections.length === 0 ? (
                  <p className="rounded-lg bg-black/75 px-3 py-2 text-xs text-white">
                    감지된 bbox가 없습니다.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="px-6 text-center text-sm text-black/45 dark:text-white/45">
              {status === "error" && error
                ? error
                : "업로드한 이미지가 여기에 표시되고 bbox 오버레이가 함께 렌더링됩니다."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
