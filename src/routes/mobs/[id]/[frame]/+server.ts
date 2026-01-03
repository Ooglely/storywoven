import { error } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  // need to serve mob files generated at runtime
  const filePath = path.join("static/mobs", params.id, `${params.frame}.webp`);

  // prevent path traversal
  if (!filePath.startsWith("static/mobs")) {
    throw error(403, "Forbidden");
  }

  try {
    const file = await fs.readFile(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=2592000",
      },
    });
  } catch (e) {
    throw error(404, `File not found: ${e}`);
  }
};
