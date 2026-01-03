// TypeScript types and enums for MapleStory data

export enum NodeType {
  NONE = 0,
  HORIZONTAL = 1,
  VERTICAL = 2,
  BOTH = 3,
  SCROLLHORIZONTAL = 4,
  SCROLLVERTICAL = 5,
  BOTHSCROLLHORIZONTAL = 6,
  BOTHSCROLLVERTICAL = 7,
}

export interface BackNodeData {
  no: number; // frame(?) number
  type: NodeType; // frame type
  bS: string; // background sprite source
  x: number; // x position
  y: number; // y position
  cx: number; // canvas x size
  cy: number; // canvas y size
  rx: number; // scroll x speed
  ry: number; // scroll y speed
  a: number; // alpha
}

export interface SpriteNodeData {
  no: number; // frame(?) number
  origin: number[]; // origin point
  z: number; // z-index
  outlink: string; // sprite file path (in WZ)
}

export interface LayerData {
  data: BackNodeData;
  sprite: SpriteNodeData;
  path: string;
}

export interface FlattenedLayer {
  type: "static" | "dynamic";
  data: LayerData[];
}
