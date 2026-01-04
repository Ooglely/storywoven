import { usersTable, commentsTable, mobsTable } from "./schema";
import { db } from "./index";
import { eq, desc } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import type { FullComment } from "./types";

type NewUser = typeof usersTable.$inferInsert;
type NewComment = typeof commentsTable.$inferInsert;
type NewMob = typeof mobsTable.$inferInsert;

export async function addUser(user: NewUser) {
  const [new_user] = await db.insert(usersTable).values(user).returning();
  return new_user;
}

export async function addComment(comment: NewComment) {
  const [new_comment] = await db
    .insert(commentsTable)
    .values(comment)
    .returning();
  return new_comment;
}

export async function getFullComment(id: number) {
  return db.query.commentsTable.findFirst({
    where: eq(commentsTable.id, id),
    with: { author: true, mob: true },
  });
}

export async function getUsers() {
  return db.query.usersTable.findMany({
    with: {
      comments: true,
    },
  });
}

export async function getSingleUser(name: string) {
  return db.query.usersTable.findFirst({
    where: eq(usersTable.name, name),
    with: {
      comments: true,
    },
  });
}

export async function getNewestComments() {
  const all_authors = await db
    .selectDistinctOn([commentsTable.authorID], {
      authorID: commentsTable.authorID,
    })
    .from(commentsTable);

  const comments = [];
  for (const author of all_authors) {
    const newest_comment: FullComment | undefined =
      await db.query.commentsTable.findFirst({
        with: { author: true, mob: true },
        where: eq(commentsTable.authorID, author.authorID),
        orderBy: desc(commentsTable.id),
      });
    if (!newest_comment) continue;
    newest_comment.delta = formatDistanceToNow(newest_comment.timestamp, {
      addSuffix: true,
    });
    comments.push(newest_comment);
  }

  return comments;
}

export async function getAllComments() {
  const comments = (await db.query.commentsTable.findMany({
    with: { author: true, mob: true },
    orderBy: desc(commentsTable.id),
  })) as FullComment[];

  comments.forEach((comment) => {
    comment.delta = formatDistanceToNow(comment.timestamp, {
      addSuffix: true,
    });
  });

  return comments;
}

export async function addNewMob(mob: NewMob) {
  const [mobID] = await db
    .insert(mobsTable)
    .values(mob)
    .returning({ id: mobsTable.id });
  return mobID.id;
}

export async function getMob(id: number) {
  return await db.query.mobsTable.findFirst({
    where: eq(mobsTable.id, id),
  });
}

export async function getMapleMob(id: number) {
  return await db.query.mobsTable.findFirst({
    where: eq(mobsTable.mapleID, id),
  });
}
