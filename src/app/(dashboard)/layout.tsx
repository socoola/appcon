'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Megaphone,
  Gauge,
  Smartphone,
  Layers,
  ScrollText,
  Users,
  LogOut,
  Menu,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface AuthInfo {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
}

const navItems = [
  { href: '/', label: '仪表盘', icon: Gauge },
  { href: '/apps', label: '应用管理', icon: Smartphone },
  { href: '/levels', label: '等级管理', icon: Layers },
  { href: '/logs', label: '请求日志', icon: ScrollText },
  { href: '/users', label: '用户管理', icon: Users, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.data) {
          setUser(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-card border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setSheetOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="打开导航菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Megaphone className="w-5 h-5 text-primary" />
          <span className="font-bold text-base text-foreground">AdConfig</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight">
              {user.displayName || user.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.role === 'admin'
                ? '管理员'
                : user.role === 'operator'
                  ? '运营'
                  : '只读'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
            {(user.displayName || user.username).charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>导航菜单</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Sidebar - desktop only */}
        <aside className="hidden lg:block w-56 shrink-0 bg-card border-r border-outline-variant/20 overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-background p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom tab bar - mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card border-t border-outline-variant/20 flex items-center justify-around px-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 rounded-lg transition-colors min-w-0 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
