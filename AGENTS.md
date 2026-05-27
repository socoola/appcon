# App广告管理后台

## 项目概览

App广告配置管理后台，按包名管理移动应用的广告位配置。支持穿山甲广告平台，提供0-4级广告等级控制，兼容参考接口格式 `/api/san/ad-config`。

## 技术栈

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Drizzle ORM)
- **Package Manager**: pnpm

## 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── ad-config/route.ts      # 广告配置下发接口（兼容路径）
│   │   ├── san/ad-config/route.ts  # 兼容参考接口路径（re-export）
│   │   ├── apps/route.ts           # 应用CRUD
│   │   ├── apps/[id]/route.ts      # 单应用CRUD
│   │   ├── apps/[id]/slots/route.ts # 广告位CRUD
│   │   ├── levels/route.ts         # 等级CRUD
│   │   └── stats/route.ts          # 统计数据
│   ├── (dashboard)/
│   │   ├── layout.tsx              # 侧边栏+顶栏布局
│   │   ├── page.tsx                # 仪表盘
│   │   ├── apps/page.tsx           # 应用管理列表
│   │   ├── apps/[id]/page.tsx      # 应用配置详情
│   │   └── levels/page.tsx         # 等级管理
│   └── layout.tsx                  # 根布局
├── storage/database/
│   ├── supabase-client.ts          # Supabase客户端
│   └── shared/schema.ts            # Drizzle表定义
└── lib/utils.ts                    # 工具函数
```

## 数据库表

- **apps**: 应用表（name, package_name, media_id, account, external_app_id, level, status, report, owner_user_id）
- **ad_slots**: 广告位表（app_id, slot_name, slot_label, ad_slot_id, platform, enabled）
- **ad_levels**: 等级配置表（level, name, description, is_default, open_screen, banner, incentive_video, insert_full_screen）
- **ad_config_logs**: 请求日志表（request_id, app_id, channel, nonce, response_code, response_msg, level, slot_count, ip, user_agent, latency_ms, created_at）
- **users**: 用户表（username, display_name, password_hash, role, status, last_login_at）

## 构建和测试命令

- 开发: `pnpm run dev`（端口5000）
- 构建: `pnpm run build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`

## API接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/san/ad-config?app_id=xxx` | GET | 兼容参考接口，返回广告配置 |
| `/api/ad-config?app_id=xxx` | GET | 广告配置（同上） |
| `/api/apps` | GET | 获取应用列表（含广告位统计） |
| `/api/apps` | POST | 创建应用（参数：name, package_name, media_id, account, external_app_id, level, report） |
| `/api/apps/[id]` | GET | 获取应用详情 |
| `/api/apps/[id]` | PUT | 更新应用（参数：media_id, account, external_app_id, level, report, status） |
| `/api/apps/[id]` | DELETE | 删除应用 |
| `/api/apps/[id]/slots` | GET | 获取广告位列表 |
| `/api/apps/[id]/slots` | PUT | 批量更新广告位 |
| `/api/levels` | GET | 获取等级列表 |
| `/api/levels` | POST | 添加等级 |
| `/api/levels` | PUT | 批量更新等级 |
| `/api/levels` | DELETE | 删除等级 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/logs` | GET | 获取请求日志（分页，含24h统计） |
| `/api/version` | GET | 获取当前版本号（git commit hash） |
| `/api/auth/login` | POST | 登录（username, password） |
| `/api/auth/logout` | POST | 退出登录 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/users` | GET | 获取用户列表（仅管理员） |
| `/api/users` | POST | 创建用户（仅管理员） |
| `/api/users/[id]` | PATCH | 更新用户（仅管理员） |
| `/api/users/[id]` | DELETE | 删除用户（仅管理员） |

## 编码规范

- TypeScript strict 模式，禁止隐式 any
- 函数参数、返回值、事件对象必须标注类型
- 优先复用已有变量和导入，禁止引用未声明标识符
- next.config 使用 `path.resolve(__dirname, ...)` 动态路径
- 严禁在 JSX 中直接使用 typeof window / Date.now() / Math.random()
