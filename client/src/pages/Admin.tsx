import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BookOpen, Package, Users, DollarSign, Plus, Pencil, Trash2, ArrowLeft, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Admin() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  if (isAuthenticated && user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Settings className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">需要管理员权限</p>
        <Button className="mt-4" onClick={() => navigate("/")}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回首页
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6" />
        管理后台
      </h1>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stats">数据概览</TabsTrigger>
          <TabsTrigger value="books">书籍管理</TabsTrigger>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="orders">订单管理</TabsTrigger>
        </TabsList>

        <TabsContent value="stats"><StatsPanel /></TabsContent>
        <TabsContent value="books"><BooksPanel /></TabsContent>
        <TabsContent value="categories"><CategoriesPanel /></TabsContent>
        <TabsContent value="orders"><OrdersPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsPanel() {
  const statsQuery = trpc.admin.stats.useQuery();
  const stats = statsQuery.data;
  const recentOrdersQuery = trpc.admin.orders.useQuery({ page: 1, pageSize: 5 });
  const recentOrders = recentOrdersQuery.data?.orders || [];

  const items = [
    { icon: BookOpen, label: "在售书籍", value: stats?.totalBooks || 0, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Package, label: "总订单数", value: stats?.totalOrders || 0, color: "text-green-600", bg: "bg-green-50" },
    { icon: Users, label: "注册用户", value: stats?.totalUsers || 0, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: DollarSign, label: "销售总额", value: `¥${parseFloat(stats?.totalRevenue || "0").toFixed(2)}`, color: "text-red-600", bg: "bg-red-50" },
  ];

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "待付款", color: "text-amber-600 bg-amber-50" },
    paid: { label: "已付款", color: "text-blue-600 bg-blue-50" },
    shipped: { label: "已发货", color: "text-purple-600 bg-purple-50" },
    completed: { label: "已完成", color: "text-green-600 bg-green-50" },
    cancelled: { label: "已取消", color: "text-red-600 bg-red-50" },
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近订单</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无订单</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>用户ID</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => {
                    const st = statusLabels[order.status] || { label: order.status, color: "" };
                    return (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.userId}</TableCell>
                        <TableCell className="font-medium text-red-600">¥{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BooksPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editBook, setEditBook] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const utils = trpc.useUtils();

  const categoriesQuery = trpc.category.list.useQuery();
  const categories = categoriesQuery.data || [];

  const booksQuery = trpc.book.adminList.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    status: undefined,
  });
  const books = booksQuery.data?.books || [];
  const total = booksQuery.data?.total || 0;

  const createMutation = trpc.book.create.useMutation({
    onSuccess: () => { toast.success("书籍已添加"); setShowAddDialog(false); utils.book.adminList.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.book.update.useMutation({
    onSuccess: () => { toast.success("书籍已更新"); setEditBook(null); utils.book.adminList.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.book.delete.useMutation({
    onSuccess: () => { toast.success("书籍已下架"); utils.book.adminList.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索书名或作者..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <BookFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          categories={categories}
          onSubmit={(data: any) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          title="添加书籍"
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              添加书籍
            </Button>
          }
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>封面</TableHead>
                <TableHead>书名</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>销量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>{book.id}</TableCell>
                  <TableCell>
                    <div className="w-10 h-14 rounded bg-muted overflow-hidden">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">无</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>¥{parseFloat(book.price).toFixed(2)}</TableCell>
                  <TableCell>{book.stock}</TableCell>
                  <TableCell>{book.salesCount}</TableCell>
                  <TableCell>
                    <Badge variant={book.status === "active" ? "default" : "secondary"}>
                      {book.status === "active" ? "在售" : "已下架"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <BookFormDialog
                        open={editBook?.id === book.id}
                        onOpenChange={(open: boolean) => setEditBook(open ? book : null)}
                        categories={categories}
                        initialData={book}
                        onSubmit={(data: any) => updateMutation.mutate({ id: book.id, ...data })}
                        isPending={updateMutation.isPending}
                        title="编辑书籍"
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      {book.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteMutation.mutate({ id: book.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>共 {total} 本书</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <Button variant="outline" size="sm" disabled={books.length < 20} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      </div>
    </div>
  );
}

function BookFormDialog({ open, onOpenChange, categories, initialData, onSubmit, isPending, title, trigger }: any) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    author: initialData?.author || "",
    isbn: initialData?.isbn || "",
    price: initialData?.price || "",
    originalPrice: initialData?.originalPrice || "",
    description: initialData?.description || "",
    coverImage: initialData?.coverImage || "",
    categoryId: initialData?.categoryId ? String(initialData.categoryId) : "none",
    stock: initialData?.stock || 100,
    publisher: initialData?.publisher || "",
    pageCount: initialData?.pageCount || "",
    status: initialData?.status || "active",
  });

  const handleSubmit = () => {
    if (!form.title || !form.author || !form.price) {
      toast.error("请填写必要信息（书名、作者、价格）");
      return;
    }
    onSubmit({
      ...form,
      categoryId: form.categoryId !== "none" ? Number(form.categoryId) : undefined,
      stock: Number(form.stock),
      publisher: form.publisher || undefined,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>书名 *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>作者 *</Label>
              <Input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>售价 *</Label>
              <Input value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>原价</Label>
              <Input value={form.originalPrice} onChange={(e) => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>ISBN</Label>
              <Input value={form.isbn} onChange={(e) => setForm(f => ({ ...f, isbn: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>库存</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>出版社</Label>
              <Input value={form.publisher} onChange={(e) => setForm(f => ({ ...f, publisher: e.target.value }))} placeholder="如：人民文学出版社" />
            </div>
            <div className="space-y-1">
              <Label>页数</Label>
              <Input type="number" value={form.pageCount} onChange={(e) => setForm(f => ({ ...f, pageCount: e.target.value }))} placeholder="如：320" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>分类</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无分类</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {initialData && (
              <div className="space-y-1">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在售</SelectItem>
                    <SelectItem value="inactive">下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>封面图片URL</Label>
            <Input value={form.coverImage} onChange={(e) => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." />
            {form.coverImage && (
              <div className="mt-2 w-20 h-28 rounded border overflow-hidden bg-muted">
                <img src={form.coverImage} alt="封面预览" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>简介</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesPanel() {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const utils = trpc.useUtils();

  const categoriesQuery = trpc.category.list.useQuery();
  const categories = categoriesQuery.data || [];

  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => { toast.success("分类已添加"); setNewName(""); setNewDesc(""); utils.category.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => { toast.success("分类已删除"); utils.category.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加分类</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="分类名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="描述（选填）"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={() => {
                if (!newName.trim()) { toast.error("请输入分类名称"); return; }
                createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
              }}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate({ id: cat.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrdersPanel() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const ordersQuery = trpc.admin.orders.useQuery({ page, pageSize: 10 });
  const orders = ordersQuery.data?.orders || [];
  const total = ordersQuery.data?.total || 0;

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("状态已更新"); utils.admin.orders.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const statusOptions = [
    { value: "pending", label: "待付款" },
    { value: "paid", label: "已付款" },
    { value: "shipped", label: "已发货" },
    { value: "completed", label: "已完成" },
    { value: "cancelled", label: "已取消" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>用户ID</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>下单时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.userId}</TableCell>
                  <TableCell className="font-medium text-red-600">¥{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatusMutation.mutate({ id: order.id, status: v as any })}
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/orders/${order.id}`, "_blank")}>
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>共 {total} 个订单</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <Button variant="outline" size="sm" disabled={orders.length < 10} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      </div>
    </div>
  );
}
