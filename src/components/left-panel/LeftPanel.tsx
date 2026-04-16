import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-upload";

type RequestStatus = "idle" | "loading" | "success" | "error";

export type LeftPanelProps = {
  selectedFileName: string | null;
  prompt: string;
  error: string | null;
  status: RequestStatus;
  onFileSelect: (file: File | null) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
};

export function LeftPanel({
  selectedFileName,
  prompt,
  error,
  status,
  onFileSelect,
  onPromptChange,
  onSubmit,
}: LeftPanelProps) {
  return (
    <aside className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-r border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">이미지 업로드</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          이미지를 업로드하고 프롬프트를 입력하면 오른쪽 패널에 API 결과가 표시됩니다.
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
        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black/20">
        <div className="space-y-1">
          <p className="text-sm font-medium">프롬프트 입력</p>
          <p className="text-xs text-black/60 dark:text-white/60">
            이미지와 함께 보낼 프롬프트를 입력하세요.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="block font-medium">Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => {
              onPromptChange(event.target.value);
            }}
            disabled={status === "loading"}
            rows={8}
            placeholder="예: 이 이미지의 핵심 내용을 짧게 요약해 줘"
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:bg-black/30 dark:focus:border-white/40"
          />
        </label>

        <button
          type="button"
          onClick={onSubmit}
          disabled={status === "loading"}
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/85 dark:disabled:bg-white/40"
        >
          {status === "loading" ? "요청 중..." : "실행"}
        </button>
      </div>
    </aside>
  );
}
