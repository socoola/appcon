# Mobile Responsive Design

## Overview

AdConfig 后台管理系统全响应式适配。从手机（375px）到桌面（1440px+）完整覆盖，CSS 断点驱动，不改架构。

## Breakpoints

| 断点 | 宽度 | 目标设备 | 导航形态 |
|------|------|---------|---------|
| `default` | < 768px | 手机 | 精简 Header + 底部 Tab 栏 |
| `md` | 768-1023px | 平板 | 窄图标栏 (64px) + 内容 |
| `lg` | ≥ 1024px | 桌面 | 完整侧边栏 (224px)，保持现有 |

## Navigation

### Mobile (< 768px)
- Header 精简：品牌名 + 用户头像（点击弹出下拉菜单：用户信息 + 退出）
- 底部固定 Tab 栏：5 个图标 + 文字标签，当前页高亮
- 使用 `next/link`，保持 SPA 导航

### Tablet (768-1023px)
- 左侧 64px 图标栏，hover 展开文字 tooltip
- 无文字标签，仅图标
- 保持 Header

### Desktop (≥ 1024px)
- 现有侧边栏不变

## Content Strategy

### Cards (mobile)
- **应用管理**：每应用一张卡片，展示名称、包名、状态 Badge、Level、广告位数量、操作按钮
- **等级管理**：每等级一张卡片，展示名称、描述、广告位配置状态
- **用户管理**：每用户一张卡片，展示用户名、角色 Badge、操作按钮

### Horizontal Scroll (mobile)
- **请求日志**：保留 `<table>`，容器 `overflow-x: auto`，固定时间列

### Dashboard
- 统计卡片：`grid-cols-4` → `grid-cols-2`（手机）
- 下方区域：`grid-cols-5` → 堆叠布局（手机）

## Dialogs

移动端 Dialog 转为底部 Sheet（使用 shadcn/ui Sheet 组件）：
- 新增/编辑表单：底部 Sheet，手势友好
- 确认删除：保持居中 Dialog（内容少，不需要全屏）

## Implementation

### Layout (`src/app/(dashboard)/layout.tsx`)
- 重构为三段响应式
- `default`: `flex flex-col`，Header + main + BottomTab
- `md`: `flex flex-row`，IconSidebar + main
- `lg`: 现有结构不变
- BottomTab 组件：`fixed bottom-0`，5 个 Tab

### Page Changes
- `apps/page.tsx`：添加 Card 视图，`block md:hidden`
- `levels/page.tsx`：添加 Card 视图
- `users/page.tsx`：添加 Card 视图
- `logs/page.tsx`：表格容器加 `overflow-x: auto`
- Dashboard：响应式 grid 类名

### Components
- 新建 `BottomTab` 组件
- 复用 shadcn/ui `Sheet` 做移动端弹窗
- 触摸目标 ≥ 44px（iOS HIG）

## Non-goals
- 不引入 `react-responsive` 等额外依赖
- 不创建页面双版本（Desktop/Mobile 组件）
- 不改变现有桌面端 UI
- 不修改 API 或数据层
