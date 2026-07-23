-- 2026-07-22: 新建 system_settings KV 表,用于集中存储系统级默认值
-- 当前键:
--   default_report_url: 默认上报地址,V2 report_url 输入框「使用默认值」按钮会读取
--
-- 执行方式:在 Supabase SQL Editor(或 psql)中运行本文件。
-- 注意:代码已依赖该表,务必在部署新版代码前先执行本迁移。

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 种子:report_url 默认值(空字符串)
INSERT INTO system_settings (key, value) VALUES ('default_report_url', '')
  ON CONFLICT (key) DO NOTHING;