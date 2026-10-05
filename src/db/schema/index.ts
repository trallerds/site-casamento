import { pgTable, serial, text, integer, timestamp, index, primaryKey } from "drizzle-orm/pg-core";

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageKey: text("image_key").notNull().default("default"),
  amountCents: integer("amount_cents").notNull(),
  totalQuantity: integer("total_quantity").notNull().default(1),
  soldQuantity: integer("sold_quantity").notNull().default(0),
  category: text("category").notNull().default("Momentos da festa"),
  displayOrder: integer("display_order").notNull().default(0),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  giftId: integer("gift_id").notNull().references(() => gifts.id),
  provider: text("provider").notNull(),
  providerChargeId: text("provider_charge_id").unique(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  pixCode: text("pix_code"),
  error: text("error"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  confirmedByAdmin: integer("confirmed_by_admin").notNull().default(0),
  oversold: integer("oversold").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id),
  providerEventId: text("provider_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const photoUploads = pgTable("photo_uploads", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageProvider: text("storage_provider").notNull().default("local"),
  storageKey: text("storage_key"),
  stagingKey: text("staging_key"),
  externalId: text("external_id"),
  status: text("status").notNull().default("received"),
  error: text("error"),
  hidden: integer("hidden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimit = pgTable("rate_limit", {
  bucket: text("bucket").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  hits: integer("hits").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.bucket, table.windowStart] }),
  windowIdx: index("rate_limit_window_idx").on(table.windowStart),
}));
