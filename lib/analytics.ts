import { Order, MonthGrowthPoint } from '@/types/order';

export function calculateMonthlyGrowth(orders: Order[]): MonthGrowthPoint[] {
  // Aggregate orders by "YYYY-MM"
  const monthlyMap = new Map<string, {
    revenue: number;
    cost: number;
    profit: number;
    orderCount: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  }>();

  orders.forEach((order) => {
    // Only non-cancelled orders count towards financial growth, but count cancelled orders in counts
    const date = new Date(order.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        revenue: 0,
        cost: 0,
        profit: 0,
        orderCount: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
      });
    }

    const data = monthlyMap.get(key)!;
    data.orderCount += 1;

    if (order.status === 'cancelled') {
      data.cancelledOrders += 1;
    } else {
      data.revenue += order.grandTotal;
      data.cost += order.totalCost;
      data.profit += order.netProfit;

      if (order.status === 'delivered' || order.status === 'shipped') {
        data.completedOrders += 1;
      } else if (order.status === 'pending') {
        data.pendingOrders += 1;
      }
    }
  });

  // Sort chronologically
  const sortedKeys = Array.from(monthlyMap.keys()).sort();

  return sortedKeys.map((key) => {
    const data = monthlyMap.get(key)!;
    const [year, month] = key.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const marginPercent =
      data.revenue > 0 ? Number(((data.profit / data.revenue) * 100).toFixed(1)) : 0;
    const nonCancelled = data.orderCount - data.cancelledOrders;
    const avgOrderValue =
      nonCancelled > 0 ? Number((data.revenue / nonCancelled).toFixed(2)) : 0;

    return {
      monthKey: key,
      monthLabel,
      revenue: Number(data.revenue.toFixed(2)),
      cost: Number(data.cost.toFixed(2)),
      profit: Number(data.profit.toFixed(2)),
      marginPercent,
      orderCount: data.orderCount,
      completedOrders: data.completedOrders,
      pendingOrders: data.pendingOrders,
      cancelledOrders: data.cancelledOrders,
      avgOrderValue,
    };
  });
}

export interface ProductPerformance {
  sku: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export function calculateProductPerformance(orders: Order[]): ProductPerformance[] {
  const map = new Map<
    string,
    {
      name: string;
      unitsSold: number;
      totalRevenue: number;
      totalCost: number;
    }
  >();

  orders.forEach((order) => {
    if (order.status === 'cancelled') return;

    order.items.forEach((item) => {
      const existing = map.get(item.sku);
      if (!existing) {
        map.set(item.sku, {
          name: item.name,
          unitsSold: item.quantity,
          totalRevenue: item.totalSelling,
          totalCost: item.totalCost,
        });
      } else {
        existing.unitsSold += item.quantity;
        existing.totalRevenue += item.totalSelling;
        existing.totalCost += item.totalCost;
      }
    });
  });

  const list: ProductPerformance[] = [];
  map.forEach((val, sku) => {
    const grossProfit = Number((val.totalRevenue - val.totalCost).toFixed(2));
    const marginPercent =
      val.totalRevenue > 0
        ? Number(((grossProfit / val.totalRevenue) * 100).toFixed(1))
        : 0;
    list.push({
      sku,
      name: val.name,
      unitsSold: val.unitsSold,
      totalRevenue: Number(val.totalRevenue.toFixed(2)),
      totalCost: Number(val.totalCost.toFixed(2)),
      grossProfit,
      marginPercent,
    });
  });

  return list.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return isNegative ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
}
