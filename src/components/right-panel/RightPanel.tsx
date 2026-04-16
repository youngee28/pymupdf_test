import Image from "next/image";
import type { ResultPart } from "@/lib/result-parts";

type RequestStatus = "idle" | "loading" | "success" | "error";

export type RightPanelProps = {
  previewUrl: string | null;
  fileName: string | null;
  status: RequestStatus;
  resultParts: ResultPart[];
  error: string | null;
};

export function RightPanel({
  previewUrl,
  fileName,
  status,
  resultParts,
  error,
}: RightPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100 p-4 dark:bg-neutral-950">
      <div className="mb-3 shrink-0 space-y-1">
        <p className="text-sm text-black/70 dark:text-white/70">
          {fileName ?? "업로드한 파일과 API 결과가 여기에 표시됩니다."}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-h-0 rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
          <div className="relative h-full min-h-[280px] w-full overflow-hidden">
            {previewUrl ? (
              <div className="absolute inset-4">
                <Image
                  src={previewUrl}
                  alt={fileName ?? "업로드한 이미지 미리보기"}
                  unoptimized
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-black/15 text-sm text-black/50 dark:border-white/15 dark:text-white/50">
                왼쪽 패널에서 이미지를 업로드해 주세요.
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex h-full min-h-[280px] flex-col p-5">
            <div className="mb-4 shrink-0">
              <h2 className="text-lg font-semibold">API 결과</h2>
              <p className="text-sm text-black/60 dark:text-white/60">
                프롬프트 처리 결과가 여기에 표시됩니다.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm leading-6 text-black/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
              {status === "loading" ? (
                <p>결과를 생성하고 있습니다...</p>
              ) : null}

              {status === "error" && error ? (
                <p className="text-red-600 dark:text-red-400">{error}</p>
              ) : null}

              {status === "success" && resultParts.length > 0 ? (
                <div className="space-y-4">
                  {resultParts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={`text-${index}`} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }

                    return (
                      <div
                        key={`image-${index}`}
                        className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-black/20"
                      >
                        <Image
                          src={`data:${part.mimeType};base64,${part.data}`}
                          alt={`Gemini result ${index + 1}`}
                          unoptimized
                          width={1200}
                          height={1200}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {status === "idle" ? (
                <p className="text-black/50 dark:text-white/50">
                  이미지를 업로드하고 프롬프트를 입력한 뒤 실행 버튼을 누르면 결과가 여기에 나타납니다.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
