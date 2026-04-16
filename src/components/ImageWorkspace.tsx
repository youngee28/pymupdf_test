"use client";

import { useEffect, useRef, useState } from "react";

import { CenterPanel } from "@/center-panel/CenterPanel";
import { LeftPanel } from "@/components/left-panel/LeftPanel";
import { RightPanel } from "@/components/right-panel/RightPanel";
import type { Detection, DetectionResponse } from "@/lib/detections";
import { validateImageFile } from "@/lib/image-upload";

type RequestStatus = "idle" | "loading" | "success" | "error";

export function ImageWorkspace() {
  const requestIdRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [extraInstruction, setExtraInstruction] = useState(
    "문서에서 표, 그래프, 차트, 이미지 등의 시각요소를 탐지하세요.\n각 시각요소는 관련 제목, 단위, 캡션, 축 라벨을 함께 포함하고, bounding box를 시각요소 영역보다 상하좌우 각각 5픽셀씩 확장하여 반환하세요.\n시각요소에 딱 맞게 자르지 말고, 항상 여백을 포함하세요.\n출력은 JSON 형식으로 작성하세요.",
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const runDetection = async (
    file: File,
    requestId: number,
    nextExtraInstruction: string,
  ) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("extraInstruction", nextExtraInstruction);

    try {
      const response = await fetch("/api/image-prompt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as DetectionResponse & {
        error?: string;
      };

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok || !Array.isArray(payload.detections)) {
        setStatus("error");
        setRequestError(payload.error ?? "bbox 결과를 불러오지 못했습니다.");
        return;
      }

      setStatus("success");
      setDetections(payload.detections);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setStatus("error");
      setRequestError("bbox 감지 요청 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  const handleFileSelect = (file: File | null) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setSelectedFileName(null);
      setPreviewUrl(null);
      setSelectedDetectionId(null);
      setFormError(null);
      setRequestError(null);
      setStatus("idle");
      setDetections([]);
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setSelectedFile(null);
      setSelectedFileName(null);
      setPreviewUrl(null);
      setSelectedDetectionId(null);
      setFormError(validationError);
      setRequestError(null);
      setStatus("error");
      setDetections([]);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setPreviewUrl(nextPreviewUrl);
    setSelectedDetectionId(null);
    setFormError(null);
    setRequestError(null);
    setStatus("idle");
    setDetections([]);
  };

  const handleRun = () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!selectedFile) {
      setFormError("먼저 이미지 파일을 선택해 주세요.");
      setRequestError(null);
      setStatus("error");
      setDetections([]);
      return;
    }

    setFormError(null);
    setRequestError(null);
    setSelectedDetectionId(null);
    setStatus("loading");
    setDetections([]);

    void runDetection(selectedFile, requestId, extraInstruction);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <LeftPanel
        selectedFileName={selectedFileName}
        error={formError}
        status={status}
        extraInstruction={extraInstruction}
        onFileSelect={handleFileSelect}
        onExtraInstructionChange={setExtraInstruction}
        onRun={handleRun}
      />
      <CenterPanel
        fileName={selectedFileName}
        status={status}
        detections={detections}
        error={requestError}
      />
      <RightPanel
        previewUrl={previewUrl}
        status={status}
        detections={detections}
        selectedDetectionId={selectedDetectionId}
        onSelectedDetectionChangeAction={setSelectedDetectionId}
        sourceFileName={selectedFileName}
        sourceMimeType={selectedFile?.type ?? null}
        error={requestError ?? formError}
      />
    </div>
  );
}
