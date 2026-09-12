import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const songs = pgTable("songs", {
  id: serial().primaryKey(),
  title: text().notNull(),
  author: text().notNull(),
  langs: jsonb().notNull().default(["中文"]),
  notes: jsonb().notNull().default([]),
  tags: jsonb().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  color: text().notNull(),
});
