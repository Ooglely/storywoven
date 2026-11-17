import { NodeType } from "$lib/ms_types";
import type { LayerData } from "$lib/ms_types";

class Rectangle {
  constructor(
    public left: number,
    public top: number,
    public width: number,
    public height: number,
  ) {}

  public get right(): number {
    return this.left + this.width;
  }

  public get bottom(): number {
    return this.top + this.height;
  }

  public get origin(): [number, number] {
    // origin is a weird name for this but w/e
    return [this.width / 2, this.height / 2];
  }
}

class Tile {
  public tileRect: Rectangle;
  public position: [number, number];
  public tileOffset: [number, number];

  constructor(
    public layer: LayerData,
    public image: HTMLImageElement,
    public canvasRect: Rectangle,
  ) {
    // only initing these because ts is stupid
    this.position = [Math.floor(layer.data.x), Math.floor(layer.data.y)];
    this.tileOffset = [this.image.width, this.image.height];
    this.tileRect = new Rectangle(0, 0, 0, 0);
    this.updateTile(0);
  }

  updateTile(time: number) {
    let cx = this.layer.data.cx;
    let cy = this.layer.data.cy;

    if (this.layer.data.type != NodeType.NONE && (cx == 0 || cy == 0)) {
      // this covers all node types that aren't none
      // so basically any layer that will tile
      if (cx == 0) cx = this.image.width;
      if (cy == 0) cy = this.image.height;
    }

    let x = this.layer.data.x;
    let y = this.layer.data.y;

    if (this.layer.data.type === NodeType.SCROLLHORIZONTAL) {
      // handle horizontal scrolling
      x += ((this.layer.data.rx * 5 * time) / 1000) % cx;
    }

    if (this.layer.data.type === NodeType.SCROLLVERTICAL) {
      // handle vertical scrolling
      y += ((this.layer.data.ry * 5 * time) / 1000) % cy;
    }

    // round down (idk if i need this)
    this.position = [Math.floor(x), Math.floor(y)];
    this.tileOffset = [cx, cy];

    let left, top, right, bottom: number;
    if (
      [NodeType.HORIZONTAL, NodeType.SCROLLHORIZONTAL].includes(
        this.layer.data.type,
      ) &&
      cx > 0
    ) {
      // This needs to repeat horizontally
      left = Math.floor((this.canvasRect.left - x) / cx) - 1;
      right = Math.ceil((this.canvasRect.right - x) / cx) + 1;
    } else {
      // Just have it placed once
      left = 0;
      right = 1;
    }

    if (this.layer.data.type & NodeType.VERTICAL && cy > 0) {
      // Repeat vertically
      top = Math.floor((this.canvasRect.top - y) / cy) - 1;
      bottom = Math.ceil((this.canvasRect.bottom - y) / cy) + 1;
    } else {
      // Place once
      top = 0;
      bottom = 1;
    }

    this.tileRect = new Rectangle(left, top, right - left, bottom - top);
  }
}

export abstract class Layer {
  protected initId = 0;

  abstract init(width: number, height: number): Promise<void>;
  abstract draw(ctx: CanvasRenderingContext2D, timestamp: number): void;
}

export class StaticLayer extends Layer {
  // Use offscreen canvas bc its optimal ?
  private canvas: OffscreenCanvas | null = null;
  private canvasRect: Rectangle | null = null;

  constructor(readonly data: LayerData[]) {
    super();
  }

  async init(width: number, height: number) {
    const id = ++this.initId;

    // Build into a fresh canvas so the current one keeps drawing until this is ready
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context");
    const canvasRect = new Rectangle(-width / 2, -height / 2, width, height);

    // Go through each layer and draw it in order
    for (const layer of this.data) {
      await this.placeLayer(layer, ctx, canvasRect);
      if (id !== this.initId) return;
    }

    this.canvas = canvas;
    this.canvasRect = canvasRect;
  }

  async placeLayer(
    layer: LayerData,
    ctx: OffscreenCanvasRenderingContext2D,
    canvasRect: Rectangle,
  ) {
    // Load image to draw
    const layer_img = new Image();
    layer_img.src = layer.path;
    await layer_img.decode();
    const tile = new Tile(layer, layer_img, canvasRect);

    // Draw all tiles for static layer
    for (let y = tile.tileRect.top; y < tile.tileRect.bottom; y++) {
      for (let x = tile.tileRect.left; x < tile.tileRect.right; x++) {
        const tileX =
          tile.position[0] +
          tile.tileOffset[0] * x -
          layer.sprite.origin[0] +
          canvasRect.origin[0];
        const tileY =
          tile.position[1] +
          tile.tileOffset[1] * y -
          layer.sprite.origin[1] +
          canvasRect.origin[1];
        ctx.drawImage(layer_img, tileX, tileY);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.canvas) return;

    ctx.drawImage(this.canvas!, 0, 0);
  }
}

export class DynamicLayer extends Layer {
  private canvasRect: Rectangle | null = null;
  private tiles: Tile[] = [];

  constructor(readonly data: LayerData[]) {
    super();
  }

  async init(width: number, height: number) {
    const id = ++this.initId;
    const canvasRect = new Rectangle(-width / 2, -height / 2, width, height);

    // Build a fresh tile list so it replaces tiles instead of duplicating them
    const tiles: Tile[] = [];
    for (const layer of this.data) {
      const layer_img = new Image();
      layer_img.src = layer.path;
      await layer_img.decode();
      if (id !== this.initId) return;
      tiles.push(new Tile(layer, layer_img, canvasRect));
    }

    this.canvasRect = canvasRect;
    this.tiles = tiles;
  }

  draw(ctx: CanvasRenderingContext2D, timestamp: number): void {
    if (!this.canvasRect) return;
    // Go through each tile and draw it in order
    for (const tile of this.tiles) {
      tile.updateTile(timestamp);
      // Draw all tiles for static layer
      for (let y = tile.tileRect.top; y < tile.tileRect.bottom; y++) {
        for (let x = tile.tileRect.left; x < tile.tileRect.right; x++) {
          const tileX =
            tile.position[0] +
            tile.tileOffset[0] * x -
            tile.layer.sprite.origin[0] +
            this.canvasRect.origin[0];
          const tileY =
            tile.position[1] +
            tile.tileOffset[1] * y -
            tile.layer.sprite.origin[1] +
            this.canvasRect.origin[1];
          ctx.drawImage(tile.image, tileX, tileY);
        }
      }
    }
  }
}
