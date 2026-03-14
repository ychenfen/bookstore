import { trpc } from "@/lib/trpc";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight, TrendingUp, Sparkles, Truck } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

export default function Home() {
  const [, navigate] = useLocation();
  const categoriesQuery = trpc.category.list.useQuery();
  const hotBooksQuery = trpc.book.list.useQuery({ page: 1, pageSize: 8, sortBy: "sales" });
  const newBooksQuery = trpc.book.list.useQuery({ page: 1, pageSize: 4, sortBy: "newest" });

  const categories = categoriesQuery.data || [];
  const hotBooks = hotBooksQuery.data?.books || [];
  const newBooks = newBooksQuery.data?.books || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              发现好书，享受阅读
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              你的<span className="text-primary">在线书城</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              精选万千好书，涵盖文学、科技、经管、人文等各类图书，为您提供便捷的购书体验
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/books")}>
                开始选购
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/books?sortBy=sales")}>
                热销排行
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: "正版保障", desc: "100%正版图书" },
              { icon: Truck, title: "快速配送", desc: "下单即发货" },
              { icon: TrendingUp, title: "优惠价格", desc: "天天低价" },
              { icon: Sparkles, title: "精选推荐", desc: "专业编辑推荐" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">图书分类</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/books")}>
              查看全部 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/books?categoryId=${cat.id}`)}
                className="p-4 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-center group"
              >
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Books */}
      <section className="py-10 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold">热销榜单</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/books?sortBy=sales")}>
              更多 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {hotBooksQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {hotBooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  price={book.price}
                  originalPrice={book.originalPrice}
                  coverImage={book.coverImage}
                  salesCount={book.salesCount}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Books */}
      <section className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold">新书上架</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/books?sortBy=newest")}>
              更多 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {newBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                price={book.price}
                originalPrice={book.originalPrice}
                coverImage={book.coverImage}
                salesCount={book.salesCount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">网上书城</span>
          </div>
          <p>Spring Boot + Vue3 课程项目 &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
