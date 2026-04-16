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
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const runDetection = async (file: File, requestId: number) => {
    const formData = new FormData();
    formData.append("image", file);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFileName(null);
      setPreviewUrl(null);
      setFormError(null);
      setRequestError(null);
      setStatus("idle");
      setDetections([]);
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setSelectedFileName(null);
      setPreviewUrl(null);
      setFormError(validationError);
      setRequestError(null);
      setStatus("error");
      setDetections([]);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setSelectedFileName(file.name);
    setPreviewUrl(nextPreviewUrl);
    setFormError(null);
    setRequestError(null);
    setStatus("loading");
    setDetections([]);

    void runDetection(file, requestId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <LeftPanel
        selectedFileName={selectedFileName}
        error={formError}
        status={status}
        onFileSelect={handleFileSelect}
      />
      <CenterPanel
        fileName={selectedFileName}
        status={status}
        detections={detections}
        error={requestError}
      />
      <RightPanel />
    </div>
  );
}
