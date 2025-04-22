import { pgTable, text, serial, integer, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from the original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Column configuration schema
export const columns = pgTable("columns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  type: text("type").notNull(), // date, short-text, long-text, dropdown
  dropdownOptions: text("dropdown_options").array(), // For dropdown type, stores the available options
  allowMultiple: boolean("allow_multiple").default(false), // For dropdown type, allows multiple selections
  isVisible: boolean("is_visible").default(true),
  order: integer("order").notNull(),
});

export const insertColumnSchema = createInsertSchema(columns).omit({
  id: true,
});

// Work Experience schema
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  customFields: jsonb("custom_fields").notNull(), // Stores the values for custom columns
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
});

// Tags schema
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

// Experience-Tags relation
export const experienceTags = pgTable("experience_tags", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertExperienceTagSchema = createInsertSchema(experienceTags).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Column = typeof columns.$inferSelect;
export type InsertColumn = z.infer<typeof insertColumnSchema>;

export type Experience = typeof experiences.$inferSelect & {
  tags?: Tag[];
};
export type InsertExperience = z.infer<typeof insertExperienceSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type ExperienceTag = typeof experienceTags.$inferSelect;
export type InsertExperienceTag = z.infer<typeof insertExperienceTagSchema>;

// Extend the experience schema for the client
export const experienceSchema = z.object({
  id: z.number().optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  customFields: z.record(z.any()),
  tags: z.array(z.number()).optional(),
});

export type ExperienceFormData = z.infer<typeof experienceSchema>;

// Column form schema
export const columnFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  key: z.string().min(1, { message: "Key is required" }),
  type: z.enum(["date", "short-text", "long-text", "dropdown"]),
  dropdownOptions: z.array(z.string()).optional(),
  allowMultiple: z.boolean().optional(),
  isVisible: z.boolean().default(true),
  order: z.number().optional(),
});

export type ColumnFormData = z.infer<typeof columnFormSchema>;
