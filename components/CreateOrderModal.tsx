'use client';

import React, { useState } from 'react';
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, ProductPreset } from '@/types/order';
import { PRODUCT_CATALOG, computeItemFinancials, computeOrderFinancials } from '@/lib/seedData';
import { formatCurrency } from '@/lib/analytics';
import { X, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { createOrder } from '@/lib/actions/orders';
import { handleActionResponse } from '@/lib/action-client';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (newOrder: Order) => void;
}

interface DraftItem {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

let itemSequence = 100;
function createDraftItem(preset?: ProductPreset): DraftItem {
  itemSequence += 1;
  if (preset) {
    return {
      id: `item-seq-${itemSequence}`,
      sku: preset.sku,
      name: preset.name,
      costPrice: preset.defaultCostPrice,
      sellingPrice: preset.defaultSellingPrice,
      quantity: 1,
    };
  }
  return {
    id: `item-seq-${itemSequence}`,
    sku: `SKU-${itemSequence}`,
    name: '',
    costPrice: 50,
    sellingPrice: 100,
    quantity: 1,
  };
}

let orderSequence = 9100;
function createNewOrderMetadata() {
  orderSequence += 1;
  const now = new Date();
  const dueDateObj = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    orderId: `ORD-${orderSequence}`,
    invoiceNum: `INV-2026-${orderSequence}`,
    nowIso: now.toISOString(),
    dueIso: dueDateObj.toISOString(),
  };
}

export function CreateOrderModal({
  isOpen,
  onClose,
  onCreateOrder,
}: CreateOrderModalProps) {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerCountry, setCustomerCountry] = useState('United States');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [taxRate, setTaxRate] = useState<number>(8.5);
  const [shippingCost, setShippingCost] = useState<number>(25);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Items State (default with 1 preset item)
  const [items, setItems] = useState<DraftItem[]>([
    {
      id: 'draft-item-init-1',
      sku: 'HW-DSK-01',
      name: 'Ergonomic Motorized Standing Desk (Oak, 60")',
      costPrice: 280,
      sellingPrice: 599,
      quantity: 1,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Add Item
  const handleAddItem = (preset?: ProductPreset) => {
    const newItem = createDraftItem(preset);
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError('An order must have at least one line item.');
      return;
    }
    setError(null);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Compute live financials
  const calculatedItems: OrderItem[] = items.map((it) => {
    const { totalCost, totalSelling, profit, marginPercent } = computeItemFinancials(
      Number(it.costPrice) || 0,
      Number(it.sellingPrice) || 0,
      Number(it.quantity) || 1
    );
    return {
      ...it,
      costPrice: Number(it.costPrice) || 0,
      sellingPrice: Number(it.sellingPrice) || 0,
      quantity: Number(it.quantity) || 1,
      totalCost,
      totalSelling,
      profit,
      marginPercent,
    };
  });

  const totals = computeOrderFinancials(
    calculatedItems,
    Number(taxRate) || 0,
    Number(shippingCost) || 0,
    Number(discount) || 0
  );

  const handleSubmit = async (targetStatus: OrderStatus) => {
    // Validation
    if (!customerName.trim()) {
      setError('Please provide the customer full name.');
      return;
    }
    if (!customerEmail.trim()) {
      setError('Please provide a valid client contact email.');
      return;
    }
    if (items.length === 0 || items.some((it) => !it.name.trim())) {
      setError('Please ensure all items have a valid name and pricing.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Call Server Action
      const res = await createOrder({
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim() || '+1 (555) 000-0000',
          company: customerCompany.trim() || undefined,
          address: customerAddress.trim() || '100 Business Center Way',
          city: customerCity.trim() || 'San Francisco',
          country: customerCountry.trim() || 'United States',
        },
        paymentMethod,
        paymentStatus,
        items: items.map((it) => ({
          sku: it.sku,
          name: it.name,
          costPrice: Number(it.costPrice) || 0,
          sellingPrice: Number(it.sellingPrice) || 0,
          quantity: Number(it.quantity) || 1,
        })),
        taxRate: Number(taxRate) || 0,
        shippingCost: Number(shippingCost) || 0,
        discount: Number(discount) || 0,
        notes: notes.trim() || undefined,
      });

      // Handle plain object response safely
      const response = handleActionResponse(res);
      if (response.success) {
        onCreateOrder(response.data.order);
        onClose();
      } else {
        setError(response.error.message || 'Failed to create order on server.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected communication failure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Order</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify customer billing, item cost vs selling prices, and save to pending queue.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Customer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Customer & Company Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Thompson"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="m.thompson@acme.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="Acme Systems Corp"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 492-0199"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="100 Market St, Suite 500"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="San Francisco"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="United States"
                    value={customerCountry}
                    onChange={(e) => setCustomerCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Line Items Builder with Cost & Selling Price */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Line Items (Cost Price vs Selling Price)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track wholesale procurement cost versus client billing rate for live profit calculation.
                </p>
              </div>

              {/* Quick Catalog Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Quick Add:</span>
                {PRODUCT_CATALOG.slice(0, 3).map((preset) => (
                  <button
                    key={preset.sku}
                    type="button"
                    onClick={() => handleAddItem(preset)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 transition-colors"
                  >
                    + {preset.name.split(' ')[0]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md whitespace-nowrap shrink-0 transition-colors"
                >
                  + Custom Item
                </button>
              </div>
            </div>

            {/* Items Table Container */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 w-28">SKU</th>
                      <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-2 w-24 text-right">Cost Price (Rs)</th>
                      <th className="py-2.5 px-2 w-24 text-right">Selling Price (Rs)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Profit / Margin</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {items.map((item) => {
                      const financials = computeItemFinancials(
                        item.costPrice,
                        item.sellingPrice,
                        item.quantity
                      );

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-sans">
                            <input
                              type="text"
                              value={item.name}
                              placeholder="Product or service description"
                              onChange={(e) =>
                                handleUpdateItem(item.id, { name: e.target.value })
                              }
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.sku}
                              placeholder="SKU"
                              onChange={(e) =>
                                handleUpdateItem(item.id, { sku: e.target.value })
                              }
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  quantity: Math.max(1, parseInt(e.target.value) || 1),
                                })
                              }
                              className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white text-center focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  costPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-right text-slate-600 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  sellingPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-right font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-3 text-right">
                            <div className="font-semibold text-emerald-600">
                              +{formatCurrency(financials.profit)}
                            </div>
                            <div className="text-[10px] text-indigo-600 font-medium">
                              {financials.marginPercent}% margin
                            </div>
                          </td>

                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. Financial Adjustments & Payment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200">
            {/* Left: Financial inputs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Tax, Shipping & Discount
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shipping (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Discount (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order Notes & Internal Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Special packing instructions, rush delivery request, or purchase order reference..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right: Payment configuration & live summary box */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Payment & Order Status Terms
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bank_transfer">Bank Wire / ACH</option>
                    <option value="stripe">Stripe Card</option>
                    <option value="credit_card">Corporate Credit Card</option>
                    <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                    <option value="wire">International Wire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Payment State
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="unpaid">Unpaid (Awaiting Payment)</option>
                    <option value="paid">Paid in Full</option>
                    <option value="partial">Partial Deposit</option>
                  </select>
                </div>
              </div>

              {/* Real-time Order Profitability Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Selling:</span>
                  <span>{formatCurrency(totals.subtotalSelling)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Wholesale Cost (COGS):</span>
                  <span>{formatCurrency(totals.subtotalCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({taxRate}%):</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total (Client):</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
                <div className="pt-1 border-t border-dashed border-slate-200 flex justify-between text-xs font-bold text-emerald-600">
                  <span>Estimated Net Profit:</span>
                  <span>
                    +{formatCurrency(totals.netProfit)} ({totals.marginPercent}% margin)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('pending')}
              className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save as Pending Order</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('confirmed')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create & Confirm Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
