import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Package, ShoppingCart, ArrowRight, Clock, Mail, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const ordersQuery = trpc.order.list.useQuery({ page: 1, pageSize: 5 }, { enabled: isAuthenticated });
  const orders = ordersQuery.data?.orders || [];
  const totalOrders = ordersQuery.data?.total || 0;

  const cartCountQuery = trpc.cart.count.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cartCountQuery.data || 0;

  if (authLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; count: number }> = {
    pending: { label: "待付款", count: 0 },
    paid: { label: "已付款", count: 0 },
    shipped: { label: "已发货", count: 0 },
    completed: { label: "已完成", count: 0 },
    cancelled: { label: "已取消", count: 0 },
  };

  orders.forEach(o => {
    if (statusMap[o.status]) statusMap[o.status].count++;
  });

  return (
    <div className="container py-6 max-w-4xl">
      {/* User info card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name || "用户"}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  注册于 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "未知"}
                </span>
                {user?.role === "admin" && (
                  <Badge variant="default" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    管理员
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/orders")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">全部订单</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/cart")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cartCount}</p>
              <p className="text-xs text-muted-foreground">购物车商品</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/orders")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusMap.pending.count}</p>
              <p className="text-xs text-muted-foreground">待付款订单</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">最近订单</CardTitle>
          {totalOrders > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">暂无订单</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/books")}>
                去选购
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const statusLabels: Record<string, string> = {
                  pending: "待付款", paid: "已付款", shipped: "已发货", completed: "已完成", cancelled: "已取消",
                };
                const statusColors: Record<string, string> = {
                  pending: "text-amber-600", paid: "text-blue-600", shipped: "text-purple-600", completed: "text-green-600", cancelled: "text-red-600",
                };
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="w-8 h-10 rounded border bg-background overflow-hidden">
                            {item.bookCoverImage ? (
                              <img src={item.bookCoverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                {item.bookTitle?.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium">订单 #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("zh-CN")} · {(order.items || []).length} 件商品
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">¥{parseFloat(order.totalAmount).toFixed(2)}</p>
                      <p className={`text-xs ${statusColors[order.status] || ""}`}>
                        {statusLabels[order.status] || order.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
