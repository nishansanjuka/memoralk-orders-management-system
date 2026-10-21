'use client';

import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { OrderStatusBadge, PaymentBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/analytics';
import {
  Search,
  SlidersHorizontal,
  FileText,
  Eye,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Filter,
  TrendingUp,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenInvoice: (order: Order) => void;
  onQuickDownloadPDF: (order: Order) => void;
  onStatusChangeRequest: (order: Order, newStatus: OrderStatus) => void;
  onOpenCreateOrder: () => void;
}

export function OrdersView({
  orders,
  onSelectOrder,
  onOpenInvoice,
  onQuickDownloadPDF,
  onStatusChangeRequest,
  onOpenCreateOrder,
}: OrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'revenue_desc' | 'profit_desc' | 'margin_desc'>('date_desc');

  // Status counts for tab counters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (selectedStatus !== 'all' && order.status !== selectedStatus) {
          return false;
        }

        // Payment status filter
        if (selectedPayment !== 'all' && order.paymentStatus !== selectedPayment) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = order.id.toLowerCase().includes(q);
          const matchInvoice = order.invoiceNumber.toLowerCase().includes(q);
          const matchCustomer = order.customer.name.toLowerCase().includes(q);
          const matchCompany = (order.customer.company || '').toLowerCase().includes(q);
          const matchEmail = order.customer.email.toLowerCase().includes(q);
          const matchItem = order.items.some(
            (it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
          );
          if (!matchId && !matchInvoice && !matchCustomer && !matchCompany && !matchEmail && !matchItem) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'revenue_desc') {
          return b.grandTotal - a.grandTotal;
        }
        if (sortBy === 'profit_desc') {
          return b.netProfit - a.netProfit;
        }
        if (sortBy === 'margin_desc') {
          return b.marginPercent - a.marginPercent;
        }
        return 0;
      });
  }, [orders, selectedStatus, selectedPayment, searchQuery, sortBy]);

  // Aggregate stats of current filtered selection
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.grandTotal : 0), 0);
  const filteredCost = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalCost : 0), 0);
  const filteredProfit = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.netProfit : 0), 0);
  const filteredMargin = filteredRevenue > 0 ? (filteredProfit / filteredRevenue) * 100 : 0;

  const STATUS_TABS: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order Management Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track order fulfillment, update progression states, monitor cost vs selling prices, and issue automated client invoices.
          </p>
        </div>

        <button
          onClick={onOpenCreateOrder}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          + Create Pending Order
        </button>
      </div>

      {/* 2. Interactive Status Tabs (Zero-Pill Filter Controls) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.id;
          const count = statusCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 border-b-2 -mb-px ${
                isActive
                  ? 'border-slate-900 text-slate-900 bg-white font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded-xs ${
                  isActive ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, invoice, client, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Dropdown Filters & Sorters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Payment Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Payment:</span>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Payment States</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="revenue_desc">Selling Revenue (High → Low)</option>
              <option value="profit_desc">Gross Profit (High → Low)</option>
              <option value="margin_desc">Profit Margin % (High → Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Active Selection Financial Quick Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-4">
          <span>
            Showing <strong className="text-slate-900">{filteredOrders.length}</strong> of{' '}
            {orders.length} orders
          </span>
          {selectedStatus !== 'all' && (
            <span className="text-slate-500">· Filtered by &ldquo;{selectedStatus}&rdquo;</span>
          )}
        </div>

        <div className="flex items-center gap-4 tabular-nums">
          <div>
            Selling Revenue: <strong className="text-slate-900">{formatCurrency(filteredRevenue)}</strong>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <div>
            COGS Cost: <span className="text-slate-600">{formatCurrency(filteredCost)}</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <div>
            Net Profit: <strong className="text-emerald-700">+{formatCurrency(filteredProfit)}</strong>{' '}
            <span className="text-indigo-700 font-medium">({filteredMargin.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* 5. Desktop High-Density Data Grid (hidden on mobile, visible md+) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Order & Invoice</th>
              <th className="py-3 px-4">Client & Destination</th>
              <th className="py-3 px-4">Items / SKU</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
              <th className="py-3 px-4 text-right">Selling Total</th>
              <th className="py-3 px-4 text-right">Gross Profit</th>
              <th className="py-3 px-4 text-center">Fulfillment Status</th>
              <th className="py-3 px-4 text-center">Payment</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <p className="font-semibold text-slate-700">No matching orders found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your filters or search keywords, or create a new pending order.
                    </p>
                    <button
                      onClick={onOpenCreateOrder}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-indigo-600 transition-colors"
                    >
                      + Create Order
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const totalUnits = order.items.reduce((s, it) => s + it.quantity, 0);

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    {/* Order & Invoice */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{order.id}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {order.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Client & Destination */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.customer.name}</div>
                      {order.customer.company && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {order.customer.company}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {order.customer.city}, {order.customer.country}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium truncate max-w-[180px]">
                        {order.items[0]?.name || 'No items'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.items.length > 1
                          ? `+${order.items.length - 1} other items (${totalUnits} total units)`
                          : `${totalUnits} unit(s)`}
                      </div>
                    </td>

                    {/* Cost Price (COGS) */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {formatCurrency(order.totalCost)}
                    </td>

                    {/* Selling Total */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(order.grandTotal)}
                    </td>

                    {/* Profit & Margin */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div
                        className={`font-semibold ${
                          order.status === 'cancelled'
                            ? 'text-slate-400'
                            : 'text-emerald-700'
                        }`}
                      >
                        {order.status === 'cancelled' ? '$0.00' : `+${formatCurrency(order.netProfit)}`}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium">
                        {order.status === 'cancelled' ? '0%' : `${order.marginPercent}% margin`}
                      </div>
                    </td>

                    {/* Status Badge + Inline switcher */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()} // don't open modal when changing status dropdown
                    >
                      <div className="flex flex-col items-center gap-1">
                        <OrderStatusBadge status={order.status} size="sm" />
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onStatusChangeRequest(order, e.target.value as OrderStatus)
                          }
                          className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-1 py-0.5 hover:border-slate-400 focus:outline-none"
                        >
                          <option value="pending">Set: Pending</option>
                          <option value="confirmed">Set: Confirmed</option>
                          <option value="processing">Set: Processing</option>
                          <option value="shipped">Set: Shipped</option>
                          <option value="delivered">Set: Delivered</option>
                          <option value="cancelled">Set: Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4 text-center">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectOrder(order)}
                          title="View order details and history trail"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenInvoice(order)}
                          title="Preview client invoice"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onQuickDownloadPDF(order)}
                          title="Download Invoice PDF directly"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Mobile Responsive Card List (visible only on mobile sm & below) */}
      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            <p className="font-medium text-slate-700">No matching orders</p>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new order.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs active:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{order.id}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {order.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {order.customer.name}
                  </div>
                  {order.customer.company && (
                    <div className="text-[11px] text-slate-500">{order.customer.company}</div>
                  )}
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-sm font-bold text-slate-900">
                    {formatCurrency(order.grandTotal)}
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                    +{formatCurrency(order.netProfit)} ({order.marginPercent}%)
                  </div>
                </div>
              </div>

              {/* Status and Items bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} size="sm" />
                  <PaymentBadge status={order.paymentStatus} />
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenInvoice(order)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>

                  <button
                    onClick={() => onQuickDownloadPDF(order)}
                    className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
