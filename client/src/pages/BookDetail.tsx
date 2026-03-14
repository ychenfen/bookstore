import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft, BookOpen, Minus, Plus, Package, Check } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { getLoginUrl } from "@/const";

export default function BookDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const bookId = Number(params.id);
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const bookQuery = trpc.book.detail.useQuery({ id: bookId });
  const book = bookQuery.data;

  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("已添加到购物车");
      utils.cart.count.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "添加失败");
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCartMutation.mutate({ bookId, quantity });
  };

  if (bookQuery.isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[3/4] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container py-20 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-medium">书籍不存在</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/books")}>
          返回书城
        </Button>
      </div>
    );
  }

  const hasDiscount = book.originalPrice && parseFloat(book.originalPrice) > parseFloat(book.price);

  return (
    <div className="container py-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/books")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回书城
      </Button>

      <div className="grid md:grid-cols-[380px_1fr] gap-8">
        {/* Cover */}
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${book.coverImage ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5`}>
            <span className="text-6xl font-bold text-primary/20">{book.title.charAt(0)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-muted-foreground">作者：{book.author}</p>
            {book.isbn && <p className="text-sm text-muted-foreground mt-1">ISBN：{book.isbn}</p>}
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-red-600">¥{parseFloat(book.price).toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">¥{parseFloat(book.originalPrice!).toFixed(2)}</span>
                  <Badge variant="destructive" className="text-xs">
                    省 ¥{(parseFloat(book.originalPrice!) - parseFloat(book.price)).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>库存：{book.stock > 0 ? `${book.stock} 件` : "暂时缺货"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>已售 {book.salesCount} 本</span>
            </div>
          </div>

          <Separator />

          {/* Quantity & Add to cart */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">数量</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={quantity <= 1}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={quantity >= book.stock}
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={book.stock <= 0 || addToCartMutation.isPending}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {addToCartMutation.isPending ? "添加中..." : "加入购物车"}
            </Button>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">内容简介</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {book.description || "暂无简介"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
