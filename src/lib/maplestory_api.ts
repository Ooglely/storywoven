import AdmZip from "adm-zip";
import { CWebp } from "cwebp";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import { addNewMob } from "./db/comments";
import { checkImages } from "$lib/validate";

export interface MobPreview {
  id: number;
  name: string;
  frames: {
    stand: string[];
    move: string[];
  };
}

export async function downloadMSMob(id: number) {
  // Download mob from maplestory.io API
  const response = await fetch(
    `https://maplestory.io/api/GMS/255/mob/${id}/download`,
  );
  if (!response.ok) {
    throw new Error("Failed to download mob");
  }
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // We want to check the images before fully extracting the zip
  // All the entries are put into buffers
  const zip = new AdmZip(buffer);
  const image_entries = zip.getEntries();
  const images = image_entries.reduce<Buffer[]>((results, entry) => {
    if (entry.name.startsWith("move_") || entry.name.startsWith("stand_")) {
      results.push(entry.getData());
    }
    return results;
  }, []);

  // Check if images fit within the size restraints
  const mob_size = await checkImages(images);
  if (mob_size.width > 256 || mob_size.height > 256) {
    throw new Error("Mob images are too large");
  }

  // Count each type of frame
  const stand_frames = image_entries.filter((entry) =>
    entry.name.startsWith("stand_"),
  ).length;
  const move_frames = image_entries.filter((entry) =>
    entry.name.startsWith("move_"),
  ).length;

  // Convert source images to WebP and save to disk
  const mob_folder = `static/mobs/${id}`;
  if (!fs.existsSync(mob_folder)) {
    fs.mkdirSync(mob_folder);
  }
  for (const entry of image_entries) {
    const encoder = new CWebp(entry.getData());
    encoder.write(`${mob_folder}/${entry.name.split(".")[0]}.webp`);
  }

  // Add new mob to database
  const mob_ID = await addNewMob({
    width: mob_size.width,
    height: mob_size.height,
    interval: 300,
    id: id,
    frames: {
      stand: stand_frames,
      move: move_frames,
    },
  });

  return mob_ID;
}

export async function previewMSMob(id: number): Promise<MobPreview> {
  // Download mob from maplestory.io API
  const response = await fetch(
    `https://maplestory.io/api/GMS/255/mob/${id}/download`,
  );
  if (!response.ok) {
    throw new Error("Failed to download mob");
  }
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract images from zip
  const zip = new AdmZip(buffer);
  const image_entries = zip.getEntries();
  const images = image_entries.reduce<Buffer[]>((results, entry) => {
    if (entry.name.startsWith("move_") || entry.name.startsWith("stand_")) {
      results.push(entry.getData());
    }
    return results;
  }, []);

  // Check if images fit within the size restraints
  const mob_size = await checkImages(images);
  if (mob_size.width > 256 || mob_size.height > 256) {
    throw new Error("Mob images are too large (stay below 256x256px)");
  }

  // Get mob name
  const name_response = await fetch(
    `https://maplestory.io/api/GMS/255/mob/${id}/name`,
  );
  if (!name_response.ok) {
    throw new Error("Failed to get mob name");
  }
  const name_data = await name_response.json();
  const mob_name = name_data.name;

  // Convert images to base64 for preview
  const stand_frames: string[] = [];
  const move_frames: string[] = [];

  for (const entry of image_entries) {
    if (entry.name.startsWith("stand_")) {
      const base64 = entry.getData().toString("base64");
      stand_frames.push(`data:image/png;base64,${base64}`);
    } else if (entry.name.startsWith("move_")) {
      const base64 = entry.getData().toString("base64");
      move_frames.push(`data:image/png;base64,${base64}`);
    }
  }

  return {
    id: id,
    name: mob_name,
    frames: {
      stand: stand_frames,
      move: move_frames,
    },
  };
}
