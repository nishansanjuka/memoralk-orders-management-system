export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';

export type PaymentMethod =
  | 'bank_transfer'
  | 'credit_card'
  | 'stripe'
  | 'cash_on_delivery'
  | 'wire';

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  totalCost: number;
  totalSelling: number;
  profit: number;
  marginPercent: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  orderId: string;
  action: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  author: string;
  note?: string;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  customer: Customer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  subtotalSelling: number;
  subtotalCost: number;
  grandTotal: number;
  totalCost: number;
  netProfit: number;
  marginPercent: number;
  notes?: string;
  history: AuditLogEvent[];
}

export interface ProductPreset {
  sku: string;
  name: string;
  category: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
}

export interface MonthGrowthPoint {
  monthKey: string; // e.g. "2026-05"
  monthLabel: string; // e.g. "May 2026"
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  orderCount: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
}
