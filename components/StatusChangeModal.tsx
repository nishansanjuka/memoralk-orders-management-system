'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { OrderStatusBadge } from './StatusBadge';
import { X, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/orders';
import { handleActionResponse } from '@/lib/action-client';

interface StatusChangeModalProps {
  order: Order | null;
  targetStatus: OrderStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, newStatus: OrderStatus, note?: string) => void;
}

export function StatusChangeModal({
  order,
  targetStatus,
  isOpen,
  onClose,
  onConfirm,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(targetStatus || 'confirmed');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateOrderStatus({
        orderId: order.id,
        status: selectedStatus,
        note: note.trim() || undefined,
        author: 'Operations Lead',
      });

      const response = handleActionResponse(res);
      if (response.success) {
        onConfirm(order.id, selectedStatus, note.trim() || undefined);
        setNote('');
        onClose();
      } else {
        setError(response.error.message || 'Failed to update order status.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server communication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Update Order Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Order {order.id} · {order.customer.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs New Status visualization */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Current State
              </span>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                New Target State
              </span>
              <OrderStatusBadge status={selectedStatus} size="sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Fulfillment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Note / Reason (Logged to Audit History)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Warehouse has prepared package; DHL tracking #DHL881923; Client approved quotation via email..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Confirm & Record Audit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
