import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Package, MapPin, Phone, User, FileText } from "lucide-react";
import { useLocation, useParams } from "wouter";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待付款", variant: "outline" },
  paid: { label: "已付款", variant: "default" },
  shipped: { label: "已发货", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
};

export default function OrderDetail() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const utils = trpc.useUtils();

  const orderQuery = trpc.order.detail.useQuery({ id: orderId }, { enabled: isAuthenticated });
  const order = orderQuery.data;

  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => {
      toast.success("订单已取消");
      utils.order.detail.invalidate({ id: orderId });
      utils.order.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (orderQuery.isLoading) {
    return (
      <div className="container py-8 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">订单不存在</p>
        <Button className="mt-4" onClick={() => navigate("/orders")}>返回订单列表</Button>
      </div>
    );
  }

  const status = statusMap[order.status] || { label: order.status, variant: "outline" as const };

  return (
    <div className="container py-6 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/orders")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回订单列表
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">订单详情</h1>
        <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
      </div>

      <div className="space-y-4">
        {/* Order info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">订单信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单编号</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">下单时间</span>
              <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单状态</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Shipping info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              收货信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.shippingName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.shippingName}</span>
              </div>
            )}
            {order.shippingPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.shippingPhone}</span>
              </div>
            )}
            {order.shippingAddress && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{order.shippingAddress}</span>
              </div>
            )}
            {order.note && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{order.note}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">商品清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0">
                    {item.bookCoverImage && (
                      <img src={item.bookCoverImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">{item.bookAuthor}</p>
                  </div>
                  <div className="text-right shrink-0 text-sm">
                    <p>¥{parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
                    <p className="font-medium text-red-600">¥{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-end items-baseline gap-2">
              <span className="text-sm text-muted-foreground">订单总额：</span>
              <span className="text-2xl font-bold text-red-600">¥{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {order.status === "pending" && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => cancelMutation.mutate({ id: order.id })}
              disabled={cancelMutation.isPending}
            >
              取消订单
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
