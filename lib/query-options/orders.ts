import { queryOptions } from "@tanstack/react-query";
import { getOrders, getOrderById } from "@/lib/actions/orders";
import { handleActionResponse } from "@/lib/action-client";

export const ordersQueryOptions = queryOptions({
  queryKey: ["orders-list"],
  queryFn: async () => {
    const res = await getOrders();
    const response = handleActionResponse(res);
    if (!response.success) {
      throw new Error(response.error.message || "Failed to fetch orders");
    }
    return response.data;
  },
  staleTime: 60 * 1000, // 1 minute fresh
});

export const orderDetailQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const res = await getOrderById({ id: orderId });
      const response = handleActionResponse(res);
      if (!response.success) {
        throw new Error(response.error.message || `Failed to fetch order ${orderId}`);
      }
      return response.data;
    },
    enabled: Boolean(orderId),
  });
