'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order';
import {
  calculateMonthlyGrowth,
  calculateProductPerformance,
  formatCurrency,
} from '@/lib/analytics';
import {
  TrendingUp,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Percent,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onNavigateToOrders: () => void;
}

export function DashboardView({
  orders,
  onSelectOrder,
  onNavigateToOrders,
}: DashboardViewProps) {
  const monthlyData = calculateMonthlyGrowth(orders);
  const productPerformance = calculateProductPerformance(orders);

  const [chartMetric, setChartMetric] = useState<'revenue_profit' | 'profit_margin' | 'volume'>(
    'revenue_profit'
  );
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Overall totals
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCost = nonCancelledOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalProfit = nonCancelledOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const avgOrderValue = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;

  // Month-over-Month calculation for the latest 2 months
  const latestMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const momRevenueGrowth =
    previousMonth && previousMonth.revenue > 0
      ? ((latestMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      : 0;
  const momProfitGrowth =
    previousMonth && previousMonth.profit > 0
      ? ((latestMonth.profit - previousMonth.profit) / previousMonth.profit) * 100
      : 0;

  // Max value for SVG chart scaling
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1000);
  const maxProfit = Math.max(...monthlyData.map((d) => d.profit), 1000);
  const maxOrderCount = Math.max(...monthlyData.map((d) => d.orderCount), 5);

  return (
    <div className="space-y-8">
      {/* 1. Header / Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial & Monthly Growth Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time cost price vs. selling price analysis, profit margins, and monthly sales trajectories.
          </p>
        </div>

        {/* Quick Date Scope Tag */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Tracking 6-Month Trajectory</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{orders.length} total orders</span>
        </div>
      </div>

      {/* 2. Key Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center font-mono font-medium ${
                momRevenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {momRevenueGrowth >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(momRevenueGrowth).toFixed(1)}%
            </span>
            <span className="text-slate-400">vs prior month</span>
          </div>
        </div>

        {/* Total Cost of Goods Sold (COGS) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cost of Goods (COGS)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalCost)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Procurement & Wholesale</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}% of Rev
            </span>
          </div>
        </div>

        {/* Net Gross Profit */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 font-mono tabular-nums">
              {formatCurrency(totalProfit)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center font-mono font-medium ${
                momProfitGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {momProfitGrowth >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(momProfitGrowth).toFixed(1)}%
            </span>
            <span className="text-slate-400">profit growth MoM</span>
          </div>
        </div>

        {/* Average Profit Margin & AOV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Margin & AOV</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-600 font-mono tabular-nums">
              {overallMargin.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">margin</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Avg Order Value:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              {formatCurrency(avgOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Monthly Growth Chart Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Monthly Financial Trajectory</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize cost vs selling revenue trends and gross profits over time.
            </p>
          </div>

          {/* Interactive Metric Filter Control (Segmented button) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setChartMetric('revenue_profit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartMetric === 'revenue_profit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue vs Cost vs Profit
            </button>
            <button
              onClick={() => setChartMetric('profit_margin')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartMetric === 'profit_margin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gross Profit & Margin %
            </button>
            <button
              onClick={() => setChartMetric('volume')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartMetric === 'volume'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order Volume
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-4 pb-2 text-xs text-slate-600">
          {chartMetric === 'revenue_profit' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-slate-900" />
                <span>Gross Selling Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-indigo-500" />
                <span>Cost of Goods Sold (COGS)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span>Gross Profit</span>
              </div>
            </>
          )}
          {chartMetric === 'profit_margin' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span>Gross Profit ($)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-amber-500 rounded-full" />
                <span>Profit Margin %</span>
              </div>
            </>
          )}
          {chartMetric === 'volume' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                <span>Total Orders Placed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span>Completed / Shipped</span>
              </div>
            </>
          )}
        </div>

        {/* Custom SVG Interactive Chart */}
        <div className="mt-4 relative overflow-x-auto">
          <div className="min-w-[640px] h-72 w-full flex items-end justify-between gap-4 pt-10 pb-6 px-4 border-b border-slate-200">
            {monthlyData.map((month, idx) => {
              const isHovered = hoveredMonthIndex === idx;

              // Bar heights calculations
              const revHeight = Math.max((month.revenue / maxRevenue) * 190, 8);
              const costHeight = Math.max((month.cost / maxRevenue) * 190, 6);
              const profitHeight = Math.max((month.profit / maxRevenue) * 190, 6);
              const orderHeight = Math.max((month.orderCount / maxOrderCount) * 190, 10);
              const completedHeight = Math.max((month.completedOrders / maxOrderCount) * 190, 6);

              return (
                <div
                  key={month.monthKey}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredMonthIndex(idx)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                >
                  {/* Hover Tooltip Card */}
                  {isHovered && (
                    <div className="absolute bottom-[210px] z-20 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs min-w-[210px] pointer-events-none transition-all">
                      <div className="font-semibold text-slate-100 border-b border-slate-800 pb-1.5 flex justify-between">
                        <span>{month.monthLabel}</span>
                        <span className="text-slate-400 font-mono">{month.orderCount} orders</span>
                      </div>
                      <div className="mt-2 space-y-1 font-mono tabular-nums">
                        <div className="flex justify-between text-slate-300">
                          <span>Revenue:</span>
                          <span className="font-semibold text-white">{formatCurrency(month.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Cost (COGS):</span>
                          <span>{formatCurrency(month.cost)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                          <span>Gross Profit:</span>
                          <span>{formatCurrency(month.profit)}</span>
                        </div>
                        <div className="flex justify-between text-amber-300">
                          <span>Profit Margin:</span>
                          <span>{month.marginPercent}%</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Avg Order:</span>
                          <span>{formatCurrency(month.avgOrderValue)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bars View according to metric */}
                  {chartMetric === 'revenue_profit' && (
                    <div className="w-full flex items-end justify-center gap-1.5">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}px` }}
                        className={`w-4 sm:w-6 bg-slate-900 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125 scale-y-105 origin-bottom' : ''
                        }`}
                      />
                      {/* Cost Bar */}
                      <div
                        style={{ height: `${costHeight}px` }}
                        className={`w-4 sm:w-6 bg-indigo-500 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125 scale-y-105 origin-bottom' : ''
                        }`}
                      />
                      {/* Profit Bar */}
                      <div
                        style={{ height: `${profitHeight}px` }}
                        className={`w-4 sm:w-6 bg-emerald-500 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125 scale-y-105 origin-bottom' : ''
                        }`}
                      />
                    </div>
                  )}

                  {chartMetric === 'profit_margin' && (
                    <div className="w-full flex flex-col items-center justify-end">
                      <div className="text-[11px] font-mono font-medium text-amber-600 mb-1">
                        {month.marginPercent}%
                      </div>
                      <div
                        style={{ height: `${Math.max((month.profit / maxProfit) * 190, 10)}px` }}
                        className={`w-8 sm:w-12 bg-emerald-500 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125' : ''
                        }`}
                      />
                    </div>
                  )}

                  {chartMetric === 'volume' && (
                    <div className="w-full flex items-end justify-center gap-2">
                      <div
                        style={{ height: `${orderHeight}px` }}
                        className={`w-6 sm:w-8 bg-indigo-600 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125' : ''
                        }`}
                      />
                      <div
                        style={{ height: `${completedHeight}px` }}
                        className={`w-6 sm:w-8 bg-emerald-500 rounded-t-xs transition-all ${
                          isHovered ? 'brightness-125' : ''
                        }`}
                      />
                    </div>
                  )}

                  {/* Month Label */}
                  <div className="mt-3 text-xs font-medium text-slate-600 text-center whitespace-nowrap">
                    {month.monthLabel}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {formatCurrency(month.profit)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Monthly Growth Breakdown Table */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Monthly Audit & Performance Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Full breakdown of margin dynamics and volume
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Selling Revenue</th>
                  <th className="py-2.5 px-3 text-right">COGS Cost</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                  <th className="py-2.5 px-3 text-right">Avg Order</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                {monthlyData.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {row.monthLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.orderCount}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {formatCurrency(row.cost)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-indigo-600">
                      {row.marginPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(row.avgOrderValue)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-[11px] text-slate-500">
                      <span>{row.completedOrders} shipped</span>
                      {row.pendingOrders > 0 && (
                        <span className="text-amber-700 ml-1">· {row.pendingOrders} pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Two-Column Split: Top Products & Pending Orders Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Product Margins */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top Products by Revenue & Margin
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cost price vs selling price performance across catalog line items.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {productPerformance.length} items active
            </span>
          </div>

          <div className="space-y-4">
            {productPerformance.slice(0, 5).map((prod) => (
              <div
                key={prod.sku}
                className="p-3 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{prod.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">{prod.sku}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{prod.unitsSold} units sold</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(prod.totalRevenue)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Cost: {formatCurrency(prod.totalCost)}
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs font-mono font-semibold text-emerald-600 tabular-nums block">
                        +{formatCurrency(prod.grossProfit)}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 tabular-nums">
                        {prod.marginPercent}% margin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Margin Bar */}
                <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(prod.marginPercent, 100)}%` }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Orders Action Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pending Actions</h3>
              <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {pendingOrders.length} Pending
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Orders created in pending status awaiting operational review, quotation confirmation, or payment verification.
            </p>

            <div className="mt-4 space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No orders currently in pending status.
                </div>
              ) : (
                pendingOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {order.id}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-1">
                      {order.customer.name} {order.customer.company ? `(${order.customer.company})` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 font-mono font-medium">
                        Profit: {formatCurrency(order.netProfit)} ({order.marginPercent}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToOrders}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>View All Orders in Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
