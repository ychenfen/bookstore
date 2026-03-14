import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, ShoppingCart, Search, User, LogOut, Package, Settings, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCountQuery = trpc.cart.count.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const cartCount = cartCountQuery.data || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary shrink-0">
          <BookOpen className="h-6 w-6" />
          <span className="hidden sm:inline">网上书城</span>
        </Link>

        {/* Search bar - desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索书名、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate("/books")}>
            全部书籍
          </Button>
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" className="relative" onClick={() => navigate("/cart")}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                购物车
                {cartCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
                <Package className="h-4 w-4 mr-1" />
                我的订单
              </Button>
            </>
          )}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm">{user?.name || "用户"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  我的订单
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/cart")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  购物车 {cartCount > 0 && `(${cartCount})`}
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      管理后台
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
              <User className="h-4 w-4 mr-1" />
              登录
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索书名、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start" onClick={() => { navigate("/books"); setMobileMenuOpen(false); }}>
              全部书籍
            </Button>
            {isAuthenticated && (
              <>
                <Button variant="ghost" className="justify-start" onClick={() => { navigate("/cart"); setMobileMenuOpen(false); }}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  购物车 {cartCount > 0 && `(${cartCount})`}
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => { navigate("/orders"); setMobileMenuOpen(false); }}>
                  <Package className="h-4 w-4 mr-2" />
                  我的订单
                </Button>
                {user?.role === "admin" && (
                  <Button variant="ghost" className="justify-start" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>
                    <Settings className="h-4 w-4 mr-2" />
                    管理后台
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
