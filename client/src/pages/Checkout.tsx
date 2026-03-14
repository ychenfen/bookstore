import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Checkout() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const cartQuery = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const cartItems = cartQuery.data || [];

  const [form, setForm] = useState({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    note: "",
  });

  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: (data) => {
      toast.success("订单创建成功！");
      utils.cart.list.invalidate();
      utils.cart.count.invalidate();
      navigate(`/orders/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "创建订单失败");
    },
  });

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.book?.price || "0") * item.quantity;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shippingName.trim()) { toast.error("请填写收货人姓名"); return; }
    if (!form.shippingPhone.trim()) { toast.error("请填写联系电话"); return; }
    if (!form.shippingAddress.trim()) { toast.error("请填写收货地址"); return; }
    createOrderMutation.mutate(form);
  };

  if (cartItems.length === 0 && !cartQuery.isLoading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">购物车为空，无法结算</p>
        <Button className="mt-4" onClick={() => navigate("/books")}>去选购</Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/cart")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回购物车
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        确认订单
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            {/* Shipping info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  收货信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">收货人 *</Label>
                    <Input
                      id="name"
                      placeholder="请输入收货人姓名"
                      value={form.shippingName}
                      onChange={(e) => setForm(f => ({ ...f, shippingName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">联系电话 *</Label>
                    <Input
                      id="phone"
                      placeholder="请输入联系电话"
                      value={form.shippingPhone}
                      onChange={(e) => setForm(f => ({ ...f, shippingPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">收货地址 *</Label>
                  <Textarea
                    id="address"
                    placeholder="请输入详细收货地址"
                    value={form.shippingAddress}
                    onChange={(e) => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">备注</Label>
                  <Textarea
                    id="note"
                    placeholder="选填，如有特殊要求请注明"
                    value={form.note}
                    onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">商品清单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0">
                        {item.book?.coverImage && (
                          <img src={item.book.coverImage} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.book?.title}</p>
                        <p className="text-xs text-muted-foreground">{item.book?.author}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm">x{item.quantity}</p>
                        <p className="text-sm font-medium text-red-600">
                          ¥{(parseFloat(item.book?.price || "0") * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-20 h-fit">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold">订单摘要</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品总额</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运费</span>
                    <span className="text-green-600">免运费</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">应付金额</span>
                  <span className="text-2xl font-bold text-red-600">¥{totalAmount.toFixed(2)}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? "提交中..." : "提交订单"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
