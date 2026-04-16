import type { Detection } from "@/lib/detections";

type RequestStatus = "idle" | "loading" | "success" | "error";

export type CenterPanelProps = {
  fileName: string | null;
  status: RequestStatus;
  detections: Detection[];
  error: string | null;
};

export function CenterPanel({
  fileName,
  status,
  detections,
  error,
}: CenterPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100 p-4 dark:bg-neutral-950">
      <div className="mb-3 shrink-0 space-y-1">
        <p className="text-sm text-black/70 dark:text-white/70">
          {fileName ?? "업로드한 파일과 bbox JSON 결과가 여기에 표시됩니다."}
        </p>
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex h-full min-h-[280px] flex-col p-5">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-semibold">bbox JSON 결과</h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              자동 감지된 레이아웃 영역의 정규화 좌표 결과입니다.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm leading-6 text-black/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
            {status === "loading" ? <p>bbox를 감지하고 있습니다...</p> : null}

            {status === "error" && error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {status === "success" ? (
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(detections, null, 2)}</pre>
            ) : null}

            {status === "idle" ? (
              <p className="text-black/50 dark:text-white/50">
                이미지를 업로드하면 자동으로 bbox 감지가 실행되고 JSON 결과가 여기에 나타납니다.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
