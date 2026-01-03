import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  addComment,
  getFullComment,
  getSingleUser,
  addUser,
  getAllComments,
  getMapleMob,
  addNewMob,
} from "$lib/db/comments";
import { checkImages } from "$lib/validate";
import { uploadImages } from "$lib/upload";

export const load: PageServerLoad = async () => {
  const comments = getAllComments();

  return {
    comments,
  };
};

export const actions = {
  add_comment: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name");
    const comment = data.get("comment");
    const id = data.get("id");
    const interval = data.get("interval");
    const offset = data.get("offset");

    if (!name || !comment) {
      return fail(400, { success: false, error: "Missing name or comment" });
    }

    // if a MS mob was selected, check if it is already in the db
    let mobID: number | null = null;
    if (id !== null) {
      const mob = await getMapleMob(Number(id));
      if (mob) {
        // The mob is already in the db, no need to upload the imgs
        mobID = mob.id;
      }
    }

    // if this is a new mob/sprite, upload it to the server
    if (!mobID) {
      // Parse all the images passed through
      const standFiles = data.getAll("stand") as File[];
      const moveFiles = data.getAll("move") as File[];

      if (standFiles.length === 0 || moveFiles.length === 0) {
        mobID = 1; // Default to mob ID 1 if no images are provided
      } else {
        // Convert to buffer and check sizes
        const standBuffers = await Promise.all(
          standFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
        );
        const moveBuffers = await Promise.all(
          moveFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
        );

        const spriteSize = await checkImages([...standBuffers, ...moveBuffers]);
        if (spriteSize.width > 256 || spriteSize.height > 256) {
          throw new Error("Mob images are too large (stay below 256x256px)");
        }
        // Since there wasn't an error here we are good to create a new mob in the DB
        mobID = await addNewMob({
          width: spriteSize.width,
          height: spriteSize.height,
          interval: Number(interval),
          offset: Number(offset),
          frames: {
            stand: standBuffers.length,
            move: moveBuffers.length,
          },
          mapleID: id ? Number(id) : null,
        });

        // Upload the images to the server
        uploadImages(standBuffers, moveBuffers, mobID);
      }
    }

    // Add the comment to the db
    const user_data = await getSingleUser(String(name));
    let new_comment;
    if (user_data) {
      new_comment = await addComment({
        authorID: user_data.id,
        comment: String(comment),
        mobID: mobID,
      });
    } else {
      const new_user = await addUser({ name: String(name) });
      new_comment = await addComment({
        authorID: new_user.id,
        comment: String(comment),
        mobID: mobID,
      });
    }

    // We need the comment data with the author and mob relations
    const full_comment = await getFullComment(new_comment.id);
    if (!full_comment) {
      return fail(500, { success: false, error: "Failed to get full comment" });
    }

    return {
      success: true,
      comment: full_comment,
      error: null,
    };
  },
} satisfies Actions;
