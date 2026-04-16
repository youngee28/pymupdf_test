export type Size = {
  width: number;
  height: number;
};

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ContainedRect = {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function getContainedRect(
  imageSize: Size,
  frameSize: Size,
): ContainedRect | null {
  if (
    imageSize.width <= 0 ||
    imageSize.height <= 0 ||
    frameSize.width <= 0 ||
    frameSize.height <= 0
  ) {
    return null;
  }

  const scale = Math.min(
    frameSize.width / imageSize.width,
    frameSize.height / imageSize.height,
  );

  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  const offsetX = (frameSize.width - width) / 2;
  const offsetY = (frameSize.height - height) / 2;

  return {
    scale,
    offsetX,
    offsetY,
    width,
    height,
  };
}

export function getScaledBox(
  box: Box,
  imageSize: Size,
  frameSize: Size,
): Box | null {
  const containedRect = getContainedRect(imageSize, frameSize);

  if (!containedRect) {
    return null;
  }

  const clampedX = Math.min(Math.max(box.x, 0), imageSize.width);
  const clampedY = Math.min(Math.max(box.y, 0), imageSize.height);
  const clampedRight = Math.min(
    Math.max(box.x + box.width, clampedX),
    imageSize.width,
  );
  const clampedBottom = Math.min(
    Math.max(box.y + box.height, clampedY),
    imageSize.height,
  );

  return {
    x: containedRect.offsetX + clampedX * containedRect.scale,
    y: containedRect.offsetY + clampedY * containedRect.scale,
    width: (clampedRight - clampedX) * containedRect.scale,
    height: (clampedBottom - clampedY) * containedRect.scale,
  };
}

export function hasVisibleBox(box: Box): boolean {
  return box.width > 0 && box.height > 0;
}
