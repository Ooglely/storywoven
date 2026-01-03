// handle uploading images from client to server
import fs from "node:fs";
import { CWebp } from "cwebp";

// Upload images to server
export function uploadImages(
  standImages: Buffer[],
  moveImages: Buffer[],
  id: number,
) {
  // Convert source images to WebP and save to disk
  const mob_folder = `static/mobs/${id}`;
  if (!fs.existsSync(mob_folder)) {
    fs.mkdirSync(mob_folder);
  }

  standImages.forEach(async (file, index) => {
    const encoder = new CWebp(file);
    encoder.write(`${mob_folder}/stand_${index}.webp`);
  });

  moveImages.forEach(async (file, index) => {
    const encoder = new CWebp(file);
    encoder.write(`${mob_folder}/move_${index}.webp`);
  });
}
