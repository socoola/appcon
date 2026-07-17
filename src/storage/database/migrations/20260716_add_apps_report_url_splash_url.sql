-- 2026-07-16: apps 表新增 V2 广告配置字段
-- report_url: V2 接口返回的上报地址（V1 仍用 report boolean → 0/1，不受影响）
-- splash_url: V2 接口返回的启动页地址
-- 两列均带默认空串，存量数据自动回填 ''，V2 对未配置的 app 返回空地址。
--
-- 执行方式：在 Supabase SQL Editor（或 psql）中运行本文件。
-- 注意：代码已依赖这两列，务必在部署新版代码前先执行本迁移。

ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS report_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS splash_url text NOT NULL DEFAULT '';
