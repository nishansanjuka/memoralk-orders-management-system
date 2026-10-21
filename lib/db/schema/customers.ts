import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";

export const customers = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export type CustomerRecord = typeof customers.$inferSelect;
export type NewCustomerRecord = typeof customers.$inferInsert;
