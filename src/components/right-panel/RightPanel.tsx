import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { getScaledBox, hasVisibleBox, type Box, type Size } from "@/lib/coordinates";

export type RightPanelProps = {
  previewUrl: string | null;
  fileName: string | null;
  box: Box;
  naturalSize: Size | null;
  onImageLoad: (size: Size | null) => void;
};

export function RightPanel({
  previewUrl,
  fileName,
  box,
  naturalSize,
  onImageLoad,
}: RightPanelProps) {
  const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
  const [frameElement, setFrameElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!frameElement) {
      return;
    }

    const updateFrameSize = () => {
      setFrameSize({
        width: frameElement.clientWidth,
        height: frameElement.clientHeight,
      });
    };

    updateFrameSize();

    const resizeObserver = new ResizeObserver(() => {
      updateFrameSize();
    });

    resizeObserver.observe(frameElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [frameElement]);

  const scaledBox = useMemo(() => {
    if (!naturalSize || !hasVisibleBox(box)) {
      return null;
    }

    return getScaledBox(box, naturalSize, frameSize);
  }, [box, frameSize, naturalSize]);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100 p-4 dark:bg-neutral-950">
      <div className="mb-3 shrink-0 space-y-1">
        <p className="text-sm text-black/70 dark:text-white/70">
          {fileName ?? "업로드한 이미지가 여기에 표시됩니다."}
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
          <div
            ref={(node) => {
              setFrameElement(node);
            }}
            className="absolute inset-4"
          >
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt={fileName ?? "업로드한 이미지 미리보기"}
                  unoptimized
                  fill
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-contain"
                  onLoad={(event) => {
                    const target = event.currentTarget;

                    onImageLoad({
                      width: target.naturalWidth,
                      height: target.naturalHeight,
                    });
                  }}
                  onError={() => {
                    onImageLoad(null);
                  }}
                />

                {scaledBox ? (
                  <div
                    className="pointer-events-none absolute rounded-md border-2 border-red-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
                    style={{
                      left: `${scaledBox.x}px`,
                      top: `${scaledBox.y}px`,
                      width: `${scaledBox.width}px`,
                      height: `${scaledBox.height}px`,
                    }}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-black/15 text-sm text-black/50 dark:border-white/15 dark:text-white/50">
                왼쪽 패널에서 이미지를 업로드해 주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
