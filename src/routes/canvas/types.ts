export interface CanvasContext {
  addUser(id: number, renderer: () => void): void;
  removeUser(id: number): void;
  context(): CanvasRenderingContext2D;
  canvas(): HTMLCanvasElement;
  mousePosition(): { x: number | undefined; y: number | undefined };
}

export interface CommentCanvasContext extends CanvasContext {
  addCommentCheck(
    id: number,
    callback: (
      x: number | undefined,
      y: number | undefined,
      currentIndex: number | undefined,
    ) => boolean,
  ): void;
}
