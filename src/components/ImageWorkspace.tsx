"use client";

import { useEffect, useRef, useState } from "react";

import { LeftPanel } from "@/components/left-panel/LeftPanel";
import { RightPanel } from "@/components/right-panel/RightPanel";
import { validateImageFile } from "@/lib/image-upload";
import type { ResultPart } from "@/lib/result-parts";

type RequestStatus = "idle" | "loading" | "success" | "error";

export function ImageWorkspace() {
  const requestIdRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [resultParts, setResultParts] = useState<ResultPart[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setSelectedFileName(null);
      setPreviewUrl(null);
      setFormError(null);
      setRequestError(null);
      setStatus("idle");
      setResultParts([]);
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setSelectedFile(null);
      setSelectedFileName(null);
      setPreviewUrl(null);
      setFormError(validationError);
      setRequestError(null);
      setStatus("error");
      setResultParts([]);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setPreviewUrl(nextPreviewUrl);
    setFormError(null);
    setRequestError(null);
    setStatus("idle");
    setResultParts([]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setFormError("먼저 이미지 파일을 선택해 주세요.");
      setRequestError(null);
      setStatus("error");
      return;
    }

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setFormError("프롬프트를 입력해 주세요.");
      setRequestError(null);
      setStatus("error");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("prompt", trimmedPrompt);

    setStatus("loading");
    setFormError(null);
    setRequestError(null);
    setResultParts([]);

    try {
      const response = await fetch("/api/image-prompt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        parts?: ResultPart[];
        finishReason?: string | null;
        error?: string;
      };

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok || !Array.isArray(payload.parts) || payload.parts.length === 0) {
        setStatus("error");
        setRequestError(payload.error ?? "결과를 불러오지 못했습니다.");
        return;
      }

      setStatus("success");
      setResultParts(payload.parts);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setStatus("error");
      setRequestError("요청 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <LeftPanel
        selectedFileName={selectedFileName}
        prompt={prompt}
        error={formError}
        status={status}
        onFileSelect={handleFileSelect}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
      />
      <RightPanel
        previewUrl={previewUrl}
        fileName={selectedFileName}
        status={status}
        resultParts={resultParts}
        error={requestError}
      />
    </div>
  );
}
