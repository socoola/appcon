-- 2026-07-18: apps 表新增 V2 弹窗地址 4
-- popup_url_4: V2 接口返回的弹窗地址 4，默认空串
-- 仅 V2 使用；V1 接口不受影响。
--
-- 执行方式：在 Supabase SQL Editor（或 psql）中运行本文件。
-- 注意：代码已依赖这列，务必在部署新版代码前先执行本迁移。

ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS popup_url_4 text NOT NULL DEFAULT '';