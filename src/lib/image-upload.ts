export const ACCEPTED_IMAGE_TYPES = "image/*";
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp|gif|bmp|svg|tiff?)$/i;

export function isSupportedImageFile(file: File): boolean {
  const hasImageMimeType = file.type.startsWith("image/");
  const hasImageExtension = IMAGE_EXTENSION_PATTERN.test(file.name);

  return hasImageMimeType || hasImageExtension;
}

export function validateImageFile(file: File): string | null {
  if (!isSupportedImageFile(file)) {
    return "이미지 파일만 업로드할 수 있습니다.";
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return "이미지 파일 크기는 10MB 이하여야 합니다.";
  }

  return null;
}
