import type { Actions } from "./$types";
import { fail, isActionFailure } from "@sveltejs/kit";
import { downloadMSMob } from "$lib/maplestory_api";
import {
  addComment,
  getFullComment,
  getSingleUser,
  addUser,
  getMob,
} from "$lib/db/comments";

export const actions = {
  add_comment: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name");
    const comment = data.get("comment");
    const id = data.get("id");

    if (!name || !comment || !id) {
      return fail(400, { success: false, missing: true });
    }

    // Check if the mob already exists in db
    const mob = await getMob(Number(id));
    if (!mob) {
      // Download the mob
      const mob_id = await downloadMSMob(Number(id)).catch((e) => {
        return fail(400, { success: false, error: e.message });
      });

      if (isActionFailure(mob_id)) {
        return mob_id;
      }
    }

    // Add the comment to the db
    const user_data = await getSingleUser(String(name));
    let new_comment;
    if (user_data) {
      new_comment = await addComment({
        authorID: user_data.id,
        comment: String(comment),
        mobID: Number(id),
      });
    } else {
      const new_user = await addUser({ name: String(name) });
      new_comment = await addComment({
        authorID: new_user.id,
        comment: String(comment),
        mobID: Number(id),
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
