import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface BookCardProps {
  id: number;
  title: string;
  author: string;
  price: string;
  originalPrice?: string | null;
  coverImage?: string | null;
  salesCount?: number;
  categoryName?: string;
}

export default function BookCard({ id, title, author, price, originalPrice, coverImage, salesCount, categoryName }: BookCardProps) {
  const hasDiscount = originalPrice && parseFloat(originalPrice) > parseFloat(price);

  return (
    <Link href={`/books/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-transparent hover:border-primary/20">
        <div className="aspect-[3/4] overflow-hidden bg-muted relative">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${coverImage ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5`}>
            <span className="text-4xl font-bold text-primary/20">{title.charAt(0)}</span>
          </div>
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
              {Math.round((1 - parseFloat(price) / parseFloat(originalPrice!)) * 100)}% OFF
            </Badge>
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{author}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-red-600">¥{parseFloat(price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">¥{parseFloat(originalPrice!).toFixed(2)}</span>
            )}
          </div>
          {salesCount !== undefined && salesCount > 0 && (
            <p className="text-xs text-muted-foreground">已售 {salesCount > 999 ? `${(salesCount / 1000).toFixed(1)}k` : salesCount}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
