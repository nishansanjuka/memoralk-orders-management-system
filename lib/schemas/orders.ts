import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatusSchema = z.enum([
  "unpaid",
  "paid",
  "partial",
  "refunded",
]);

export const paymentMethodSchema = z.enum([
  "bank_transfer",
  "credit_card",
  "stripe",
  "cash_on_delivery",
  "wire",
]);

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(128),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(3, "Phone number is required"),
  company: z.string().max(128).optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

export const orderItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Item name is required"),
  costPrice: z.number().min(0, "Cost price must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema.default("unpaid"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  taxRate: z.number().min(0).max(100).default(8.5),
  shippingCost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: orderStatusSchema,
  note: z.string().max(250).optional(),
  author: z.string().default("Operations Team"),
});

export const deleteOrderSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export const getOrderByIdSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export const filterOrdersSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  search: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type DeleteOrderInput = z.infer<typeof deleteOrderSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
