"use server";

import { actionClient, AppError } from "@/lib/action-client";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  deleteOrderSchema,
  getOrderByIdSchema,
} from "@/lib/schemas/orders";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { customers, orders, orderItems, auditLogs } from "@/lib/db/schema";
import { Order, OrderStatus, AuditLogEvent, OrderItem } from "@/types/order";
import { INITIAL_ORDERS } from "@/lib/seedData";
import { eq, desc } from "drizzle-orm";

// In-memory fallback cache when DATABASE_URL is not yet provisioned
let memoryOrders: Order[] = [...INITIAL_ORDERS];

/**
 * Mapper helper to format Drizzle relational query to Order interface
 */
function mapDrizzleOrderToOrder(record: any): Order {
  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt),
    dueDate: record.dueDate instanceof Date ? record.dueDate.toISOString() : String(record.dueDate),
    customer: {
      name: record.customer?.name ?? "",
      email: record.customer?.email ?? "",
      phone: record.customer?.phone ?? "",
      company: record.customer?.company ?? undefined,
      address: record.customer?.address ?? "",
      city: record.customer?.city ?? "",
      state: record.customer?.state ?? undefined,
      postalCode: record.customer?.postalCode ?? undefined,
      country: record.customer?.country ?? "",
    },
    status: record.status as OrderStatus,
    paymentStatus: record.paymentStatus,
    paymentMethod: record.paymentMethod,
    taxRate: Number(record.taxRate),
    taxAmount: Number(record.taxAmount),
    shippingCost: Number(record.shippingCost),
    discount: Number(record.discount),
    subtotalSelling: Number(record.subtotalSelling),
    subtotalCost: Number(record.subtotalCost),
    grandTotal: Number(record.grandTotal),
    totalCost: Number(record.totalCost),
    netProfit: Number(record.netProfit),
    marginPercent: Number(record.marginPercent),
    notes: record.notes ?? undefined,
    items: (record.items ?? []).map((item: any): OrderItem => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      costPrice: Number(item.costPrice),
      sellingPrice: Number(item.sellingPrice),
      quantity: Number(item.quantity),
      totalCost: Number(item.totalCost),
      totalSelling: Number(item.totalSelling),
      profit: Number(item.profit),
      marginPercent: Number(item.marginPercent),
    })),
    history: (record.history ?? []).map((h: any): AuditLogEvent => ({
      id: h.id,
      timestamp: h.timestamp instanceof Date ? h.timestamp.toISOString() : String(h.timestamp),
      orderId: h.orderId,
      action: h.action,
      previousStatus: h.previousStatus as OrderStatus | undefined,
      newStatus: h.newStatus as OrderStatus | undefined,
      author: h.author,
      note: h.note ?? undefined,
    })),
  };
}

/**
 * Fetch all orders.
 * Reads from Drizzle ORM if database is available, otherwise from memory.
 */
export const getOrders = actionClient.action(async () => {
  const db = getDb();

  if (db) {
    try {
      let records = await db.query.orders.findMany({
        with: {
          customer: true,
          items: true,
          history: {
            orderBy: [desc(auditLogs.timestamp)],
          },
        },
        orderBy: [desc(orders.createdAt)],
      });

      // Auto-populate initial database records if empty
      if (records.length === 0) {
        for (const ord of INITIAL_ORDERS) {
          await db.transaction(async (tx) => {
            const [c] = await tx
              .insert(customers)
              .values({
                name: ord.customer.name,
                email: ord.customer.email,
                phone: ord.customer.phone,
                company: ord.customer.company,
                address: ord.customer.address,
                city: ord.customer.city,
                state: ord.customer.state,
                postalCode: ord.customer.postalCode,
                country: ord.customer.country,
              })
              .returning();

            const [o] = await tx
              .insert(orders)
              .values({
                id: ord.id,
                invoiceNumber: ord.invoiceNumber,
                customerId: c.id,
                status: ord.status,
                paymentStatus: ord.paymentStatus,
                paymentMethod: ord.paymentMethod,
                subtotalCost: ord.subtotalCost.toString(),
                subtotalSelling: ord.subtotalSelling.toString(),
                grandTotal: ord.grandTotal.toString(),
                totalCost: ord.totalCost.toString(),
                netProfit: ord.netProfit.toString(),
                marginPercent: ord.marginPercent.toString(),
                taxRate: ord.taxRate.toString(),
                taxAmount: ord.taxAmount.toString(),
                shippingCost: ord.shippingCost.toString(),
                discount: ord.discount.toString(),
                dueDate: new Date(ord.dueDate),
                notes: ord.notes,
                createdAt: new Date(ord.createdAt),
              })
              .returning();

            for (const it of ord.items) {
              await tx.insert(orderItems).values({
                id: it.id,
                orderId: o.id,
                sku: it.sku,
                name: it.name,
                costPrice: it.costPrice.toString(),
                sellingPrice: it.sellingPrice.toString(),
                quantity: it.quantity,
                totalCost: it.totalCost.toString(),
                totalSelling: it.totalSelling.toString(),
                profit: it.profit.toString(),
                marginPercent: it.marginPercent.toString(),
              });
            }

            for (const h of ord.history) {
              await tx.insert(auditLogs).values({
                id: h.id,
                orderId: o.id,
                action: h.action,
                previousStatus: h.previousStatus,
                newStatus: h.newStatus,
                author: h.author,
                note: h.note,
                timestamp: new Date(h.timestamp),
              });
            }
          });
        }

        records = await db.query.orders.findMany({
          with: {
            customer: true,
            items: true,
            history: {
              orderBy: [desc(auditLogs.timestamp)],
            },
          },
          orderBy: [desc(orders.createdAt)],
        });
      }

      return {
        orders: records.map(mapDrizzleOrderToOrder),
        source: "database" as const,
      };
    } catch (err) {
      console.error("[getOrders] Drizzle query failed, falling back to memory:", err);
    }
  }

  return {
    orders: memoryOrders,
    source: "memory" as const,
  };
});

/**
 * Get single order by ID
 */
export const getOrderById = actionClient
  .inputSchema(getOrderByIdSchema)
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;
    const db = getDb();

    if (db) {
      try {
        const record = await db.query.orders.findFirst({
          where: eq(orders.id, id),
          with: {
            customer: true,
            items: true,
            history: {
              orderBy: [desc(auditLogs.timestamp)],
            },
          },
        });

        if (record) {
          return { order: mapDrizzleOrderToOrder(record) };
        }
      } catch (err) {
        console.error("[getOrderById] Drizzle query failed:", err);
      }
    }

    const order = memoryOrders.find((o) => o.id === id);
    if (!order) {
      throw new AppError("NOT_FOUND", 404, `Order with ID "${id}" was not found.`);
    }

    return { order };
  });

/**
 * Create a new order with automated line-item calculations, customer linking, and audit logging.
 */
export const createOrder = actionClient
  .inputSchema(createOrderSchema)
  .action(async ({ parsedInput }) => {
    const {
      customer: custInput,
      paymentMethod,
      paymentStatus,
      items: rawItems,
      taxRate = 8.5,
      shippingCost = 0,
      discount = 0,
      dueDate,
      notes,
    } = parsedInput;

    // Line items and financial calculations
    const items: OrderItem[] = rawItems.map((item, idx) => {
      const costPrice = Number(item.costPrice);
      const sellingPrice = Number(item.sellingPrice);
      const quantity = Number(item.quantity);
      const totalCost = Number((costPrice * quantity).toFixed(2));
      const totalSelling = Number((sellingPrice * quantity).toFixed(2));
      const profit = Number((totalSelling - totalCost).toFixed(2));
      const marginPercent = totalSelling > 0 ? Number(((profit / totalSelling) * 100).toFixed(2)) : 0;

      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        sku: item.sku,
        name: item.name,
        costPrice,
        sellingPrice,
        quantity,
        totalCost,
        totalSelling,
        profit,
        marginPercent,
      };
    });

    const subtotalCost = Number(items.reduce((acc, it) => acc + it.totalCost, 0).toFixed(2));
    const subtotalSelling = Number(items.reduce((acc, it) => acc + it.totalSelling, 0).toFixed(2));
    const taxAmount = Number(((subtotalSelling * taxRate) / 100).toFixed(2));
    const grandTotal = Number((subtotalSelling + taxAmount + shippingCost - discount).toFixed(2));
    const totalCost = Number((subtotalCost + shippingCost).toFixed(2));
    const netProfit = Number((grandTotal - totalCost).toFixed(2));
    const marginPercent = grandTotal > 0 ? Number(((netProfit / grandTotal) * 100).toFixed(2)) : 0;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const resolvedDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const orderId = `ord-${Date.now()}`;
    const initialHistory: AuditLogEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      orderId,
      action: "Order Created",
      newStatus: "pending",
      author: "System Administrator",
      note: "Order created via Memoralk Safe Action Client",
    };

    const newOrder: Order = {
      id: orderId,
      invoiceNumber,
      createdAt: nowIso,
      updatedAt: nowIso,
      dueDate: resolvedDueDate,
      customer: custInput,
      status: "pending",
      paymentStatus,
      paymentMethod,
      items,
      taxRate,
      taxAmount,
      shippingCost,
      discount,
      subtotalSelling,
      subtotalCost,
      grandTotal,
      totalCost,
      netProfit,
      marginPercent,
      notes,
      history: [initialHistory],
    };

    const db = getDb();
    if (db) {
      try {
        await db.transaction(async (tx) => {
          // 1. Insert customer
          const [custRecord] = await tx
            .insert(customers)
            .values({
              name: custInput.name,
              email: custInput.email,
              phone: custInput.phone,
              company: custInput.company,
              address: custInput.address,
              city: custInput.city,
              state: custInput.state,
              postalCode: custInput.postalCode,
              country: custInput.country,
            })
            .returning();

          // 2. Insert order
          const [orderRecord] = await tx
            .insert(orders)
            .values({
              id: orderId,
              invoiceNumber,
              customerId: custRecord.id,
              status: "pending",
              paymentStatus,
              paymentMethod,
              subtotalCost: subtotalCost.toString(),
              subtotalSelling: subtotalSelling.toString(),
              grandTotal: grandTotal.toString(),
              totalCost: totalCost.toString(),
              netProfit: netProfit.toString(),
              marginPercent: marginPercent.toString(),
              taxRate: taxRate.toString(),
              taxAmount: taxAmount.toString(),
              shippingCost: shippingCost.toString(),
              discount: discount.toString(),
              dueDate: new Date(resolvedDueDate),
              notes,
            })
            .returning();

          // 3. Insert items
          for (const it of items) {
            await tx.insert(orderItems).values({
              id: it.id,
              orderId: orderRecord.id,
              sku: it.sku,
              name: it.name,
              costPrice: it.costPrice.toString(),
              sellingPrice: it.sellingPrice.toString(),
              quantity: it.quantity,
              totalCost: it.totalCost.toString(),
              totalSelling: it.totalSelling.toString(),
              profit: it.profit.toString(),
              marginPercent: it.marginPercent.toString(),
            });
          }

          // 4. Insert initial audit log
          await tx.insert(auditLogs).values({
            id: initialHistory.id,
            orderId: orderRecord.id,
            action: "Order Created",
            newStatus: "pending",
            author: "System Administrator",
            note: "Order created via Memoralk Safe Action Client",
          });

          newOrder.id = orderRecord.id;
          newOrder.history[0].orderId = orderRecord.id;
        });
      } catch (err) {
        console.error("[createOrder] Drizzle insert transaction error:", err);
      }
    }

    // Always update in-memory cache as well
    memoryOrders = [newOrder, ...memoryOrders];

    return {
      order: newOrder,
      message: `Order ${invoiceNumber} created successfully.`,
    };
  });

/**
 * Update an order's status with audit log recording.
 */
export const updateOrderStatus = actionClient
  .inputSchema(updateOrderStatusSchema)
  .action(async ({ parsedInput }) => {
    const { orderId, status: newStatus, note, author } = parsedInput;

    const existingIndex = memoryOrders.findIndex((o) => o.id === orderId);
    const existing = existingIndex !== -1 ? memoryOrders[existingIndex] : null;

    const prevStatus = existing?.status;
    const nowIso = new Date().toISOString();

    const auditEntry: AuditLogEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      orderId,
      action: `Status Changed to ${newStatus.toUpperCase()}`,
      previousStatus: prevStatus,
      newStatus,
      author: author || "Staff Member",
      note: note || undefined,
    };

    if (existing) {
      existing.status = newStatus;
      existing.updatedAt = nowIso;
      existing.history = [auditEntry, ...existing.history];
    }

    const db = getDb();
    if (db) {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(orders)
            .set({
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          await tx.insert(auditLogs).values({
            orderId,
            action: `Status Changed to ${newStatus.toUpperCase()}`,
            previousStatus: prevStatus,
            newStatus,
            author: author || "Staff Member",
            note,
          });
        });
      } catch (err) {
        console.error("[updateOrderStatus] Drizzle update error:", err);
      }
    }

    return {
      orderId,
      previousStatus: prevStatus,
      newStatus,
      auditLog: auditEntry,
    };
  });

/**
 * Delete / Remove order.
 */
export const deleteOrder = actionClient
  .inputSchema(deleteOrderSchema)
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;

    memoryOrders = memoryOrders.filter((o) => o.id !== id);

    const db = getDb();
    if (db) {
      try {
        await db.delete(orders).where(eq(orders.id, id));
      } catch (err) {
        console.error("[deleteOrder] Drizzle delete error:", err);
      }
    }

    return {
      id,
      deleted: true,
      message: `Order ${id} removed.`,
    };
  });

/**
 * Seed initial database records from mock data
 */
export const seedDatabaseAction = actionClient.action(async () => {
  const db = getDb();
  if (!db) {
    return {
      success: false,
      message: "DATABASE_URL is not configured. Kept initial mock data in memory.",
    };
  }

  try {
    const count = await db.query.orders.findMany({ limit: 1 });
    if (count.length > 0) {
      return {
        success: true,
        message: "Database already contains orders. Skipping seed.",
      };
    }

    for (const ord of INITIAL_ORDERS) {
      await db.transaction(async (tx) => {
        const [c] = await tx
          .insert(customers)
          .values({
            name: ord.customer.name,
            email: ord.customer.email,
            phone: ord.customer.phone,
            company: ord.customer.company,
            address: ord.customer.address,
            city: ord.customer.city,
            state: ord.customer.state,
            postalCode: ord.customer.postalCode,
            country: ord.customer.country,
          })
          .returning();

        const [o] = await tx
          .insert(orders)
          .values({
            id: ord.id,
            invoiceNumber: ord.invoiceNumber,
            customerId: c.id,
            status: ord.status,
            paymentStatus: ord.paymentStatus,
            paymentMethod: ord.paymentMethod,
            subtotalCost: ord.subtotalCost.toString(),
            subtotalSelling: ord.subtotalSelling.toString(),
            grandTotal: ord.grandTotal.toString(),
            totalCost: ord.totalCost.toString(),
            netProfit: ord.netProfit.toString(),
            marginPercent: ord.marginPercent.toString(),
            taxRate: ord.taxRate.toString(),
            taxAmount: ord.taxAmount.toString(),
            shippingCost: ord.shippingCost.toString(),
            discount: ord.discount.toString(),
            dueDate: new Date(ord.dueDate),
            notes: ord.notes,
            createdAt: new Date(ord.createdAt),
          })
          .returning();

        for (const it of ord.items) {
          await tx.insert(orderItems).values({
            id: it.id,
            orderId: o.id,
            sku: it.sku,
            name: it.name,
            costPrice: it.costPrice.toString(),
            sellingPrice: it.sellingPrice.toString(),
            quantity: it.quantity,
            totalCost: it.totalCost.toString(),
            totalSelling: it.totalSelling.toString(),
            profit: it.profit.toString(),
            marginPercent: it.marginPercent.toString(),
          });
        }

        for (const h of ord.history) {
          await tx.insert(auditLogs).values({
            id: h.id,
            orderId: o.id,
            action: h.action,
            previousStatus: h.previousStatus,
            newStatus: h.newStatus,
            author: h.author,
            note: h.note,
            timestamp: new Date(h.timestamp),
          });
        }
      });
    }

    return {
      success: true,
      message: `Seeded ${INITIAL_ORDERS.length} orders into PostgreSQL via Drizzle ORM.`,
    };
  } catch (err: any) {
    throw new AppError("SEED_ERROR", 500, err?.message || "Failed to seed database.");
  }
});
