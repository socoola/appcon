'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemSetting {
  key: string;
  value: string;
  updated_at: string | null;
}

interface SettingDef {
  key: string;
  label: string;
  description: string;
  placeholder?: string;
}

const SETTINGS: SettingDef[] = [
  {
    key: 'default_report_url',
    label: '默认上报地址（default_report_url）',
    description:
      '应用详情页 V2 配置卡片的 report_url 输入框旁的「使用默认值」按钮会读取本值。留空则按钮不可用。',
    placeholder: '如 https://report.example.com/x',
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error || '加载失败');
        return;
      }
      const json = await res.json();
      const map: Record<string, string> = {};
      for (const item of (json.data || []) as SystemSetting[]) {
        map[item.key] = item.value;
      }
      // 初始化已知键,DB 没有的用空字符串
      const merged: Record<string, string> = {};
      for (const def of SETTINGS) {
        merged[def.key] = map[def.key] ?? '';
      }
      setValues(merged);
      setOriginal(merged);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] ?? '' }),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json.error || '保存失败');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSettings();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: original[key] ?? '' }));
    setErrorMsg('');
  };

  const isDirty = (key: string) => (values[key] ?? '') !== (original[key] ?? '');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          集中维护系统级默认值(仅管理员可修改)
        </p>
      </div>

      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md px-4 py-3">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <Card className="p-5 shadow-card border-none">
          <p className="text-sm text-muted-foreground">加载中...</p>
        </Card>
      ) : (
        SETTINGS.map((def) => (
          <Card key={def.key} className="p-5 shadow-card border-none">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {def.label}
                  </h2>
                  {isDirty(def.key) && (
                    <Badge className="bg-warning/10 text-warning border-none hover:bg-warning/10">
                      未保存
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {def.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                className="bg-muted border-none font-mono text-sm"
                placeholder={def.placeholder ?? ''}
                value={values[def.key] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [def.key]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(def.key)}
                  disabled={saving || !isDirty(def.key)}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReset(def.key)}
                  disabled={!isDirty(def.key)}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
              </div>
            </div>
            {saved && (
              <p className="text-sm text-success mt-3">设置已保存</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}