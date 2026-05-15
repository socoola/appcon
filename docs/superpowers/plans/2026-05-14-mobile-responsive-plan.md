# Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AdConfig 后台管理系统适配为全响应式，CSS 断点驱动，覆盖手机/平板/桌面。

**Architecture:** CSS 断点驱动，不改架构。`default`（<768px）底部 Tab + 卡片，`md`（768-1023px）窄图标栏，`lg`（≥1024px）保持现有侧边栏。移动端 Dialog 转为底部 Sheet。

**Tech Stack:** Next.js 16 + Tailwind CSS 4 + shadcn/ui (Sheet), Lucide React icons, 无额外依赖

---

### Task 1: 重构 DashboardLayout 为响应式

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: 重写 DashboardLayout 支持三段响应式导航**

将现有 `src/app/(dashboard)/layout.tsx` 替换为以下内容：

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Megaphone, Gauge, Smartphone, Layers, ScrollText, Users, LogOut, Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const roleLabel = user.role === 'admin' ? '管理员' : user.role === 'operator' ? '运营' : '只读';

  // Shared nav link renderer
  const renderNavLink = (item: (typeof navItems)[0], variant: 'sidebar' | 'sheet') => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors';
    const activeClass = 'bg-primary/10 text-primary';
    const inactiveClass = 'text-muted-foreground hover:bg-muted hover:text-foreground';

    if (variant === 'sheet') {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`${baseClass} ${active ? activeClass : inactiveClass}`}
        >
          <Icon className="w-5 h-5" />
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${baseClass} ${active ? activeClass : inactiveClass}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="w-4 h-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 md:px-6 bg-card border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b border-outline-variant/20">
                <SheetTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <span>AdConfig</span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-3 space-y-0.5">
                {filteredNavItems.map((item) => renderNavLink(item, 'sheet'))}
              </div>
            </SheetContent>
          </Sheet>
          <Megaphone className="w-5 h-5 text-primary" />
          <span className="font-bold text-base text-foreground">AdConfig</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">
              {user.displayName || user.username}
            </p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
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

      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden lg:block w-56 shrink-0 bg-card border-r border-outline-variant/20 overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {filteredNavItems.map((item) => renderNavLink(item, 'sidebar'))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-background p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card border-t border-outline-variant/20 flex items-center justify-around px-2 safe-area-bottom">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 py-1 px-2 rounded-lg transition-colors min-h-[44px] ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: 验证 desktop 布局无回归**

Run: `open http://localhost:3000` — 确认桌面端侧边栏、Header、内容区正常显示

---

### Task 2: 仪表盘页响应式

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: 统计卡片改为响应式 grid**

替换统计卡片 grid：

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
```

- [ ] **Step 2: 下方区域改为响应式堆叠**

替换下方区域的 grid：

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx
git commit -m "feat: 仪表盘页响应式适配"
```

---

### Task 3: 应用管理页响应式

**Files:**
- Modify: `src/app/(dashboard)/apps/page.tsx`

- [ ] **Step 1: 操作栏改为响应式堆叠**

替换操作栏的 `flex items-center justify-between`：

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div className="relative w-full sm:w-80">
    {/* search input unchanged */}
  </div>
  <Button onClick={() => setShowAdd(true)} className="gap-2 w-full sm:w-auto">
    <Plus className="w-4 h-4" />
    添加应用
  </Button>
</div>
```

- [ ] **Step 2: 表格区域：桌面表格 + 移动卡片**

将现有 `<table>` 包裹在 `hidden md:block` 中，并在其后添加移动端卡片列表：

```tsx
{/* Desktop table */}
<div className="hidden md:block bg-card rounded-lg shadow-card border-none overflow-hidden">
  {/* existing table unchanged */}
</div>

{/* Mobile cards */}
<div className="md:hidden space-y-3">
  {apps.length === 0 ? (
    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg">
      {search ? '未找到匹配的应用' : '暂无应用，点击上方按钮添加'}
    </div>
  ) : (
    apps.map((app) => (
      <div key={app.id} className="bg-card rounded-lg p-4 shadow-card">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-medium text-foreground">{app.name}</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{app.package_name}</div>
          </div>
          {app.enabled_slots === app.total_slots && app.total_slots > 0 ? (
            <Badge className="bg-success/10 text-success border-none">已配置</Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning border-none">未配置</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span>广告位 <span className="text-primary font-medium">{app.enabled_slots}</span>/{app.total_slots}</span>
          <span>Level {app.level} {getLevelName(app.level)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${app.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Settings className="w-3.5 h-3.5" /> 配置
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => handleDelete(app.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    ))
  )}
</div>
```

- [ ] **Step 3: Dialog 移动端转为底部 Sheet**

在文件顶部添加 Sheet 导入。将新增应用 Dialog 包裹在响应式逻辑中，移动端使用 Sheet (side="bottom")：

在 return 的 Dialog 后添加：

```tsx
{/* Mobile bottom sheet for adding app */}
<Sheet open={showAdd} onOpenChange={setShowAdd}>
  <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
    <SheetHeader>
      <SheetTitle>添加新应用</SheetTitle>
    </SheetHeader>
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">应用名称</label>
        <Input
          placeholder="如：短视频"
          className="bg-muted border-none"
          value={addForm.name}
          onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">包名</label>
        <Input
          placeholder="如：com.san.video"
          className="bg-muted border-none"
          value={addForm.package_name}
          onChange={(e) => setAddForm({ ...addForm, package_name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">穿山甲媒体ID</label>
        <Input
          placeholder="如：5000546"
          className="bg-muted border-none"
          value={addForm.media_id}
          onChange={(e) => setAddForm({ ...addForm, media_id: e.target.value })}
        />
      </div>
    </div>
    <SheetFooter>
      <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
      <Button onClick={handleAdd} disabled={addLoading || !addForm.name || !addForm.package_name}>
        {addLoading ? '添加中...' : '添加'}
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

将现有 Dialog 包裹在 `hidden md:block` 中（实为 inline），Sheet 包裹在 `md:hidden` 中。简化方案：使用 CSS 控制 Dialog 和 Sheet 在不同断点的显示。实际上 Dialog 在移动端可通过设置 `sm:max-w-md` 自动适配，只需确保在移动端不溢出即可。改为在 Dialog 外层添加 `max-sm:hidden`，Sheet 外层添加 `sm:hidden`。

更简洁的做法：Dialog 已能自适应，只需将移动端 Dialog 改为 `sm:max-w-[calc(100%-2rem)]` 并保证不高过屏幕。保留 Dialog，仅当需要底部 Sheet 时才加 Sheet。对新增应用这种短表单，Dialog 自适应即可。**不做 Sheet 替换，只修 Dialog 的 max-w 限制**：

```tsx
<DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/apps/page.tsx
git commit -m "feat: 应用管理页响应式适配，添加移动端卡片视图"
```

---

### Task 4: 等级管理页响应式

**Files:**
- Modify: `src/app/(dashboard)/levels/page.tsx`

- [ ] **Step 1: 标题栏改为响应式**

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
    <h1 className="text-2xl font-bold text-foreground">等级管理</h1>
    <p className="text-sm text-muted-foreground mt-1">配置每个等级包含的广告位类型</p>
  </div>
  <Button onClick={handleAdd} disabled={adding} className="gap-2 w-full sm:w-auto">
    <Plus className="w-4 h-4" />
    {adding ? '添加中...' : '添加等级'}
  </Button>
</div>
```

- [ ] **Step 2: Card 内部布局改为响应式堆叠**

将每个等级 Card 的内部 `flex items-start gap-6` 改为响应式：

```tsx
<div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
```

- [ ] **Step 3: 广告位开关 grid 改为响应式**

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

- [ ] **Step 4: 操作区改为行内布局（移动端）**

将右侧操作区（设为默认 + 删除）改为响应式：

```tsx
<div className="w-full lg:w-32 shrink-0 flex flex-row lg:flex-col items-center lg:items-center gap-2 mt-3 lg:mt-0">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/levels/page.tsx
git commit -m "feat: 等级管理页响应式适配"
```

---

### Task 5: 用户管理页响应式

**Files:**
- Modify: `src/app/(dashboard)/users/page.tsx`

- [ ] **Step 1: 权限说明 grid 改为响应式**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
```

- [ ] **Step 2: 操作栏改为响应式堆叠**

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div className="relative w-full sm:w-64">
    {/* search input unchanged */}
  </div>
  <button
    onClick={() => setShowAdd(true)}
    className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
  >
    <Plus className="w-4 h-4" />
    添加用户
  </button>
</div>
```

- [ ] **Step 3: 添加移动端卡片视图**

将现有 table 包裹在 `hidden md:block` 中，添加移动端卡片：

```tsx
{/* Desktop table */}
<div className="hidden md:block bg-card rounded-xl border border-outline-variant/20 overflow-hidden">
  {/* existing table unchanged */}
</div>

{/* Mobile cards */}
<div className="md:hidden space-y-3">
  {filtered.length === 0 ? (
    <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-outline-variant/20">
      暂无用户数据
    </div>
  ) : (
    filtered.map((u) => {
      const roleInfo = roleLabels[u.role] || roleLabels.viewer;
      const RoleIcon = roleInfo.icon;
      return (
        <div key={u.id} className="bg-card rounded-xl border border-outline-variant/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-foreground">{u.username}</div>
              <div className="text-xs text-muted-foreground">{u.display_name || '-'}</div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
              <RoleIcon className="w-3 h-3" />
              {roleInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span>{u.status === 'active' ? '启用' : '禁用'}</span>
            <span>创建: {new Date(u.created_at).toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditUser(u);
                setEditDisplayName(u.display_name || '');
                setEditRole(u.role);
                setEditStatus(u.status);
                setEditPassword('');
              }}
              className="flex-1 py-2 rounded-lg border border-outline-variant/20 text-sm text-foreground hover:bg-muted transition-colors"
            >
              编辑
            </button>
            <button
              onClick={() => handleDelete(u.id)}
              className="py-2 px-4 rounded-lg border border-outline-variant/20 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      );
    })
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/users/page.tsx
git commit -m "feat: 用户管理页响应式适配，添加移动端卡片视图"
```

---

### Task 6: 请求日志页响应式

**Files:**
- Modify: `src/app/(dashboard)/logs/page.tsx`

- [ ] **Step 1: 统计卡片改为响应式**

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
```

- [ ] **Step 2: 筛选栏改为响应式堆叠**

```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card rounded-xl border border-outline-variant/20 p-4">
  <div className="flex items-center gap-2 flex-1">
    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
    <input ... className="flex-1 min-w-0" />
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    <select ... />
    <button onClick={handleSearch} className="... whitespace-nowrap">搜索</button>
    <button onClick={...} className="...">...</button>
    <label className="... whitespace-nowrap">...</label>
  </div>
</div>
```

- [ ] **Step 3: 分页改为响应式**

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 ...">
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/logs/page.tsx
git commit -m "feat: 请求日志页响应式适配"
```

---

### Task 7: 登录页响应式

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: 卡片宽度改为响应式**

登录页已基本响应式。只需确保小屏不溢出：

```tsx
<div className="w-full max-w-sm px-4 sm:px-6">
```

- [ ] **Step 2: 触摸目标优化**

输入框高度确保 ≥ 44px（已满足 `py-2.5`），登录按钮同样。

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx
git commit -m "feat: 登录页响应式适配"
```

---

### Task 8: 全局安全区域适配

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 添加 safe-area 工具类和 viewport meta**

在 `globals.css` 末尾添加：

```css
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}
```

- [ ] **Step 2: 验证 viewport（Next.js 已默认设置）**

Next.js App Router 默认设置 `viewport: width=device-width, initial-scale=1`，无需额外配置。

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: 添加 safe-area 安全区域适配"
```

---

### Task 9: 全量验证

- [ ] **Step 1: 启动 dev server 并验证各断点**

Run: `open http://localhost:3000`

在浏览器 DevTools 中切换设备模式，验证：
- iPhone SE (375px): 底部 Tab 显示，卡片视图正常
- iPad (768px): 无底部 Tab，侧边栏仍隐藏（窄屏）
- Desktop (1440px): 完整侧边栏 + 表格，与原版一致

- [ ] **Step 2: 验证所有页面导航正常**

点击每个底部 Tab 和侧边栏链接，确认导航正确、高亮正确。

- [ ] **Step 3: 验证新增/编辑/删除操作**

在移动端视图下：
- 应用管理：新增应用、删除应用
- 等级管理：编辑等级、保存、添加、删除
- 用户管理：添加用户、编辑用户、删除用户

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: 移动端验证修复"
```
