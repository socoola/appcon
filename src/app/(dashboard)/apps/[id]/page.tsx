'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
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
  level: number;
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

const platformMap: Record<number, string> = {
  0: 'iOS',
  1: 'Android',
  2: '全平台',
};

export default function AppConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<AppInfo | null>(null);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [level, setLevel] = useState(4);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/apps/${id}`).then((r) => r.json()),
      fetch(`/api/apps/${id}/slots`).then((r) => r.json()),
    ]).then(([appRes, slotsRes]) => {
      if (appRes.data) {
        setApp(appRes.data);
        setLevel(appRes.data.level);
      }
      if (slotsRes.data) {
        setSlots(slotsRes.data);
      }
    });
  }, [id]);

  const handleSlotChange = (slotId: string, field: string, value: unknown) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 更新Level
      await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });

      // 更新广告位
      await fetch(`/api/apps/${id}/slots`, {
        method: 'PUT',
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
    setLevel(app.level);
    // 重新获取数据
    fetch(`/api/apps/${id}/slots`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setSlots(res.data);
      });
  };

  // 生成API预览JSON
  const apiPreview = {
    request_id: 'preview-xxx',
    code: 10000,
    data: {
      list: slots
        .filter((s) => s.enabled)
        .map((s) => ({
          name: s.slot_name,
          app_id: app?.media_id || '',
          val: s.ad_slot_id || '',
          platform: s.platform,
        })),
      level,
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
        <div className="grid grid-cols-4 gap-6">
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
            <div className="text-sm font-mono text-foreground mt-1">{app.media_id || '-'}</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">当前Level</label>
            <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
              <SelectTrigger className="mt-1 bg-muted border-none w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    Level {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 广告位配置卡片 */}
      <Card className="p-5 shadow-card border-none">
        <h2 className="text-base font-semibold text-foreground mb-4">广告位配置</h2>
        <div className="space-y-0">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-outline-variant/20">
            <div className="col-span-3">广告位类型</div>
            <div className="col-span-3">广告位ID</div>
            <div className="col-span-2">平台</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2 text-right">启用</div>
          </div>
          {/* 广告位行 */}
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center border-b border-outline-variant/10 hover:bg-muted/30 transition-colors"
            >
              <div className="col-span-3">
                <span className="text-sm font-medium text-foreground">{slot.slot_label}</span>
                <span className="text-xs text-muted-foreground ml-2 font-mono">{slot.slot_name}</span>
              </div>
              <div className="col-span-3">
                <Input
                  className="bg-muted border-none font-mono text-sm"
                  placeholder="输入广告位ID"
                  value={slot.ad_slot_id || ''}
                  onChange={(e) => handleSlotChange(slot.id, 'ad_slot_id', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={String(slot.platform)}
                  onValueChange={(v) => handleSlotChange(slot.id, 'platform', Number(v))}
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
              <div className="col-span-2">
                {slot.enabled ? (
                  <Badge className="bg-success/10 text-success border-none hover:bg-success/10">已启用</Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border-none hover:bg-muted">已禁用</Badge>
                )}
              </div>
              <div className="col-span-2 flex justify-end">
                <Switch
                  checked={slot.enabled}
                  onCheckedChange={(v) => handleSlotChange(slot.id, 'enabled', v)}
                />
              </div>
            </div>
          ))}
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
        <p className="text-xs text-muted-foreground mb-3">
          接口地址：<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">/api/san/ad-config?app_id={app.package_name}</code>
        </p>
        <pre className="bg-foreground/5 rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto">
          {JSON.stringify(apiPreview, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
