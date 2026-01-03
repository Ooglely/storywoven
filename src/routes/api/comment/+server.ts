import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getNewestComments } from "$lib/db/comments";

export const GET: RequestHandler = async () => {
  const result = await getNewestComments();
  return json(result);
};
