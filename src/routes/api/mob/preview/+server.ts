import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { previewMSMob } from "$lib/maplestory_api";

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
    const preview = await previewMSMob(mobId);
    return json(preview);
  } catch (error) {
    console.error("Error previewing mob:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to preview mob" },
      { status: 500 },
    );
  }
};
