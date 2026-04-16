"use client";

import { useEffect, useState } from "react";

import { LeftPanel } from "@/components/left-panel/LeftPanel";
import { RightPanel } from "@/components/right-panel/RightPanel";
import type { Box, Size } from "@/lib/coordinates";
import { validateImageFile } from "@/lib/image-upload";

const DEFAULT_BOX: Box = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export function ImageWorkspace() {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState<Box>(DEFAULT_BOX);
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);

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
      setPreviewUrl(null);
      setSelectedFileName(null);
      setError(null);
      setBox(DEFAULT_BOX);
      setNaturalSize(null);
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setPreviewUrl(null);
      setSelectedFileName(null);
      setError(validationError);
      setBox(DEFAULT_BOX);
      setNaturalSize(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(nextPreviewUrl);
    setSelectedFileName(file.name);
    setError(null);
    setBox(DEFAULT_BOX);
    setNaturalSize(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <LeftPanel
        selectedFileName={selectedFileName}
        error={error}
        box={box}
        naturalSize={naturalSize}
        onFileSelect={handleFileSelect}
        onBoxChange={setBox}
      />
      <RightPanel
        previewUrl={previewUrl}
        fileName={selectedFileName}
        box={box}
        naturalSize={naturalSize}
        onImageLoad={setNaturalSize}
      />
    </div>
  );
}
