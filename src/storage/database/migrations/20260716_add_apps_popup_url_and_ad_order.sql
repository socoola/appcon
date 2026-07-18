-- 2026-07-16: apps 表新增 V2 弹窗地址与广告序号字段
-- popup_url_1 / popup_url_2 / popup_url_3: V2 接口返回的弹窗地址列表，默认空串
-- ad_order: V2 接口返回的广告排序/序号，整数，默认 0
-- 仅 V2 使用；V1 接口不受影响。
--
-- 执行方式：在 Supabase SQL Editor（或 psql）中运行本文件。
-- 注意：代码已依赖这 4 列，务必在部署新版代码前先执行本迁移。

ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS popup_url_1 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS popup_url_2 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS popup_url_3 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ad_order integer NOT NULL DEFAULT 0;
