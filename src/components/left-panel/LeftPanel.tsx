import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-upload";

type RequestStatus = "idle" | "loading" | "success" | "error";

export type LeftPanelProps = {
  selectedFileName: string | null;
  error: string | null;
  status: RequestStatus;
  onFileSelect: (file: File | null) => void;
};

export function LeftPanel({
  selectedFileName,
  error,
  status,
  onFileSelect,
}: LeftPanelProps) {
  return (
    <aside className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-r border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">이미지 업로드</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          이미지를 업로드하면 자동으로 레이아웃 bbox 감지가 실행되고 JSON 결과가 생성됩니다.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/20 bg-white p-6 text-center transition hover:border-black/40 dark:border-white/20 dark:bg-black/20 dark:hover:border-white/40">
        <span className="text-sm font-medium">이미지 파일 선택</span>
        <span className="text-xs text-black/60 dark:text-white/60">
          PNG, JPG, WEBP 등 이미지 파일
        </span>
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          disabled={status === "loading"}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onFileSelect(file);
          }}
        />
      </label>

      <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black/20">
        <p className="text-sm font-medium">선택된 파일</p>
        <p className="break-all text-sm text-black/70 dark:text-white/70">
          {selectedFileName ?? "아직 선택된 파일이 없습니다."}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-black/20">
        <p className="font-medium">현재 상태</p>
        <p className="text-black/70 dark:text-white/70">
          {status === "loading"
            ? "이미지를 분석해서 bbox JSON을 생성하고 있습니다."
            : "업로드 후 자동으로 bbox 감지가 시작됩니다."}
        </p>
        {error ? (
          <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
    </aside>
  );
}
