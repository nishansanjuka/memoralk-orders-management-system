import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    previousStatus: text("previous_status"),
    newStatus: text("new_status"),
    author: text("author").notNull().default("System"),
    note: text("note"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_order_id_idx").on(table.orderId),
    index("audit_logs_timestamp_idx").on(table.timestamp),
  ]
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  order: one(orders, {
    fields: [auditLogs.orderId],
    references: [orders.id],
  }),
}));

export type AuditLogRecord = typeof auditLogs.$inferSelect;
export type NewAuditLogRecord = typeof auditLogs.$inferInsert;
