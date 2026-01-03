import type { RequestHandler } from "../$types";
import { json } from "@sveltejs/kit";
import { getMapleMob } from "$lib/db/comments";

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");

  if (!id) {
    return json({ error: "Missing mob ID" }, { status: 400 });
  }

  const mobId = parseInt(id);
  if (isNaN(mobId)) {
    return json({ error: "Invalid mob ID" }, { status: 400 });
  }

  try {
    const mapleMob = await getMapleMob(mobId);
    if (!mapleMob) {
      return json({ error: "Mob not found" }, { status: 404 });
    }
    return json(mapleMob);
  } catch (error) {
    console.error("Error previewing mob:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to preview mob",
      },
      { status: 500 },
    );
  }
};
