// 数据库表结构定义（纯类型，仅供文档参考和 coze-coding-ai db 使用）
// API 路由使用 @supabase/supabase-js 直接操作数据库

// ===== apps 应用表 =====
// id: varchar(36) PK default gen_random_uuid()
// name: varchar(128) NOT NULL
// package_name: varchar(255) NOT NULL UNIQUE
// media_id: varchar(64)
// account: varchar(128)
// external_app_id: varchar(128)
// level: integer NOT NULL DEFAULT 4
// report: boolean NOT NULL DEFAULT true
// report_url: text NOT NULL DEFAULT ''   -- V2 上报地址
// splash_url: text NOT NULL DEFAULT ''   -- V2 启动页地址
// popup_url_1: text NOT NULL DEFAULT ''  -- 弹框地址1
// popup_url_2: text NOT NULL DEFAULT ''  -- 弹框地址2
// popup_url_3: text NOT NULL DEFAULT ''  -- 弹框地址3
// ad_order: integer NOT NULL DEFAULT 123 -- 广告排序
// owner_user_id: varchar(36) NOT NULL REFERENCES users(id)
// status: varchar(20) NOT NULL DEFAULT 'active'
// created_at: timestamptz NOT NULL DEFAULT now()
// updated_at: timestamptz

export interface App {
  id: string;
  name: string;
  package_name: string;
  media_id: string | null;
  account: string | null;
  external_app_id: string | null;
  level: number;
  report: boolean;
  report_url: string;
  splash_url: string;
  popup_url_1: string;
  popup_url_2: string;
  popup_url_3: string;
  ad_order: number;
  owner_user_id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// ===== ad_slots 广告位配置表 =====
// id: varchar(36) PK default gen_random_uuid()
// app_id: varchar(36) NOT NULL REFERENCES apps(id) ON DELETE CASCADE
// slot_name: varchar(64) NOT NULL
// slot_label: varchar(64) NOT NULL
// ad_slot_id: varchar(64)
// platform: integer NOT NULL DEFAULT 0
// enabled: boolean NOT NULL DEFAULT true
// created_at: timestamptz NOT NULL DEFAULT now()
// updated_at: timestamptz

export interface AdSlot {
  id: string;
  app_id: string;
  slot_name: string;
  slot_label: string;
  ad_slot_id: string | null;
  platform: number;
  enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

// ===== users 用户表 =====
// id: varchar(36) PK default gen_random_uuid()
// username: varchar(64) NOT NULL UNIQUE
// password_hash: varchar(255) NOT NULL
// display_name: varchar(64)
// role: varchar(20) NOT NULL DEFAULT 'viewer'
// status: varchar(20) NOT NULL DEFAULT 'active'
// last_login_at: timestamptz
// created_at: timestamptz NOT NULL DEFAULT now()
// updated_at: timestamptz

export interface User {
  id: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// ===== ad_config_logs 请求日志表 =====
// id: varchar(36) PK default gen_random_uuid()
// request_id: varchar(64) NOT NULL
// app_id: varchar(255) NOT NULL
// channel: varchar(64)
// nonce: varchar(64)
// response_code: integer NOT NULL
// response_msg: varchar(255)
// level: integer
// slot_count: integer NOT NULL DEFAULT 0
// ip: varchar(64)
// user_agent: varchar(512)
// latency_ms: integer
// created_at: timestamptz NOT NULL DEFAULT now()

export interface AdConfigLog {
  id: string;
  request_id: string;
  app_id: string;
  channel: string | null;
  nonce: string | null;
  response_code: number;
  response_msg: string | null;
  level: number | null;
  slot_count: number;
  ip: string | null;
  user_agent: string | null;
  latency_ms: number | null;
  created_at: string;
}

// ===== ad_levels 广告等级配置表 =====
// id: varchar(36) PK default gen_random_uuid()
// level: integer NOT NULL UNIQUE
// name: varchar(64) NOT NULL
// description: text
// is_default: boolean NOT NULL DEFAULT false
// open_screen: boolean NOT NULL DEFAULT false
// banner: boolean NOT NULL DEFAULT false
// incentive_video: boolean NOT NULL DEFAULT false
// insert_full_screen: boolean NOT NULL DEFAULT false
// created_at: timestamptz NOT NULL DEFAULT now()
// updated_at: timestamptz

export interface AdLevel {
  id: string;
  level: number;
  name: string;
  description: string | null;
  is_default: boolean;
  open_screen: boolean;
  banner: boolean;
  incentive_video: boolean;
  insert_full_screen: boolean;
  created_at: string;
  updated_at: string | null;
}
