import type { Detection } from "@/lib/detections";

type CropAndDownloadDetectionParams = {
  imageSrc: string;
  detection: Detection;
  fileName: string;
  mimeType?: string;
};

const DOWNLOAD_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function clampUnitValue(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function sanitizeFileSegment(value: string) {
  const normalizedValue = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  const cleanedValue = normalizedValue.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return cleanedValue || "crop";
}

function getDownloadMimeType(mimeType?: string) {
  if (mimeType && DOWNLOAD_MIME_TYPES.has(mimeType)) {
    return mimeType;
  }

  return "image/png";
}

function getFileExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

function getDownloadFileName(fileName: string, label: string, mimeType: string) {
  const extension = getFileExtension(mimeType);
  const fileNameWithoutExtension = fileName.includes(".")
    ? fileName.slice(0, fileName.lastIndexOf("."))
    : fileName;

  return `${sanitizeFileSegment(fileNameWithoutExtension)}-${sanitizeFileSegment(label)}.${extension}`;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("Failed to load image for cropping."));
    };

    image.decoding = "async";
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create image blob."));
        return;
      }

      resolve(blob);
    }, mimeType);
  });
}

export async function cropAndDownloadDetection({
  imageSrc,
  detection,
  fileName,
  mimeType,
}: CropAndDownloadDetectionParams) {
  const image = await loadImageElement(imageSrc);
  const intrinsicWidth = image.naturalWidth || image.width;
  const intrinsicHeight = image.naturalHeight || image.height;

  if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    throw new Error("Image has invalid intrinsic dimensions.");
  }

  const left = Math.floor(clampUnitValue(detection.bbox.x) * intrinsicWidth);
  const top = Math.floor(clampUnitValue(detection.bbox.y) * intrinsicHeight);
  const right = Math.ceil(
    clampUnitValue(detection.bbox.x + detection.bbox.width) * intrinsicWidth,
  );
  const bottom = Math.ceil(
    clampUnitValue(detection.bbox.y + detection.bbox.height) * intrinsicHeight,
  );
  const cropWidth = Math.max(1, right - left);
  const cropHeight = Math.max(1, bottom - top);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  canvas.width = cropWidth;
  canvas.height = cropHeight;
  context.drawImage(
    image,
    left,
    top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  const downloadMimeType = getDownloadMimeType(mimeType);
  const blob = await canvasToBlob(canvas, downloadMimeType);
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = getDownloadFileName(
    fileName,
    detection.label || detection.id,
    downloadMimeType,
  );
  downloadLink.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 0);
}
