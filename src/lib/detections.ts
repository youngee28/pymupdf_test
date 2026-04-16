export type Detection = {
  id: string;
  label: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score?: number;
};

export type DetectionResponse = {
  detections: Detection[];
  image: {
    coordinateSpace: "normalized";
    origin: "top-left";
  };
  finishReason: string | null;
  model: string;
};
