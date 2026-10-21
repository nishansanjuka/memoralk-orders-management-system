'use client';

import React, { useState } from 'react';
import { Order, OrderStatus, AuditLogEvent } from '@/types/order';
import { OrderStatusBadge, PaymentBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/analytics';
import {
  X,
  FileText,
  Download,
  Printer,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onOpenInvoicePreview: (order: Order) => void;
  onDownloadPDF: (order: Order) => void;
}

const STATUS_PROGRESSION: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenInvoicePreview,
  onDownloadPDF,
}: OrderDetailModalProps) {
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !order) return null;

  const handleApplyStatus = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(order.id, selectedNewStatus, statusNote.trim() || undefined);
    setStatusNote('');
    setIsUpdatingStatus(false);
  };

  const currentStepIndex = STATUS_PROGRESSION.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isRefunded = order.status === 'refunded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono tracking-tight text-slate-900">
                  {order.id}
                </span>
                <span className="text-xs font-mono text-slate-400">({order.invoiceNumber})</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Created on {new Date(order.createdAt).toLocaleString()} · Due{' '}
                {new Date(order.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenInvoicePreview(order)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Invoice</span>
            </button>

            <button
              onClick={() => onDownloadPDF(order)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Status Stepper / Progress Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fulfillment Lifecycle:
                </span>
                <OrderStatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
              </div>

              {!isUpdatingStatus && (
                <button
                  onClick={() => {
                    setSelectedNewStatus(
                      order.status === 'pending'
                        ? 'confirmed'
                        : order.status === 'confirmed'
                        ? 'processing'
                        : order.status === 'processing'
                        ? 'shipped'
                        : order.status === 'shipped'
                        ? 'delivered'
                        : 'processing'
                    );
                    setIsUpdatingStatus(true);
                  }}
                  className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors self-start sm:self-auto"
                >
                  Change Order Status & Log Note
                </button>
              )}
            </div>

            {/* Stepper Graphic */}
            {!isCancelled && !isRefunded ? (
              <div className="grid grid-cols-5 gap-2 pt-2">
                {STATUS_PROGRESSION.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                          isCompleted
                            ? isCurrent
                              ? 'bg-slate-900 text-white ring-4 ring-slate-200'
                              : 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-[11px] mt-2 capitalize font-medium ${
                          isCurrent
                            ? 'text-slate-900 font-bold'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  This order was marked as <strong>{order.status.toUpperCase()}</strong>. Standard
                  fulfillment pipeline has been terminated.
                </span>
              </div>
            )}

            {/* Inline Status Changer Form */}
            {isUpdatingStatus && (
              <form
                onSubmit={handleApplyStatus}
                className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-white p-4 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Transition Order Status & Record Audit Event
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsUpdatingStatus(false)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      New Status
                    </label>
                    <select
                      value={selectedNewStatus}
                      onChange={(e) => setSelectedNewStatus(e.target.value as OrderStatus)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Audit Note / Operational Context (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Courier picked up, tracking #FEDEX-8891, or client called to confirm"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingStatus(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-indigo-600 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply & Save to History</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 2. Customer & Financial Summary Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Customer & Shipping
              </h3>
              <div className="text-sm font-semibold text-slate-900">{order.customer.name}</div>
              {order.customer.company && (
                <div className="text-xs text-slate-600">{order.customer.company}</div>
              )}
              <div className="text-xs text-slate-500">{order.customer.address}</div>
              <div className="text-xs text-slate-500">
                {order.customer.city}
                {order.customer.state ? `, ${order.customer.state}` : ''}{' '}
                {order.customer.postalCode || ''}, {order.customer.country}
              </div>
              <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                {order.customer.email} · {order.customer.phone}
              </div>
            </div>

            {/* Financial Overview */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs font-mono tabular-nums">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans mb-2">
                Order Profitability
              </h3>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Selling Revenue:</span>
                <span>{formatCurrency(order.subtotalSelling)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Cost of Goods (COGS):</span>
                <span>{formatCurrency(order.subtotalCost)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({order.taxRate}%):</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span>{formatCurrency(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
              <div className="pt-1 border-t border-dashed border-slate-200 flex justify-between font-bold text-emerald-600">
                <span>Net Gross Profit:</span>
                <span>
                  +{formatCurrency(order.netProfit)} ({order.marginPercent}% margin)
                </span>
              </div>
            </div>
          </div>

          {/* 3. Line Items Detailed Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Line Items Cost vs Selling Breakdown
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-2">SKU</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Cost Price</th>
                    <th className="py-2.5 px-2 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-right">Total Selling</th>
                    <th className="py-2.5 px-3 text-right">Profit (Margin)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-2 px-2 text-slate-400">{item.sku}</td>
                      <td className="py-2 px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-2 text-right text-slate-500">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.totalSelling)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="font-semibold text-emerald-600 block">
                          +{formatCurrency(item.profit)}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-medium">
                          {item.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Complete Audit History Trail */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Trail & Status History ({order.history.length})</span>
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {order.history.map((hist, idx) => (
                <div key={hist.id || idx} className="p-3 text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900">{hist.action}</span>
                      <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                        {new Date(hist.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {hist.previousStatus && hist.newStatus && (
                      <div className="text-slate-600 mt-1 flex items-center gap-1.5">
                        <span className="capitalize">{hist.previousStatus}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium capitalize text-indigo-700">
                          {hist.newStatus}
                        </span>
                      </div>
                    )}

                    {hist.note && (
                      <div className="text-slate-600 mt-1 italic text-[11px] bg-slate-50 p-2 rounded-md">
                        &ldquo;{hist.note}&rdquo;
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 mt-1">Logged by: {hist.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/70">
          <span className="text-xs text-slate-400">Reference: {order.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
