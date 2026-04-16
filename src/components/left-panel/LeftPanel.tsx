import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-upload";
import type { Box, Size } from "@/lib/coordinates";

export type LeftPanelProps = {
  selectedFileName: string | null;
  error: string | null;
  box: Box;
  naturalSize: Size | null;
  onFileSelect: (file: File | null) => void;
  onBoxChange: (nextBox: Box) => void;
};

export function LeftPanel({
  selectedFileName,
  error,
  box,
  naturalSize,
  onFileSelect,
  onBoxChange,
}: LeftPanelProps) {
  const handleNumberChange = (field: keyof Box, value: string) => {
    const nextValue = value === "" ? 0 : Number(value);

    onBoxChange({
      ...box,
      [field]: Number.isFinite(nextValue) ? nextValue : 0,
    });
  };

  return (
    <aside className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-r border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">이미지 업로드</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          이미지를 업로드하면 오른쪽 패널에 표시됩니다.
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
          <p className="text-sm font-medium">BBox 입력</p>
          <p className="text-xs text-black/60 dark:text-white/60">
            원본 이미지 기준 좌표를 입력하면 오른쪽 이미지 위에 박스가 표시됩니다.
          </p>
          <p className="text-xs text-black/60 dark:text-white/60">
            {naturalSize
              ? `원본 크기: ${naturalSize.width} × ${naturalSize.height}`
              : "이미지를 업로드하면 원본 크기가 표시됩니다."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            ["x", "X"],
            ["y", "Y"],
            ["width", "Width"],
            ["height", "Height"],
          ] as const).map(([field, label]) => (
            <label key={field} className="space-y-1 text-sm">
              <span className="block font-medium">{label}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={box[field]}
                onChange={(event) => {
                  handleNumberChange(field, event.target.value);
                }}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40 dark:border-white/15 dark:bg-black/30 dark:focus:border-white/40"
              />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
