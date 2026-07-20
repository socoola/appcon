# API 开发手册

## 1. 项目概述

App广告配置管理后台，按包名管理移动应用的广告位配置。支持穿山甲广告平台，提供0-4级广告等级控制，兼容参考接口格式 `/api/san/ad-config`。

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | 5.x |
| UI | shadcn/ui (Radix UI) + Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | - |
| ORM | Drizzle ORM | 0.45.2 |
| Package Manager | pnpm | 9.0.0+ |

## 3. 数据库设计

### 3.1 apps（应用表）

存储应用基本信息，按包名唯一标识。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK, default gen_random_uuid() | 唯一ID |
| name | varchar(128) | NOT NULL | 应用名称 |
| package_name | varchar(255) | NOT NULL, UNIQUE | 包名（如 com.san.test） |
| media_id | varchar(64) | - | 穿山甲媒体ID |
| account | varchar(128) | - | 账号（可选） |
| external_app_id | varchar(128) | - | App ID（可选） |
| level | integer | NOT NULL, DEFAULT 4 | 广告等级 (0-4) |
| report | boolean | NOT NULL, DEFAULT true | 是否上报 |
| owner_user_id | varchar(36) | NOT NULL, FK→users(id) | 所属用户 |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | 状态 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamptz | - | 更新时间 |

### 3.2 ad_slots（广告位配置表）

每个应用默认创建4个广告位，开屏、Banner、激励视频、插屏全屏。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK | 唯一ID |
| app_id | varchar(36) | NOT NULL, FK→apps(id), ON DELETE CASCADE | 应用ID |
| slot_name | varchar(64) | NOT NULL | 广告位标识名 |
| slot_label | varchar(64) | NOT NULL | 广告位显示名 |
| ad_slot_id | varchar(64) | - | 穿山甲广告位ID |
| platform | integer | NOT NULL, DEFAULT 0 | 平台类型 |
| enabled | boolean | NOT NULL, DEFAULT true | 是否启用 |
| created_at | timestamptz | NOT NULL | 创建时间 |
| updated_at | timestamptz | - | 更新时间 |

**默认广告位：**

| slot_name | slot_label | platform |
|-----------|-----------|----------|
| openScreenId | 开屏广告 | 0 |
| bannerId | Banner广告 | 0 |
| IncentiveVideoId | 激励视频 | 1 |
| newInsertFullScreenId | 插屏全屏 | 2 |

### 3.3 ad_levels（广告等级配置表）

定义0-4级广告等级，控制各广告位类型的开关。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK | 唯一ID |
| level | integer | NOT NULL, UNIQUE | 等级编号 |
| name | varchar(64) | NOT NULL | 等级名称 |
| description | text | - | 描述 |
| is_default | boolean | NOT NULL, DEFAULT false | 是否默认等级 |
| open_screen | boolean | NOT NULL, DEFAULT false | 开屏广告开关 |
| banner | boolean | NOT NULL, DEFAULT false | Banner开关 |
| incentive_video | boolean | NOT NULL, DEFAULT false | 激励视频开关 |
| insert_full_screen | boolean | NOT NULL, DEFAULT false | 插屏全屏开关 |
| created_at | timestamptz | NOT NULL | 创建时间 |
| updated_at | timestamptz | - | 更新时间 |

### 3.4 users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK | 唯一ID |
| username | varchar(64) | NOT NULL, UNIQUE | 用户名 |
| password_hash | varchar(255) | NOT NULL | 密码哈希 |
| display_name | varchar(64) | - | 显示名 |
| role | varchar(20) | NOT NULL, DEFAULT 'viewer' | 角色 |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | 状态 |
| last_login_at | timestamptz | - | 最后登录时间 |
| created_at | timestamptz | NOT NULL | 创建时间 |
| updated_at | timestamptz | - | 更新时间 |

### 3.5 ad_config_logs（请求日志表）

记录 `/api/ad-config` 接口的请求日志，保留24小时。

| 字段 | 类型 | 说明 |
|------|------|------|
| request_id | varchar(64) | 请求ID |
| app_id | varchar(255) | 应用包名 |
| channel | varchar(64) | 渠道 |
| nonce | varchar(64) | 随机串 |
| response_code | integer | 响应码 |
| response_msg | varchar(255) | 响应消息 |
| level | integer | 返回的等级 |
| slot_count | integer | 广告位数量 |
| ip | varchar(64) | 请求IP |
| user_agent | varchar(512) | UA |
| latency_ms | integer | 耗时(ms) |
| created_at | timestamptz | 创建时间 |

## 4. API 接口文档

### 4.1 认证机制

管理后台接口通过请求头传递用户身份：

| 请求头 | 说明 |
|--------|------|
| x-user-id | 用户ID |
| x-user-role | 用户角色（admin/viewer） |

**权限规则：**
- `admin` 角色可访问所有接口和所有数据
- 非 `admin` 角色只能访问自己创建的应用数据
- `/api/levels` 的 POST/PUT/DELETE 仅 `admin` 可访问

### 4.2 广告配置下发接口

客户端SDK调用接口，返回应用的广告位配置。

#### GET /api/ad-config
#### GET /api/san/ad-config（兼容路径）

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| app_id | string | 是 | 应用包名 |
| channel | string | 否 | 渠道标识 |
| timestamp | string | 是 | 时间戳（毫秒） |
| nonce | string | 是 | 随机字符串 |

**参数校验：**
- `app_id` 必填
- `timestamp` 必填，需为有效数字格式
- `nonce` 必填
- `timestamp` 与服务器当前时间差值需在 5 分钟（300000ms）内

**成功响应 (code: 10000)：**

```json
{
  "request_id": "uuid",
  "code": 10000,
  "data": {
    "list": [
      {
        "name": "openScreenId",
        "app_id": "media_id_value",
        "val": "ad_slot_id_value"
      }
    ],
    "level": 4,
    "report": 1
  },
  "msg": "APP广告配置获取成功"
}
```

**错误响应：**

| code | 说明 |
|------|------|
| 40001 | 缺少必填参数（app_id/timestamp/nonce） |
| 40002 | timestamp 格式无效 |
| 40003 | 请求已过期，timestamp 超出有效时间窗口 |
| 40004 | 应用不存在 |
| 50001 | 数据库查询失败或超时 |

**响应数据说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | array | 启用的广告位列表，已按等级配置过滤 |
| list[].name | string | 广告位标识名 |
| list[].app_id | string \| null | 媒体ID |
| list[].val | string | 广告位ID |
| level | number | 当前应用等级 |
| report | number | 是否上报（1=是，0=否） |

**缓存机制：**
- 广告配置缓存：5秒 TTL，按 `app_id` 缓存
- 等级配置缓存：30秒 TTL，按 `level` 缓存
- 并发请求合并：相同 `app_id` 的并发请求会合并为单个数据库查询

**日志记录：**
- 每次请求异步写入 `ad_config_logs` 表
- 后台每 5 分钟自动清理超过 24 小时的日志

### 4.3 应用管理接口

#### GET /api/apps

获取应用列表（分页，支持搜索和权限过滤）。

**查询参数：**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| page | number | 否 | 1 | 1-based 页码，小于 1 视为 1 |
| pageSize | number | 否 | 20 | 每页条数，clamp 到 [1, 100] |
| search | string | 否 | - | 按应用名称或包名模糊搜索（OR，`ilike`） |

**请求头：** `x-user-id`, `x-user-role`

**排序：** `created_at DESC, id DESC`（`id` 为稳定 tie-breaker，避免相邻页错位）。

**成功响应：**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "应用名称",
      "package_name": "com.example.app",
      "media_id": "media123",
      "account": "user_account",
      "external_app_id": "app_id_value",
      "level": 4,
      "report": true,
      "report_url": "",
      "splash_url": "",
      "popup_url_1": "",
      "popup_url_2": "",
      "popup_url_3": "",
      "popup_url_4": "",
      "ad_order": 123,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "total_slots": 4,
      "enabled_slots": 2
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 43,
    "totalPages": 3
  }
}
```

**行为变化点：** 未传 `page`/`pageSize` 时仅返回前 20 条；需要全部记录请按页遍历。

---

#### POST /api/apps

创建应用，自动创建4个默认广告位。

**请求体：**

```json
{
  "name": "应用名称",
  "package_name": "com.example.app",
  "media_id": "media123",
  "account": "user_account",
  "external_app_id": "app_id_value",
  "level": 4,
  "report": true
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 应用名称 |
| package_name | string | 是 | - | 包名（唯一） |
| media_id | string | 否 | null | 媒体ID |
| account | string | 否 | null | 账号 |
| external_app_id | string | 否 | null | App ID |
| level | number | 否 | 4 | 广告等级 |
| report | boolean | 否 | true | 是否上报 |

**错误响应：**
- `400` - 缺少必填字段
- `409` - 包名已存在（PostgreSQL 唯一约束冲突 code 23505）

---

#### GET /api/apps/:id

获取应用详情。

**路径参数：** `id` - 应用ID

**权限：** 非 admin 只能访问自己的应用

---

#### PUT /api/apps/:id

更新应用信息。

**路径参数：** `id` - 应用ID

**请求体：** 支持部分更新，以下字段可选：

```json
{
  "name": "新名称",
  "package_name": "com.new.package",
  "media_id": "new_media",
  "account": "new_account",
  "external_app_id": "new_app_id",
  "level": 3,
  "report": false,
  "status": "inactive"
}
```

---

#### DELETE /api/apps/:id

删除应用（级联删除关联的广告位）。

### 4.4 广告位配置接口

#### GET /api/apps/:id/slots

获取应用的广告位列表。

**成功响应：**

```json
{
  "data": [
    {
      "id": "uuid",
      "app_id": "app_uuid",
      "slot_name": "openScreenId",
      "slot_label": "开屏广告",
      "ad_slot_id": "slot123",
      "platform": 0,
      "enabled": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### PUT /api/apps/:id/slots

批量更新广告位配置。

**请求体：**

```json
{
  "slots": [
    {
      "id": "slot_uuid",
      "ad_slot_id": "new_slot_id",
      "platform": 1,
      "enabled": true
    }
  ]
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| slots | array | 是 | 广告位更新列表 |
| slots[].id | string | 是 | 广告位ID |
| slots[].ad_slot_id | string | 否 | 广告位ID |
| slots[].platform | number | 否 | 平台类型 |
| slots[].enabled | boolean | 否 | 是否启用 |

### 4.5 等级管理接口

#### GET /api/levels

获取所有等级配置，按等级编号升序排列。

**权限：** 所有已认证用户

---

#### POST /api/levels

添加新等级（仅 admin）。

**请求体：**

```json
{
  "name": "等级名称",
  "description": "描述",
  "level": 5,
  "is_default": false,
  "open_screen": true,
  "banner": true,
  "incentive_video": false,
  "insert_full_screen": false
}
```

**特殊逻辑：**
- 未指定 `level` 时，自动取最大值+1
- `is_default=true` 时，先取消其他等级的默认状态
- `level` 编号不可重复

---

#### PUT /api/levels

批量更新等级配置（仅 admin）。

**请求体：**

```json
{
  "levels": [
    {
      "id": "level_uuid",
      "name": "新名称",
      "is_default": true,
      "open_screen": true
    }
  ]
}
```

**特殊逻辑：**
- 如有等级设为默认，先取消所有现有默认等级

---

#### DELETE /api/levels

删除等级（仅 admin）。

**查询参数：** `id` - 等级ID

**前置检查：**
- 等级必须存在
- 该等级不能被任何应用使用（检查 `apps.level` 引用）

### 4.6 日志接口

#### GET /api/logs

获取 `/api/ad-config` 接口的请求日志，保留24小时。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页条数，默认20 |
| app_id | string | 否 | 按包名筛选 |
| code | string | 否 | 按响应码筛选 |
| startDate | string | 否 | 开始日期（ISO格式） |
| endDate | string | 否 | 结束日期（ISO格式） |

**成功响应：**

```json
{
  "data": [
    {
      "id": "uuid",
      "request_id": "req_id",
      "app_id": "com.example.app",
      "channel": "apple",
      "nonce": "abc123",
      "response_code": 10000,
      "response_msg": "APP广告配置获取成功",
      "level": 4,
      "slot_count": 3,
      "ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "latency_ms": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "stats": {
    "total_24h": 100,
    "success_24h": 95,
    "fail_24h": 5,
    "avg_latency_ms": 12
  }
}
```

### 4.7 版本接口

#### GET /api/version

获取当前部署版本号（git commit hash）。

**成功响应：**

```json
{
  "commit": "abc1234"
}
```

### 4.8 认证接口

#### POST /api/auth/login

用户登录。

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应：** 设置认证 cookie，返回用户信息

#### POST /api/auth/logout

退出登录，清除认证 cookie。

#### GET /api/auth/me

获取当前登录用户信息。

### 4.9 用户管理接口

**权限：** 仅 `admin` 角色可访问

#### GET /api/users

获取用户列表。

#### POST /api/users

创建用户。

**请求体：**

```json
{
  "username": "newuser",
  "password": "password123",
  "display_name": "新用户",
  "role": "viewer"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码（至少6位） |
| display_name | string | 否 | 显示名称 |
| role | string | 否 | 角色（admin/operator/viewer），默认 viewer |

#### PATCH /api/users/:id

更新用户信息。

**请求体：** 支持部分更新

```json
{
  "display_name": "新名称",
  "role": "operator",
  "status": "active",
  "password": "newpassword"
}
```

#### DELETE /api/users/:id

删除用户。

### 4.10 统计接口

#### GET /api/stats

获取仪表盘统计数据。

**成功响应：**

```json
{
  "data": {
    "app_count": 10,
    "slot_count": 40,
    "level_count": 5,
    "slot_distribution": {
      "openScreenId": 10,
      "bannerId": 10,
      "IncentiveVideoId": 10,
      "newInsertFullScreenId": 10
    }
  }
}
```

**权限：** 非 admin 只能统计自己的应用数据

## 5. 错误码规范

### 5.1 广告配置接口错误码

| 错误码 | 场景 |
|--------|------|
| 10000 | 成功 |
| 40001 | 缺少必填参数 |
| 40002 | 参数格式无效 |
| 40003 | 请求过期（timestamp 超时） |
| 40004 | 应用不存在 |
| 50001 | 数据库查询失败/超时 |

### 5.2 管理接口 HTTP 状态码

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 403 | 权限不足（非 admin 访问管理接口） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如包名已存在） |
| 500 | 服务器内部错误 |

## 6. 开发规范

### 6.1 代码风格

- TypeScript strict 模式，禁止隐式 `any`
- 函数参数、返回值、事件对象必须标注类型
- 优先复用已有变量和导入，禁止引用未声明标识符
- next.config 使用 `path.resolve(__dirname, ...)` 动态路径
- 严禁在 JSX 中直接使用 `typeof window` / `Date.now()` / `Math.random()`

### 6.2 数据库操作

- 使用 `@supabase/supabase-js` 直接操作数据库
- 查询超时设置：主查询 2000ms，Supabase 客户端全局超时 60000ms
- 删除操作注意级联关系（`ad_slots` 已设置 `ON DELETE CASCADE`）

### 6.3 权限检查

所有涉及应用数据的接口必须调用 `ensureAppAccess`：

```typescript
async function ensureAppAccess(appId: string, userId: string | null, userRole: string | null) {
  const client = getSupabaseClient();
  let query = client.from('apps').select('id').eq('id', appId);
  if (userRole !== 'admin') {
    query = query.eq('owner_user_id', userId || '');
  }
  const { data, error } = await query.maybeSingle();
  return { exists: Boolean(data), error };
}
```

### 6.4 环境变量

| 变量 | 说明 |
|------|------|
| COZE_SUPABASE_URL | Supabase 项目 URL |
| COZE_SUPABASE_ANON_KEY | Supabase Anon Key |
| COZE_SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key（服务端使用） |

## 7. 构建与运行

```bash
# 安装依赖
pnpm install

# 开发（端口5000）
pnpm run dev

# 构建
pnpm run build

# 类型检查
pnpm run ts-check

# Lint
pnpm run lint

# 验证（类型检查 + lint）
pnpm run validate
```

## 8. 接口调用示例

### 8.1 获取广告配置（客户端SDK）

```bash
curl "https://your-domain.com/api/ad-config?app_id=com.san.test&channel=apple&timestamp=1700000000000&nonce=abc123"
```

### 8.2 创建应用

```bash
curl -X POST https://your-domain.com/api/apps \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_uuid" \
  -H "x-user-role: admin" \
  -d '{
    "name": "测试应用",
    "package_name": "com.example.test",
    "media_id": "media123",
    "account": "user_account",
    "external_app_id": "app_id_value",
    "level": 4,
    "report": true
  }'
```

### 8.3 更新广告位

```bash
curl -X PUT https://your-domain.com/api/apps/app_uuid/slots \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_uuid" \
  -H "x-user-role: admin" \
  -d '{
    "slots": [
      {
        "id": "slot_uuid",
        "ad_slot_id": "new_ad_slot_id",
        "enabled": true
      }
    ]
  }'
```

### 8.4 批量更新等级

```bash
curl -X PUT https://your-domain.com/api/levels \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_uuid" \
  -H "x-user-role: admin" \
  -d '{
    "levels": [
      {
        "id": "level_uuid",
        "name": "VIP等级",
        "open_screen": true,
        "banner": true
      }
    ]
  }'
```
