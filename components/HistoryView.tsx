'use client';

import React, { useState, useMemo } from 'react';
import { Order, AuditLogEvent } from '@/types/order';
import { OrderStatusBadge } from './StatusBadge';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  FileText,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface HistoryViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function HistoryView({ orders, onSelectOrder }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Flatten all history items from all orders
  const allEvents = useMemo(() => {
    const list: Array<AuditLogEvent & { orderCustomer: string; orderTotal: number }> = [];

    orders.forEach((order) => {
      order.history.forEach((hist) => {
        list.push({
          ...hist,
          orderCustomer: order.customer.name,
          orderTotal: order.grandTotal,
        });
      });
    });

    // Sort newest first
    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [orders]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterAction === 'status_change' && !ev.newStatus) {
        return false;
      }
      if (filterAction === 'created' && ev.action !== 'Order Created') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrder = ev.orderId.toLowerCase().includes(q);
        const matchCustomer = ev.orderCustomer.toLowerCase().includes(q);
        const matchAction = ev.action.toLowerCase().includes(q);
        const matchNote = (ev.note || '').toLowerCase().includes(q);
        const matchAuthor = ev.author.toLowerCase().includes(q);

        if (!matchOrder && !matchCustomer && !matchAction && !matchNote && !matchAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, filterAction, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Global Status & Audit History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete chronological audit trail of all order creations, fulfillment milestones, and status updates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono tabular-nums">{allEvents.length} Recorded Events</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, note text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setFilterAction('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterAction === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterAction('status_change')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterAction === 'status_change'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Status Changes Only
          </button>
          <button
            onClick={() => setFilterAction('created')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterAction === 'created'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order Creations
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-semibold text-slate-700">No audit events match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((event) => {
              const matchingOrder = orders.find((o) => o.id === event.orderId);

              return (
                <div
                  key={event.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
                      <Clock className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {event.orderId}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({event.orderCustomer})
                        </span>
                        <span className="text-slate-300 font-mono">·</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {event.action}
                        </span>
                      </div>

                      {/* Status Transition Badges */}
                      {event.previousStatus && event.newStatus && (
                        <div className="flex items-center gap-2 mt-2">
                          <OrderStatusBadge status={event.previousStatus} size="sm" />
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <OrderStatusBadge status={event.newStatus} size="sm" />
                        </div>
                      )}

                      {/* Event Note */}
                      {event.note && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-md p-2.5 leading-relaxed font-sans">
                          {event.note}
                        </div>
                      )}

                      {/* Event Metadata (Zero-Pill discipline) */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1 text-slate-500">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{event.author}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick action to open order modal */}
                  {matchingOrder && (
                    <button
                      onClick={() => onSelectOrder(matchingOrder)}
                      className="self-end sm:self-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Order</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
