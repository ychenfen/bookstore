import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Package, ChevronRight, ShoppingCart, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待付款", variant: "outline" },
  paid: { label: "已付款", variant: "default" },
  shipped: { label: "已发货", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
};

export default function Orders() {
  const { isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const ordersQuery = trpc.order.list.useQuery({ page, pageSize: 10 }, { enabled: isAuthenticated });
  const orders = ordersQuery.data?.orders || [];
  const total = ordersQuery.data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => {
      toast.success("订单已取消");
      utils.order.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full mb-4" />)}
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6" />
        我的订单
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">暂无订单</p>
          <Button className="mt-4" onClick={() => navigate("/books")}>
            去选购 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status] || { label: order.status, variant: "outline" as const };
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">订单号：{order.id}</span>
                      <span className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  {/* Items */}
                  <div className="p-4">
                    <div className="space-y-2">
                      {(order.items || []).slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded bg-muted overflow-hidden shrink-0">
                            {item.bookCoverImage && (
                              <img src={item.bookCoverImage} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.bookTitle}</p>
                            <p className="text-xs text-muted-foreground">{item.bookAuthor}</p>
                          </div>
                          <div className="text-right shrink-0 text-sm">
                            <span className="text-muted-foreground">x{item.quantity}</span>
                            <span className="ml-2">¥{parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <p className="text-xs text-muted-foreground">...还有 {order.items.length - 3} 件商品</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="text-sm">
                        合计：<span className="text-lg font-bold text-red-600">¥{parseFloat(order.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => cancelMutation.mutate({ id: order.id })}
                            disabled={cancelMutation.isPending}
                          >
                            取消订单
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                          查看详情 <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                上一页
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                下一页
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
