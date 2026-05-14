'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Gauge, Smartphone, Layers, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: '仪表盘', icon: Gauge },
  { href: '/apps', label: '应用管理', icon: Smartphone },
  { href: '/levels', label: '等级管理', icon: Layers },
  { href: '/logs', label: '请求日志', icon: ScrollText },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 判断当前菜单是否激活（/apps/xxx 也算应用管理）
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-card border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          <Megaphone className="w-5 h-5 text-primary" />
          <span className="font-bold text-base text-foreground">AdConfig</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">小初</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
            初
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-card border-r border-outline-variant/20 overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {navItems.map((item) => {
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
        <main className="flex-1 min-w-0 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
