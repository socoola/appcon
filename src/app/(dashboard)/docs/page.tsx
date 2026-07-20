'use client';

import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          API 开发手册
        </h1>
        <p className="text-sm text-muted-foreground mt-1">App广告配置管理后台接口文档</p>
      </div>

      <Card className="p-6 shadow-card border-none">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2 className="text-lg font-semibold text-foreground mb-3">1. 项目概述</h2>
          <p className="text-muted-foreground">
            App广告配置管理后台，按包名管理移动应用的广告位配置。支持穿山甲广告平台，提供0-4级广告等级控制，兼容参考接口格式 <code>/api/san/ad-config</code>。配置下发接口提供 V1（<code>/api/ad-config</code>，query 传参）与 V2（<code>/api/v2/cfg</code>，Header 传参）两个版本。
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">2. 技术栈</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">层级</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">技术</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">版本</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2">Framework</td><td>Next.js (App Router)</td><td>16.1.1</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2">Language</td><td>TypeScript</td><td>5.x</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2">UI</td><td>shadcn/ui + Tailwind CSS</td><td>4.x</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2">Database</td><td>Supabase (PostgreSQL)</td><td>-</td></tr>
                <tr><td className="py-2">Package Manager</td><td>pnpm</td><td>9.0.0+</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">3. 数据库设计</h2>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">3.1 apps（应用表）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">字段</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">类型</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">id</td><td>varchar(36)</td><td>PK, UUID</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">name</td><td>varchar(128)</td><td>应用名称</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">package_name</td><td>varchar(255)</td><td>包名，唯一</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">media_id</td><td>varchar(64)</td><td>穿山甲媒体ID</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">account</td><td>varchar(128)</td><td>账号（可选）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">external_app_id</td><td>varchar(128)</td><td>App ID（可选）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">level</td><td>integer</td><td>广告等级 (0-4)，默认4</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">report</td><td>boolean</td><td>是否上报，默认true（V1 返回 0/1）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">report_url</td><td>text</td><td>上报地址，默认空串（V2 的 report 字段返回该值）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">splash_url</td><td>text</td><td>启动页地址，默认空串（V2 返回 splash_url）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">popup_url_1</td><td>text</td><td>弹窗地址 1，默认空串（V2 返回 popup_url_1）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">popup_url_2</td><td>text</td><td>弹窗地址 2，默认空串（V2 返回 popup_url_2）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">popup_url_3</td><td>text</td><td>弹窗地址 3，默认空串（V2 返回 popup_url_3）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">popup_url_4</td><td>text</td><td>弹窗地址 4，默认空串（V2 返回 popup_url_4）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">ad_order</td><td>integer</td><td>广告排序/序号，默认 123（V2 返回 ad_order）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">owner_user_id</td><td>varchar(36)</td><td>所属用户</td></tr>
                <tr><td className="py-2 font-mono">status</td><td>varchar(20)</td><td>状态，默认active</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">3.2 ad_slots（广告位配置表）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">字段</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">类型</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">id</td><td>varchar(36)</td><td>PK</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">app_id</td><td>varchar(36)</td><td>应用ID，外键</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">slot_name</td><td>varchar(64)</td><td>广告位标识</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">slot_label</td><td>varchar(64)</td><td>广告位显示名</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">ad_slot_id</td><td>varchar(64)</td><td>广告位ID</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">platform</td><td>integer</td><td>平台类型</td></tr>
                <tr><td className="py-2 font-mono">enabled</td><td>boolean</td><td>是否启用</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">3.3 ad_levels（广告等级配置表）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">字段</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">类型</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">id</td><td>varchar(36)</td><td>PK</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">level</td><td>integer</td><td>等级编号，唯一</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">name</td><td>varchar(64)</td><td>等级名称</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">description</td><td>text</td><td>描述</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">is_default</td><td>boolean</td><td>是否默认</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">open_screen</td><td>boolean</td><td>开屏开关</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">banner</td><td>boolean</td><td>Banner开关</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">incentive_video</td><td>boolean</td><td>激励视频开关</td></tr>
                <tr><td className="py-2 font-mono">insert_full_screen</td><td>boolean</td><td>插屏开关</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">4. API 接口文档</h2>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.1 认证机制</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">请求头</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">x-user-id</td><td>用户ID</td></tr>
                <tr><td className="py-2 font-mono">x-user-role</td><td>用户角色（admin/operator/viewer）</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.2 广告配置下发接口（V1）</h3>
          <div className="bg-muted rounded-lg p-3 mb-3">
            <p className="font-mono text-sm text-foreground">GET /api/ad-config?app_id=xxx&amp;channel=apple&amp;timestamp=xxx&amp;nonce=xxx</p>
            <p className="font-mono text-sm text-muted-foreground">GET /api/san/ad-config（兼容路径）</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">查询参数：</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">参数</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">必填</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">app_id</td><td>是</td><td>应用包名</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">channel</td><td>否</td><td>渠道标识</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">timestamp</td><td>是</td><td>时间戳（毫秒）</td></tr>
                <tr><td className="py-2 font-mono">nonce</td><td>是</td><td>随机字符串</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">timestamp 与服务器当前时间差值需在 5 分钟内</p>
          <p className="text-sm text-muted-foreground mt-2 mb-2">返回体：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
  "request_id": "uuid",
  "code": 10000,
  "msg": "APP广告配置获取成功",
  "data": {
    "list": [{ "name": "openScreenId", "app_id": "媒体ID", "val": "广告位ID" }],
    "level": 3,
    "report": 1
  }
}`}
          </pre>

          <h3 className="text-base font-medium text-foreground mt-6 mb-2">4.2.1 广告配置下发接口（V2）</h3>
          <div className="bg-muted rounded-lg p-3 mb-3">
            <p className="font-mono text-sm text-foreground">GET /api/v2/cfg?app_id=xxx</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            与 V1 的差异：<code className="bg-muted px-1 rounded">timestamp</code> / <code className="bg-muted px-1 rounded">nonce</code> / <code className="bg-muted px-1 rounded">channel</code> 改为通过<strong>请求头</strong>传递；返回体中 <code className="bg-muted px-1 rounded">report</code> 变为上报地址字符串，并新增 <code className="bg-muted px-1 rounded">splash_url</code> 启动页地址、<code className="bg-muted px-1 rounded">popup_url_1/2/3/4</code> 弹窗地址、<code className="bg-muted px-1 rounded">ad_order</code> 广告序号、<code className="bg-muted px-1 rounded">app_external_id</code> 应用 App ID。鉴权规则与错误码同 V1。
          </p>
          <p className="text-sm text-muted-foreground mb-2">查询参数：</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">参数</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">必填</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-2 font-mono">app_id</td><td>是</td><td>应用包名（走 query）</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2 mb-2">请求头：</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">请求头</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">必填</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">X-Timestamp</td><td>是</td><td>时间戳（毫秒）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">X-Nonce</td><td>是</td><td>随机字符串</td></tr>
                <tr><td className="py-2 font-mono">X-Channel</td><td>否</td><td>渠道标识</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2 mb-2">返回体：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
  "request_id": "uuid",
  "code": 10000,
  "msg": "APP广告配置获取成功",
  "data": {
    "list": [{ "name": "openScreenId", "app_id": "媒体ID", "val": "广告位ID" }],
    "level": 3,
    "report": "https://report.example.com/x",
    "splash_url": "",
    "popup_url_1": "",
    "popup_url_2": "",
    "popup_url_3": "",
    "popup_url_4": "",
    "ad_order": 123,
    "app_external_id": ""
  }
}`}
          </pre>
          <p className="text-sm text-muted-foreground mt-2">
            示例（cURL）：
          </p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`curl 'https://appad.coze.site/api/v2/cfg?app_id=com.san.test' \\
  -H 'X-Timestamp: 1752600000000' \\
  -H 'X-Nonce: abc123' \\
  -H 'X-Channel: apple'`}
          </pre>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.3 应用管理接口</h3>

          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/apps?page=1&amp;pageSize=20&amp;search=xxx</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            获取应用列表（分页）。<code className="bg-muted px-1 rounded">page</code> 默认 1，<code className="bg-muted px-1 rounded">pageSize</code> 默认 20（最大 100），<code className="bg-muted px-1 rounded">search</code> 按包名模糊匹配。未传参时返回第 1 页前 20 条。
          </p>
          <p className="text-sm text-muted-foreground mb-2">响应体：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
  "data": [ /* AppItem[]，含 total_slots / enabled_slots */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 43,
    "totalPages": 3
  }
}`}
          </pre>

          <div className="bg-muted rounded-lg p-3 mb-2 mt-3">
            <p className="font-mono text-sm text-foreground">POST /api/apps</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">创建应用。请求体：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
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
  "ad_order": 123
}`}
          </pre>

          <div className="bg-muted rounded-lg p-3 mb-2 mt-3">
            <p className="font-mono text-sm text-foreground">PUT /api/apps/:id</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">更新应用。支持部分更新：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
  "media_id": "new_media",
  "account": "new_account",
  "external_app_id": "new_app_id",
  "level": 3,
  "report": false,
  "report_url": "https://report.example.com/x",
  "splash_url": "https://cdn.example.com/splash.png",
  "popup_url_1": "https://popup.example.com/1",
  "popup_url_2": "https://popup.example.com/2",
  "popup_url_3": "https://popup.example.com/3",
  "popup_url_4": "https://popup.example.com/4",
  "ad_order": 100,
  "status": "inactive"
}`}
          </pre>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.4 广告位配置接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/apps/:id/slots</p>
          </div>
          <p className="text-sm text-muted-foreground">获取广告位列表</p>

          <div className="bg-muted rounded-lg p-3 mb-2 mt-3">
            <p className="font-mono text-sm text-foreground">PUT /api/apps/:id/slots</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">批量更新广告位：</p>
          <pre className="bg-foreground/5 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`{
  "slots": [
    {
      "id": "slot_uuid",
      "ad_slot_id": "new_slot_id",
      "platform": 1,
      "enabled": true
    }
  ]
}`}
          </pre>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.5 等级管理接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/levels</p>
            <p className="font-mono text-sm text-foreground">POST /api/levels（仅admin）</p>
            <p className="font-mono text-sm text-foreground">PUT /api/levels（仅admin）</p>
            <p className="font-mono text-sm text-foreground">DELETE /api/levels?id=xxx（仅admin）</p>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.6 日志接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/logs?page=1&amp;pageSize=20&amp;app_id=xxx</p>
          </div>
          <p className="text-sm text-muted-foreground">获取配置下发接口（V1 <code className="bg-muted px-1 rounded">/api/ad-config</code> 与 V2 <code className="bg-muted px-1 rounded">/api/v2/cfg</code>）请求日志，保留24小时</p>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.7 版本接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/version</p>
          </div>
          <p className="text-sm text-muted-foreground">返回当前 git commit hash</p>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.8 认证接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">POST /api/auth/login</p>
            <p className="font-mono text-sm text-foreground">POST /api/auth/logout</p>
            <p className="font-mono text-sm text-foreground">GET /api/auth/me</p>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.9 用户管理接口（仅admin）</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/users</p>
            <p className="font-mono text-sm text-foreground">POST /api/users</p>
            <p className="font-mono text-sm text-foreground">PATCH /api/users/:id</p>
            <p className="font-mono text-sm text-foreground">DELETE /api/users/:id</p>
          </div>

          <h3 className="text-base font-medium text-foreground mt-4 mb-2">4.10 统计接口</h3>
          <div className="bg-muted rounded-lg p-3 mb-2">
            <p className="font-mono text-sm text-foreground">GET /api/stats</p>
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">5. 错误码规范</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">错误码</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">10000</td><td>成功</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">40001</td><td>缺少必填参数</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">40002</td><td>参数格式无效</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">40003</td><td>请求过期（timestamp 超时）</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">40004</td><td>应用不存在</td></tr>
                <tr><td className="py-2 font-mono">50001</td><td>数据库查询失败/超时</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">6. 开发规范</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>TypeScript strict 模式，禁止隐式 <code>any</code></li>
            <li>函数参数、返回值必须标注类型</li>
            <li>使用 <code>@supabase/supabase-js</code> 直接操作数据库</li>
            <li>查询超时：主查询 2000ms，Supabase 全局超时 60000ms</li>
            <li>删除操作注意级联关系（ad_slots 已设置 ON DELETE CASCADE）</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">7. 环境变量</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-2 text-muted-foreground font-medium">变量</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">COZE_SUPABASE_URL</td><td>Supabase 项目 URL</td></tr>
                <tr className="border-b border-outline-variant/10"><td className="py-2 font-mono">COZE_SUPABASE_ANON_KEY</td><td>Supabase Anon Key</td></tr>
                <tr><td className="py-2 font-mono">COZE_SUPABASE_SERVICE_ROLE_KEY</td><td>Supabase Service Role Key（服务端使用）</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
