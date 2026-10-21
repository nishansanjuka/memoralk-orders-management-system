'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { INITIAL_ORDERS } from '@/lib/seedData';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { OrdersView } from '@/components/OrdersView';
import { HistoryView } from '@/components/HistoryView';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import { StatusChangeModal } from '@/components/StatusChangeModal';
import { CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'vanguard_orders_storage_v1';

function subscribeToOrderStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('vanguard_orders_event', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('vanguard_orders_event', callback);
  };
}

function getOrderStorageSnapshot(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

function getServerSnapshot(): string {
  return '';
}

export default function OrderManagementApp() {
  const rawStoredOrders = useSyncExternalStore(
    subscribeToOrderStorage,
    getOrderStorageSnapshot,
    getServerSnapshot
  );

  const orders: Order[] = useMemo(() => {
    if (!rawStoredOrders) return INITIAL_ORDERS;
    try {
      const parsed = JSON.parse(rawStoredOrders);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_ORDERS;
  }, [rawStoredOrders]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'history'>('dashboard');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<string | null>(null);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState<string | null>(null);

  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    isOpen: boolean;
    order: Order | null;
    targetStatus: OrderStatus | null;
  }>({
    isOpen: false,
    order: null,
    targetStatus: null,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  // Save changes to LocalStorage and broadcast event
  const saveOrders = (updated: Order[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('vanguard_orders_event'));
      } catch (err) {
        console.warn('Failed to save to local storage', err);
      }
    }
  };

  // Create new order handler
  const handleCreateOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    saveOrders(updated);
    showToast(`Order ${newOrder.id} created successfully as ${newOrder.status.toUpperCase()}`);
    if (newOrder.status === 'pending') {
      setActiveTab('orders');
    }
  };

  // Update Status handler with audit trail
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const now = new Date().toISOString();
    const updated = orders.map((order) => {
      if (order.id !== orderId) return order;

      const previousStatus = order.status;
      const historyEvent = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        orderId,
        timestamp: now,
        action: 'Status Changed',
        previousStatus,
        newStatus,
        author: 'Operations Lead',
        note: note || `Status transitioned from ${previousStatus} to ${newStatus}.`,
      };

      let nextPaymentStatus = order.paymentStatus;
      if (newStatus === 'cancelled' && order.paymentStatus === 'paid') {
        nextPaymentStatus = 'refunded';
      }

      return {
        ...order,
        status: newStatus,
        paymentStatus: nextPaymentStatus,
        updatedAt: now,
        history: [historyEvent, ...order.history],
      };
    });

    saveOrders(updated);
    showToast(`Order ${orderId} marked as ${newStatus.toUpperCase()}`);
  };

  // Direct prompt status change from table
  const handleRequestStatusChange = (order: Order, newStatus: OrderStatus) => {
    setStatusChangeTarget({
      isOpen: true,
      order,
      targetStatus: newStatus,
    });
  };

  // Quick download invoice PDF
  const handleQuickDownloadPDF = (order: Order) => {
    generateInvoicePDF(order, true);
    showToast(`Downloaded invoice PDF for ${order.invoiceNumber}`);
  };

  // Reset to initial seed data
  const handleResetData = () => {
    saveOrders(INITIAL_ORDERS);
    showToast('Reset order book and monthly growth data to initial state.');
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const currentDetailOrder = orders.find((o) => o.id === selectedOrderDetailId) || null;
  const currentInvoiceOrder = orders.find((o) => o.id === selectedInvoiceOrderId) || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateOrder={() => setIsCreateOpen(true)}
        onResetData={handleResetData}
        pendingCount={pendingCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            onSelectOrder={(order) => setSelectedOrderDetailId(order.id)}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onSelectOrder={(order) => setSelectedOrderDetailId(order.id)}
            onOpenInvoice={(order) => setSelectedInvoiceOrderId(order.id)}
            onQuickDownloadPDF={handleQuickDownloadPDF}
            onStatusChangeRequest={handleRequestStatusChange}
            onOpenCreateOrder={() => setIsCreateOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            orders={orders}
            onSelectOrder={(order) => setSelectedOrderDetailId(order.id)}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Vanguard Orders</span>
            <span aria-hidden="true">·</span>
            <span>Enterprise Order Management & Margin Hub</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Automated Client PDF Invoices</span>
            <span aria-hidden="true">·</span>
            <span>Real-time COGS & Margin Tracking</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{orders.length} Orders Active</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      <OrderDetailModal
        order={currentDetailOrder}
        isOpen={!!currentDetailOrder}
        onClose={() => setSelectedOrderDetailId(null)}
        onUpdateStatus={handleUpdateStatus}
        onOpenInvoicePreview={(order) => setSelectedInvoiceOrderId(order.id)}
        onDownloadPDF={handleQuickDownloadPDF}
      />

      <InvoiceModal
        order={currentInvoiceOrder}
        isOpen={!!currentInvoiceOrder}
        onClose={() => setSelectedInvoiceOrderId(null)}
      />

      <StatusChangeModal
        key={`${statusChangeTarget.order?.id || 'none'}-${statusChangeTarget.targetStatus || 'none'}`}
        order={statusChangeTarget.order}
        targetStatus={statusChangeTarget.targetStatus}
        isOpen={statusChangeTarget.isOpen}
        onClose={() =>
          setStatusChangeTarget({ isOpen: false, order: null, targetStatus: null })
        }
        onConfirm={handleUpdateStatus}
      />

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
