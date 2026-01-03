import imageSize from "image-size";

export async function checkImages(images: Buffer[]) {
  // I don't want crazy large sprites to cover the entire page, so I get the max size
  // of the animation here, and later if it is too large the request will be rejected
  const tasks = [];
  for (const path of images) {
    tasks.push(imageSize(path));
  }
  const results = await Promise.all(tasks);

  let maxWidth = 0;
  let maxHeight = 0;

  for (const result of results) {
    if (!result.width || !result.height) {
      throw new Error("Image has no width or height, might be corrupt?");
    }
    maxWidth = Math.max(maxWidth, result.width);
    maxHeight = Math.max(maxHeight, result.height);
  }

  return { width: maxWidth, height: maxHeight };
}
