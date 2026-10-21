'use client';

import React from 'react';
import { OrderStatus, PaymentStatus } from '@/types/order';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  RefreshCcw,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs: Record<
    OrderStatus,
    { label: string; textClass: string; bgClass: string; icon: React.ReactNode }
  > = {
    pending: {
      label: 'Pending Approval',
      textClass: 'text-amber-800 dark:text-amber-200',
      bgClass: 'bg-amber-50 border border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    confirmed: {
      label: 'Confirmed',
      textClass: 'text-blue-800 dark:text-blue-200',
      bgClass: 'bg-blue-50 border border-blue-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
    },
    processing: {
      label: 'Processing',
      textClass: 'text-indigo-800 dark:text-indigo-200',
      bgClass: 'bg-indigo-50 border border-indigo-200',
      icon: <Package className="w-3.5 h-3.5 text-indigo-600" />,
    },
    shipped: {
      label: 'In Transit / Shipped',
      textClass: 'text-cyan-800 dark:text-cyan-200',
      bgClass: 'bg-cyan-50 border border-cyan-200',
      icon: <Truck className="w-3.5 h-3.5 text-cyan-600" />,
    },
    delivered: {
      label: 'Delivered',
      textClass: 'text-emerald-800 dark:text-emerald-200',
      bgClass: 'bg-emerald-50 border border-emerald-200',
      icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />,
    },
    cancelled: {
      label: 'Cancelled',
      textClass: 'text-rose-800 dark:text-rose-200',
      bgClass: 'bg-rose-50 border border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    refunded: {
      label: 'Refunded',
      textClass: 'text-slate-700 dark:text-slate-300',
      bgClass: 'bg-slate-100 border border-slate-300',
      icon: <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md ${config.bgClass} ${config.textClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const configs: Record<PaymentStatus, { label: string; textClass: string; bgClass: string }> = {
    paid: {
      label: 'Paid',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50 border border-emerald-200',
    },
    unpaid: {
      label: 'Unpaid',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-50 border border-amber-200',
    },
    partial: {
      label: 'Partial',
      textClass: 'text-blue-700',
      bgClass: 'bg-blue-50 border border-blue-200',
    },
    refunded: {
      label: 'Refunded',
      textClass: 'text-slate-600',
      bgClass: 'bg-slate-100 border border-slate-200',
    },
  };

  const conf = configs[status] || configs.unpaid;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${conf.bgClass} ${conf.textClass}`}
    >
      <CreditCard className="w-3 h-3" />
      <span>{conf.label}</span>
    </span>
  );
}
