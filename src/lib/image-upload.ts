export const ACCEPTED_IMAGE_TYPES = "image/*";

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp|gif|bmp|svg|tiff?)$/i;

export function validateImageFile(file: File): string | null {
  const hasImageMimeType = file.type.startsWith("image/");
  const hasImageExtension = IMAGE_EXTENSION_PATTERN.test(file.name);

  if (hasImageMimeType || hasImageExtension) {
    return null;
  }

  return "이미지 파일만 업로드할 수 있습니다.";
}
