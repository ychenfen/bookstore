import { BookOpen, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">网上书城</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              精选万千好书，涵盖文学、科技、经管、人文等各类图书，为您提供便捷的在线购书体验。
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">快速导航</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">首页</Link></li>
              <li><Link href="/books" className="hover:text-primary transition-colors">全部书籍</Link></li>
              <li><Link href="/books?sortBy=sales" className="hover:text-primary transition-colors">热销排行</Link></li>
              <li><Link href="/books?sortBy=newest" className="hover:text-primary transition-colors">新书上架</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">用户服务</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cart" className="hover:text-primary transition-colors">购物车</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">我的订单</Link></li>
              <li><Link href="/profile" className="hover:text-primary transition-colors">个人中心</Link></li>
              <li><span className="cursor-default">帮助中心</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">联系我们</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>400-123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span>service@bookstore.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>北京市海淀区中关村</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 网上书城 · Spring Boot + Vue3 课程项目</p>
          <div className="flex gap-4">
            <span>用户协议</span>
            <span>隐私政策</span>
            <span>关于我们</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
