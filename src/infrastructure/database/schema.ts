import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Schema do banco de dados local (SQLite)
 * Para cache offline e sincronização
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  language: text("language").default("en"),
  notificationsEnabled: integer("notifications_enabled", {
    mode: "boolean",
  }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const reintroductionTests = sqliteTable("reintroduction_tests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  fodmapGroup: text("fodmap_group").notNull(),
  phase: text("phase").notNull(),
  dayNumber: integer("day_number").notNull(),
  foodItem: text("food_item").notNull(),
  portionSize: text("portion_size").notNull(),
  notes: text("notes"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  synced: integer("synced", { mode: "boolean" }).default(false),
});

export const symptoms = sqliteTable("symptoms", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull(),
  type: text("type").notNull(),
  severity: integer("severity").notNull(),
  notes: text("notes"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
