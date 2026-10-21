'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order';
import { formatCurrency } from '@/lib/analytics';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Building2,
  FileCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);
  const [showInternalCosts, setShowInternalCosts] = useState(false);

  if (!isOpen || !order) return null;

  const handleDownloadPDF = () => {
    generateInvoicePDF(order, true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `https://memoralk.com/invoices/${order.invoiceNumber}?ref=${order.id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Action Toolbar Header (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">
              Invoice #{order.invoiceNumber}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <button
              onClick={() => setShowInternalCosts(!showInternalCosts)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white"
              title="Toggle between client presentation view and internal managerial margin view"
            >
              {showInternalCosts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showInternalCosts ? 'Hide Internal Costs' : 'Show Internal Costs'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link' : 'Share Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
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

        {/* Printable Invoice Container */}
        <div className="invoice-printable-container flex-1 overflow-y-auto p-8 sm:p-12 bg-white text-slate-900 font-sans">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/logo.jpg"
                  alt="Memoralk Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <span className="text-2xl font-black tracking-tight text-slate-900 block leading-tight">
                    MEMORALK
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Framing memories, not just photos
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 leading-relaxed mt-2">
                Enterprise Orders & Custom Framing Systems<br />
                Colombo, Sri Lanka<br />
                support@memoralk.com · +94 11 234 5678
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-black tracking-tight text-indigo-600">
                INVOICE
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="font-mono font-bold text-slate-900">
                  #{order.invoiceNumber}
                </div>
                <div className="text-slate-500 font-mono">
                  Order Ref: {order.id}
                </div>
                <div className="text-slate-500">
                  Issue Date: {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div className="text-slate-500 font-semibold text-slate-800">
                  Due Date: {new Date(order.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Billed To & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Billed To
              </div>
              <div className="text-base font-bold text-slate-900">
                {order.customer.name}
              </div>
              {order.customer.company && (
                <div className="text-sm font-medium text-slate-700 mt-0.5">
                  {order.customer.company}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                {order.customer.address}<br />
                {order.customer.city}
                {order.customer.state ? `, ${order.customer.state}` : ''}{' '}
                {order.customer.postalCode || ''}<br />
                {order.customer.country}<br />
                {order.customer.email} · {order.customer.phone}
              </div>
            </div>

            <div className="sm:text-right flex flex-col sm:items-end justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Payment Status & Terms
                </div>
                <div className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border border-slate-200 mb-2 font-mono">
                  {order.paymentStatus === 'paid' ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      PAID IN FULL
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      PAYMENT PENDING
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Method: <strong className="text-slate-800 uppercase">{order.paymentMethod.replace('_', ' ')}</strong>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Fulfillment: <strong className="text-slate-800 uppercase">{order.status}</strong>
                </div>
              </div>

              {showInternalCosts && (
                <div className="mt-4 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-left text-xs font-mono">
                  <div className="font-bold text-indigo-900">Managerial Margin Summary:</div>
                  <div className="text-indigo-700 mt-0.5">
                    COGS: {formatCurrency(order.totalCost)} · Gross Profit: +{formatCurrency(order.netProfit)} ({order.marginPercent}%)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-8">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-md">Item & Description</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  {showInternalCosts && (
                    <th className="py-3 px-3 text-right bg-slate-800 text-indigo-300">
                      Cost
                    </th>
                  )}
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right rounded-r-md">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono tabular-nums text-slate-800">
                {order.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.sku}</td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    {showInternalCosts && (
                      <td className="py-3 px-3 text-right text-slate-500">
                        {formatCurrency(item.costPrice)}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.totalSelling)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-6 pt-6 border-t border-slate-200">
              <div className="sm:max-w-xs text-xs space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Wire Remittance & Notes
                </div>
                <div className="text-slate-500 leading-relaxed font-mono text-[11px]">
                  Bank: Commercial Bank of Ceylon<br />
                  Branch: Colombo · SWIFT: CCEYLKLX<br />
                  Account #: 1000849201<br />
                  Reference: {order.invoiceNumber}
                </div>
                {order.notes && (
                  <div className="mt-2 text-slate-600 italic font-sans text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    &ldquo;{order.notes}&rdquo;
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotalSelling)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax ({order.taxRate}%):</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling:</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="pt-3 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
                  <span>TOTAL DUE:</span>
                  <span>{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span>Thank you for choosing Memoralk. For billing queries: billing@memoralk.com</span>
            <span className="font-mono text-[11px]">System Timestamp: {new Date().toISOString()}</span>
          </div>
        </div>

        {/* Modal Bottom Close (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/70">
          <span className="text-xs text-slate-400">
            PDF ready for immediate download or printing
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
