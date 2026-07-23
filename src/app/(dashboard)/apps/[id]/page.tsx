'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RotateCcw, Play, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AppInfo {
  id: string;
  name: string;
  package_name: string;
  media_id: string | null;
  account: string | null;
  external_app_id: string | null;
  level: number;
  report: boolean;
  report_url: string | null;
  splash_url: string | null;
  popup_url_1: string | null;
  popup_url_2: string | null;
  popup_url_3: string | null;
  popup_url_4: string | null;
  ad_order: number;
}

interface AdSlot {
  id: string;
  app_id: string;
  slot_name: string;
  slot_label: string;
  ad_slot_id: string | null;
  platform: number;
  enabled: boolean;
}

interface AdLevel {
  id: string;
  level: number;
  name: string;
  description: string | null;
  is_default: boolean;
  open_screen: boolean;
  banner: boolean;
  incentive_video: boolean;
  insert_full_screen: boolean;
}

export default function AppConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<AppInfo | null>(null);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [levels, setLevels] = useState<AdLevel[]>([]);
  const [mediaId, setMediaId] = useState('');
  const [account, setAccount] = useState('');
  const [externalAppId, setExternalAppId] = useState('');
  const [level, setLevel] = useState(4);
  const [report, setReport] = useState(true);
  const [reportUrl, setReportUrl] = useState('');
  const [splashUrl, setSplashUrl] = useState('');
  const [popupUrl1, setPopupUrl1] = useState('');
  const [popupUrl2, setPopupUrl2] = useState('');
  const [popupUrl3, setPopupUrl3] = useState('');
  const [popupUrl4, setPopupUrl4] = useState('');
  const [adOrder, setAdOrder] = useState(123);
  const [defaultReportUrl, setDefaultReportUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingV2, setTestingV2] = useState(false);
  const [testResultV2, setTestResultV2] = useState<string | null>(null);
  const [copiedV2, setCopiedV2] = useState(false);
  const [testingV1, setTestingV1] = useState(false);
  const [testResultV1, setTestResultV1] = useState<string | null>(null);
  const [copiedV1, setCopiedV1] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/apps/${id}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/apps/${id}/slots`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/levels`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([appRes, slotsRes, levelsRes]) => {
      if (appRes.data) {
        setApp(appRes.data);
        setMediaId(appRes.data.media_id || '');
        setAccount(appRes.data.account || '');
        setExternalAppId(appRes.data.external_app_id || '');
        setLevel(appRes.data.level);
        setReport(appRes.data.report ?? true);
        setReportUrl(appRes.data.report_url || '');
        setSplashUrl(appRes.data.splash_url || '');
        setPopupUrl1(appRes.data.popup_url_1 || '');
        setPopupUrl2(appRes.data.popup_url_2 || '');
        setPopupUrl3(appRes.data.popup_url_3 || '');
        setPopupUrl4(appRes.data.popup_url_4 || '');
        setAdOrder(appRes.data.ad_order ?? 123);
      }
      if (slotsRes.data) {
        setSlots(slotsRes.data);
      }
      if (levelsRes.data) {
        setLevels(levelsRes.data);
      }
    });
  }, [id]);

  // best-effort: 拉取系统默认 report_url,失败静默
  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const items = (json?.data || []) as Array<{ key: string; value: string }>;
        const found = items.find((s) => s.key === 'default_report_url');
        setDefaultReportUrl(found?.value ?? '');
      })
      .catch(() => {
        // 静默 — 按钮不可用即可
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSlotChange = (slotId: string, field: string, value: unknown) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 更新基础配置
      await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_id: mediaId.trim() || null,
          account: account.trim() || null,
          external_app_id: externalAppId.trim() || null,
          level,
          report,
          report_url: reportUrl.trim(),
          splash_url: splashUrl.trim(),
          popup_url_1: popupUrl1.trim(),
          popup_url_2: popupUrl2.trim(),
          popup_url_3: popupUrl3.trim(),
          popup_url_4: popupUrl4.trim(),
          ad_order: Number.isFinite(adOrder) ? adOrder : 123,
        }),
      });

      // 更新广告位
      await fetch(`/api/apps/${id}/slots`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: slots.map((s) => ({
            id: s.id,
            ad_slot_id: s.ad_slot_id,
            platform: s.platform,
            enabled: s.enabled,
          })),
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!app) return;
    setMediaId(app.media_id || '');
    setAccount(app.account || '');
    setExternalAppId(app.external_app_id || '');
    setLevel(app.level);
    setReport(app.report);
    setReportUrl(app.report_url || '');
    setSplashUrl(app.splash_url || '');
    setPopupUrl1(app.popup_url_1 || '');
    setPopupUrl2(app.popup_url_2 || '');
    setPopupUrl3(app.popup_url_3 || '');
    setPopupUrl4(app.popup_url_4 || '');
    setAdOrder(app.ad_order ?? 123);
    // 重新获取数据
    Promise.all([
      fetch(`/api/apps/${id}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/apps/${id}/slots`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([appRes, slotsRes]) => {
      if (appRes.data) {
        setApp(appRes.data);
        setMediaId(appRes.data.media_id || '');
        setAccount(appRes.data.account || '');
        setExternalAppId(appRes.data.external_app_id || '');
        setLevel(appRes.data.level);
        setReport(appRes.data.report ?? true);
        setReportUrl(appRes.data.report_url || '');
        setSplashUrl(appRes.data.splash_url || '');
        setPopupUrl1(appRes.data.popup_url_1 || '');
        setPopupUrl2(appRes.data.popup_url_2 || '');
        setPopupUrl3(appRes.data.popup_url_3 || '');
        setPopupUrl4(appRes.data.popup_url_4 || '');
        setAdOrder(appRes.data.ad_order ?? 123);
      }
      if (slotsRes.data) {
        setSlots(slotsRes.data);
      }
    });
  };

  // 发送 V1 测试请求：query 传参，timestamp/nonce 实时生成
  const handleTestV1 = async () => {
    if (!app) return;
    setTestingV1(true);
    setTestResultV1(null);
    try {
      const url = `/api/san/ad-config?app_id=${encodeURIComponent(app.package_name)}&channel=apple&timestamp=${Date.now()}&nonce=${crypto.randomUUID()}`;
      const res = await fetch(url);
      const json = await res.json();
      setTestResultV1(JSON.stringify(json, null, 2));
    } catch (e) {
      setTestResultV1('请求失败：' + (e as Error).message);
    } finally {
      setTestingV1(false);
    }
  };

  // 复制 V1 可直接访问的链接（timestamp/nonce 实时生成）
  const handleCopyV1 = async () => {
    if (!app) return;
    const url = `${previewDomain}/api/san/ad-config?app_id=${app.package_name}&channel=apple&timestamp=${Date.now()}&nonce=${crypto.randomUUID()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedV1(true);
      setTimeout(() => setCopiedV1(false), 2000);
    } catch {
      // 剪贴板不可用时忽略
    }
  };

  // 发送 V2 测试请求：用正确的 Header 打真实接口（测的是已保存的配置）
  const handleTestV2 = async () => {
    if (!app) return;
    setTestingV2(true);
    setTestResultV2(null);
    try {
      const res = await fetch(`/api/v2/cfg?app_id=${encodeURIComponent(app.package_name)}`, {
        headers: {
          'X-Timestamp': String(Date.now()),
          'X-Nonce': crypto.randomUUID(),
          'X-Channel': 'apple',
        },
      });
      const json = await res.json();
      setTestResultV2(JSON.stringify(json, null, 2));
    } catch (e) {
      setTestResultV2('请求失败：' + (e as Error).message);
    } finally {
      setTestingV2(false);
    }
  };

  // 复制带 Header 的 cURL 命令，方便在终端/Postman 测试
  const handleCopyCurlV2 = async () => {
    if (!app) return;
    const ts = Date.now();
    const nonce = crypto.randomUUID();
    const url = `${previewDomain}/api/v2/cfg?app_id=${app.package_name}`;
    const cmd = `curl '${url}' \\\n  -H 'X-Timestamp: ${ts}' \\\n  -H 'X-Nonce: ${nonce}' \\\n  -H 'X-Channel: apple'`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedV2(true);
      setTimeout(() => setCopiedV2(false), 2000);
    } catch {
      // 剪贴板不可用时忽略
    }
  };

  // 获取当前 level 配置，用于预览过滤
  const currentLevelConfig = levels.find((l) => l.level === level);
  const levelSlotMap: Record<string, boolean> = {
    openScreenId: currentLevelConfig?.open_screen ?? true,
    bannerId: currentLevelConfig?.banner ?? true,
    IncentiveVideoId: currentLevelConfig?.incentive_video ?? true,
    newInsertFullScreenId: currentLevelConfig?.insert_full_screen ?? true,
  };

  const previewList = slots
    .filter((s) => s.enabled && levelSlotMap[s.slot_name] !== false)
    .map((s) => ({
      name: s.slot_name,
      app_id: mediaId || '',
      val: s.ad_slot_id || '',
    }));

  const apiPreview = {
    request_id: 'preview-xxx',
    code: 10000,
    data: { list: previewList, level, report: report ? 1 : 0 },
    msg: 'APP广告配置获取成功',
  };

  // 生成完整的预览 URL
  const previewDomain = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'https://appad.coze.site';
  const previewTimestamp = Date.now();
  const previewNonce = 'PREVIEW_NONCE_PLACEHOLDER';
  const previewUrl = `${previewDomain}/api/san/ad-config?app_id=${app?.package_name || ''}&channel=apple&timestamp=${previewTimestamp}&nonce=${previewNonce}`;

  // V2 预览：app_id 走 query，鉴权/渠道走 Header；report 为地址，新增 splash_url
  const previewUrlV2 = `${previewDomain}/api/v2/cfg?app_id=${app?.package_name || ''}`;
  const apiPreviewV2 = {
    request_id: 'preview-xxx',
    code: 10000,
    data: {
      list: previewList,
      level,
      report: reportUrl,
      splash_url: splashUrl,
      popup_url_1: popupUrl1,
      popup_url_2: popupUrl2,
      popup_url_3: popupUrl3,
      popup_url_4: popupUrl4,
      ad_order: adOrder,
      app_external_id: externalAppId,
    },
    msg: 'APP广告配置获取成功',
  };

  if (!app) {
    return <div className="text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/apps" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          应用管理
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">{app.name}</span>
        <Badge variant="outline" className="font-mono text-xs">{app.package_name}</Badge>
      </div>

      {/* 基本信息卡片 */}
      <Card className="p-5 shadow-card border-none">
        <h2 className="text-base font-semibold text-foreground mb-4">基本信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-6">
          <div>
            <label className="text-xs text-muted-foreground">应用名称</label>
            <div className="text-sm font-medium text-foreground mt-1">{app.name}</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">包名</label>
            <div className="text-sm font-mono text-foreground mt-1">{app.package_name}</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">穿山甲媒体ID</label>
            <Input
              className="mt-1 bg-muted border-none font-mono text-sm"
              placeholder="后续可补充媒体ID"
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">账号</label>
            <Input
              className="mt-1 bg-muted border-none font-mono text-sm"
              placeholder="可选"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">App ID</label>
            <Input
              className="mt-1 bg-muted border-none font-mono text-sm"
              placeholder="可选"
              value={externalAppId}
              onChange={(e) => setExternalAppId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">当前Level</label>
            <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
              <SelectTrigger className="mt-1 bg-muted border-none w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levels.length > 0 ? (
                  levels.map((l) => (
                    <SelectItem key={l.level} value={String(l.level)}>
                      Level {l.level} - {l.name}
                    </SelectItem>
                  ))
                ) : (
                  [0, 1, 2, 3, 4].map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      Level {l}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {currentLevelConfig && (
              <p className="text-xs text-muted-foreground mt-1.5">{currentLevelConfig.description}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Report</label>
            <div className="mt-2 flex h-10 items-center justify-between rounded-md bg-muted px-3">
              <span className="text-sm text-foreground">{report ? '打开' : '关闭'}</span>
              <Switch checked={report} onCheckedChange={setReport} />
            </div>
          </div>
        </div>
      </Card>

      {/* 广告位配置卡片 */}
      <Card className="p-5 shadow-card border-none">
        <h2 className="text-base font-semibold text-foreground mb-4">广告位配置</h2>
        <div className="space-y-0">
          {/* 表头 */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-outline-variant/20">
            <div className="col-span-3">广告位类型</div>
            <div className="col-span-3">广告位ID</div>
            <div className="col-span-2">平台</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2 text-right">启用</div>
          </div>
          {/* 广告位行 */}
          {slots.map((slot) => {
            // 判断当前 level 下该广告位是否被禁用
            const levelDisabled = levelSlotMap[slot.slot_name] === false;
            return (
              <div
                key={slot.id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-4 py-3.5 items-start sm:items-center border-b border-outline-variant/10 transition-colors ${
                  levelDisabled ? 'bg-muted/50 opacity-60' : 'hover:bg-muted/30'
                }`}
              >
                <div className="sm:col-span-3 flex items-center justify-between sm:justify-start">
                  <span className="text-sm font-medium text-foreground">{slot.slot_label}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">{slot.slot_name}</span>
                  {levelDisabled && (
                    <Badge className="ml-2 bg-warning/10 text-warning border-none hover:bg-warning/10 text-xs">当前Level下关闭</Badge>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <Input
                    className="bg-muted border-none font-mono text-sm"
                    placeholder="输入广告位ID"
                    value={slot.ad_slot_id || ''}
                    onChange={(e) => handleSlotChange(slot.id, 'ad_slot_id', e.target.value)}
                    disabled={levelDisabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Select
                    value={String(slot.platform)}
                    onValueChange={(v) => handleSlotChange(slot.id, 'platform', Number(v))}
                    disabled={levelDisabled}
                  >
                    <SelectTrigger className="bg-muted border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">iOS</SelectItem>
                      <SelectItem value="1">Android</SelectItem>
                      <SelectItem value="2">全平台</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  {slot.enabled && !levelDisabled ? (
                    <Badge className="bg-success/10 text-success border-none hover:bg-success/10">已启用</Badge>
                  ) : levelDisabled ? (
                    <Badge className="bg-warning/10 text-warning border-none hover:bg-warning/10">Level关闭</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-none hover:bg-muted">已禁用</Badge>
                  )}
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(v) => handleSlotChange(slot.id, 'enabled', v)}
                    disabled={levelDisabled}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* V2 配置 */}
      <Card className="p-5 shadow-card border-none">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-foreground">V2 配置</h2>
          <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/10">V2</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">启动页地址（splash_url）</label>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={splashUrl}
              onChange={(e) => setSplashUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-muted-foreground">上报地址（report_url，V2 report 字段）</label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={defaultReportUrl === ''}
                title={
                  defaultReportUrl === ''
                    ? '系统默认值为空，请先在「系统设置」中配置'
                    : `填入系统默认值：${defaultReportUrl}`
                }
                onClick={() => setReportUrl(defaultReportUrl)}
              >
                使用默认值
              </Button>
            </div>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">弹窗地址 1（popup_url_1）</label>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={popupUrl1}
              onChange={(e) => setPopupUrl1(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">弹窗地址 2（popup_url_2）</label>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={popupUrl2}
              onChange={(e) => setPopupUrl2(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">弹窗地址 3（popup_url_3）</label>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={popupUrl3}
              onChange={(e) => setPopupUrl3(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">弹窗地址 4（popup_url_4）</label>
            <Input
              className="bg-muted border-none font-mono text-sm"
              placeholder="默认为空，如 https://..."
              value={popupUrl4}
              onChange={(e) => setPopupUrl4(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">广告序号（ad_order）</label>
            <Input
              type="number"
              className="bg-muted border-none font-mono text-sm"
              placeholder="整数，默认 123"
              value={adOrder}
              onChange={(e) => setAdOrder(parseInt(e.target.value, 10) || 123)}
            />
          </div>
        </div>
      </Card>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存配置'}
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            重置
          </Button>
          {saved && (
            <span className="text-sm text-success">配置已保存</span>
          )}
        </div>
      </div>

      {/* API预览 */}
      <Card className="p-5 shadow-card border-none">
        <h2 className="text-base font-semibold text-foreground mb-3">API返回预览</h2>
        <p className="text-xs text-muted-foreground mb-2">
          接口地址：
        </p>
        <code className="block bg-muted px-3 py-2 rounded text-foreground font-mono text-xs break-all mb-3">
          {previewUrl}
        </code>
        <p className="text-xs text-muted-foreground mb-1">
          当前 Level {level} ({currentLevelConfig?.name || '未知'}) 下启用的广告位：
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(levelSlotMap).map(([name, enabled]) => (
            <Badge key={name} className={enabled ? 'bg-success/10 text-success border-none' : 'bg-muted text-muted-foreground border-none'}>
              {name}: {enabled ? '开' : '关'}
            </Badge>
          ))}
          <Badge className={report ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            report: {report ? '1' : '0'}
          </Badge>
        </div>
        <pre className="bg-foreground/5 rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto">
          {JSON.stringify(apiPreview, null, 2)}
        </pre>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button size="sm" onClick={handleTestV1} disabled={testingV1} className="gap-1.5">
            <Play className="w-3.5 h-3.5" />
            {testingV1 ? '请求中...' : '发送测试请求'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyV1} className="gap-1.5">
            {copiedV1 ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedV1 ? '已复制' : '复制链接'}
          </Button>
          <span className="text-xs text-muted-foreground">测试请求会打真实接口，返回的是已保存的配置</span>
        </div>

        {testResultV1 !== null && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">接口实际返回：</p>
            <pre className="bg-foreground/5 rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto">
              {testResultV1}
            </pre>
          </div>
        )}
      </Card>

      {/* API预览 - V2 */}
      <Card className="p-5 shadow-card border-none">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-foreground">API返回预览</h2>
          <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/10">V2</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          接口地址（app_id 走 query，timestamp/nonce/channel 走请求头）：
        </p>
        <code className="block bg-muted px-3 py-2 rounded text-foreground font-mono text-xs break-all mb-2">
          {previewUrlV2}
        </code>
        <code className="block bg-muted px-3 py-2 rounded text-muted-foreground font-mono text-xs break-all mb-3">
          X-Timestamp: {previewTimestamp}{'\n'}X-Nonce: {previewNonce}{'\n'}X-Channel: apple
        </code>
        <p className="text-xs text-muted-foreground mb-1">
          与 V1 的差异：<span className="text-foreground">report</span> 返回上报地址，新增 <span className="text-foreground">splash_url</span> 启动页地址。
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className={reportUrl ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            report: {reportUrl || '(空)'}
          </Badge>
          <Badge className={splashUrl ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            splash_url: {splashUrl || '(空)'}
          </Badge>
          <Badge className={popupUrl1 ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            popup_url_1: {popupUrl1 || '(空)'}
          </Badge>
          <Badge className={popupUrl2 ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            popup_url_2: {popupUrl2 || '(空)'}
          </Badge>
          <Badge className={popupUrl3 ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            popup_url_3: {popupUrl3 || '(空)'}
          </Badge>
          <Badge className={popupUrl4 ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            popup_url_4: {popupUrl4 || '(空)'}
          </Badge>
          <Badge className={adOrder ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            ad_order: {adOrder}
          </Badge>
          <Badge className={externalAppId ? 'bg-primary/10 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
            app_external_id: {externalAppId || '(空)'}
          </Badge>
        </div>
        <pre className="bg-foreground/5 rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto">
          {JSON.stringify(apiPreviewV2, null, 2)}
        </pre>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button size="sm" onClick={handleTestV2} disabled={testingV2} className="gap-1.5">
            <Play className="w-3.5 h-3.5" />
            {testingV2 ? '请求中...' : '发送测试请求'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyCurlV2} className="gap-1.5">
            {copiedV2 ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedV2 ? '已复制' : '复制 cURL'}
          </Button>
          <span className="text-xs text-muted-foreground">测试请求会打真实接口，返回的是已保存的配置</span>
        </div>

        {testResultV2 !== null && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">接口实际返回：</p>
            <pre className="bg-foreground/5 rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto">
              {testResultV2}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
