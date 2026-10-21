import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customers } from "./customers";
import { auditLogs } from "./audit-logs";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "partial",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "credit_card",
  "stripe",
  "cash_on_delivery",
  "wire",
]);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => `ORD-${Date.now()}`),
    invoiceNumber: text("invoice_number").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").default("pending").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").default("bank_transfer").notNull(),
    subtotalCost: numeric("subtotal_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotalSelling: numeric("subtotal_selling", { precision: 12, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    netProfit: numeric("net_profit", { precision: 12, scale: 2 }).notNull().default("0"),
    marginPercent: numeric("margin_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("8.5"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull(),
    sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
    totalSelling: numeric("total_selling", { precision: 12, scale: 2 }).notNull(),
    profit: numeric("profit", { precision: 12, scale: 2 }).notNull(),
    marginPercent: numeric("margin_percent", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  history: many(auditLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrderRecord = typeof orders.$inferInsert;
export type OrderItemRecord = typeof orderItems.$inferSelect;
export type NewOrderItemRecord = typeof orderItems.$inferInsert;
