import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  comments: many(commentsTable),
}));

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  authorID: integer("author_id").notNull(),
  mobID: integer("mob_id").notNull(),
  comment: text("comment").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [commentsTable.authorID],
    references: [usersTable.id],
  }),
  mob: one(mobsTable, {
    fields: [commentsTable.mobID],
    references: [mobsTable.id],
  }),
}));

export const mobsTable = pgTable("mobs", {
  id: serial("id").primaryKey(),
  mapleID: integer("maple_id"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  interval: integer("interval").notNull(),
  frames: jsonb("frames").$type<{ stand: number; move: number }>().notNull(),
  offset: integer("offset").notNull().default(0),
});

export const counterTable = pgTable("counter", {
  id: integer("id").primaryKey(),
  visits: integer("visits").notNull().default(0),
});
