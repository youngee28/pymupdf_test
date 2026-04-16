import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-upload";

type RequestStatus = "idle" | "loading" | "success" | "error";

export type LeftPanelProps = {
  selectedFileName: string | null;
  error: string | null;
  status: RequestStatus;
  extraInstruction: string;
  onFileSelect: (file: File | null) => void;
  onExtraInstructionChange: (value: string) => void;
  onRun: () => void;
};

export function LeftPanel({
  selectedFileName,
  error,
  status,
  extraInstruction,
  onFileSelect,
  onExtraInstructionChange,
  onRun,
}: LeftPanelProps) {
  return (
    <aside className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-r border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">이미지 업로드</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          이미지를 업로드한 뒤 추가 지시사항을 입력하고 실행 버튼으로 bbox 감지를 시작할 수 있습니다.
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

      <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-black/20">
        <div className="space-y-1">
          <p className="font-medium">테스트용 추가 지시사항</p>
          <p className="text-black/70 dark:text-white/70">
            기본 bbox 감지 프롬프트 뒤에 덧붙여 테스트합니다. 비워두면 기본 프롬프트만 사용합니다.
          </p>
        </div>

        <textarea
          value={extraInstruction}
          maxLength={2000}
          onChange={(event) => {
            onExtraInstructionChange(event.target.value);
          }}
          placeholder="예: 이미지에 있는 시각요소 영역을 알려줘."
          className="min-h-32 w-full resize-y rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-black outline-none transition placeholder:text-black/40 focus:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-white/30"
        />

        <p className="text-xs text-black/55 dark:text-white/55">
          실행 버튼을 누르면 현재 입력값이 함께 전송되며, JSON 스키마와 반환 형식은 백엔드 고정 규칙이 유지됩니다.
        </p>

        <button
          type="button"
          onClick={onRun}
          disabled={status === "loading"}
          className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/85 dark:disabled:bg-white/40"
        >
          {status === "loading" ? "실행 중..." : "실행"}
        </button>

        {error ? (
          <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-black/20">
        <div className="w-full rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
          <pre className="select-text whitespace-pre-wrap break-words font-sans">
            {`JSON 형식으로만 반환합니다.
마크다운 형식은 반환하지 않습니다.

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

규칙:
- 바운딩 박스 값은 0에서 1 사이의 정규화된 소수여야 합니다.
- 원점은 왼쪽 상단입니다.
- 너비와 높이는 양수여야 합니다.
- 아무것도 찾지 못하면 {"detections": []}를 반환합니다.`}
          </pre>
        </div>
      </div>
    </aside>
  );
}
