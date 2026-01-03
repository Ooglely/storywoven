declare module "cwebp" {
  export class Wrapper {
    write(outfile: string, done?: () => void): void;
  }

  export class CWebp extends Wrapper {
    constructor(source: Buffer);
  }
}
