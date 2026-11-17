import { counterTable } from "./schema";
import { db } from "./index";
import { eq, sql } from "drizzle-orm";

export async function incrementVisits() {
  const [row] = await db
    .insert(counterTable)
    .values({ id: 1, visits: 1 })
    .onConflictDoUpdate({
      target: counterTable.id,
      set: { visits: sql`${counterTable.visits} + 1` },
    })
    .returning({ visits: counterTable.visits });
  return row.visits;
}

export async function getVisits() {
  const [row] = await db
    .select({ visits: counterTable.visits })
    .from(counterTable)
    .where(eq(counterTable.id, 1));
  return row?.visits ?? 0;
}
