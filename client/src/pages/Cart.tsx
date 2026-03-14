import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Cart() {
  const { isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const cartQuery = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const cartItems = cartQuery.data || [];

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); utils.cart.count.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); utils.cart.count.invalidate(); toast.success("已移除"); },
    onError: (err) => toast.error(err.message),
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); utils.cart.count.invalidate(); toast.success("购物车已清空"); },
    onError: (err) => toast.error(err.message),
  });

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.book?.price || "0") * item.quantity;
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          购物车
          {cartItems.length > 0 && (
            <span className="text-base font-normal text-muted-foreground">({totalItems} 件商品)</span>
          )}
        </h1>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => clearMutation.mutate()}>
            清空购物车
          </Button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">购物车是空的</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">去书城逛逛，发现好书吧</p>
          <Button onClick={() => navigate("/books")}>
            去选购 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Cart items */}
          <div className="space-y-3">
            {cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Book cover */}
                    <div
                      className="w-20 h-28 rounded-lg overflow-hidden bg-muted shrink-0 cursor-pointer"
                      onClick={() => navigate(`/books/${item.bookId}`)}
                    >
                      {item.book?.coverImage ? (
                        <img src={item.book.coverImage} alt={item.book?.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <BookOpen className="h-6 w-6 text-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium truncate cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/books/${item.bookId}`)}
                      >
                        {item.book?.title || "未知书籍"}
                      </h3>
                      <p className="text-sm text-muted-foreground">{item.book?.author}</p>
                      <p className="text-red-600 font-bold mt-1">¥{parseFloat(item.book?.price || "0").toFixed(2)}</p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            小计：<span className="text-red-600">¥{(parseFloat(item.book?.price || "0") * item.quantity).toFixed(2)}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeMutation.mutate({ id: item.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-20 h-fit">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-lg">订单摘要</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品数量</span>
                    <span>{totalItems} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品金额</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运费</span>
                    <span className="text-green-600">免运费</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">合计</span>
                  <span className="text-2xl font-bold text-red-600">¥{totalAmount.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                  去结算
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
