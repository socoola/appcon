'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, RotateCcw, Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

const slotFields = [
  { key: 'open_screen' as const, label: '开屏广告' },
  { key: 'banner' as const, label: 'Banner广告' },
  { key: 'incentive_video' as const, label: '激励视频' },
  { key: 'insert_full_screen' as const, label: '插屏全屏' },
];

export default function LevelsPage() {
  const [levels, setLevels] = useState<AdLevel[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [original, setOriginal] = useState<AdLevel[]>([]);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLevels = useCallback(async () => {
    const res = await fetch('/api/levels', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await res.json();
    setLevels(json.data || []);
    setOriginal(json.data || []);
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleFieldChange = (id: string, field: string, value: unknown) => {
    setLevels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleDefaultChange = (id: string) => {
    setLevels((prev) =>
      prev.map((l) => ({ ...l, is_default: l.id === id }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/levels', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levels: levels.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description,
            is_default: l.is_default,
            open_screen: l.open_screen,
            banner: l.banner,
            incentive_video: l.incentive_video,
            insert_full_screen: l.insert_full_screen,
          })),
        }),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || '保存失败');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchLevels();
    } catch {
      setErrorMsg('网络错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLevels([...original]);
    setErrorMsg('');
  };

  const handleAdd = async () => {
    setAdding(true);
    setErrorMsg('');
    try {
      // 计算下一个level编号
      const maxLevel = levels.length > 0 ? Math.max(...levels.map((l) => l.level)) : -1;
      const nextLevel = maxLevel + 1;

      const res = await fetch('/api/levels', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: nextLevel,
          name: `Level ${nextLevel}`,
          description: '',
          open_screen: false,
          banner: false,
          incentive_video: false,
          insert_full_screen: false,
        }),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || '添加失败');
        return;
      }
      fetchLevels();
    } catch {
      setErrorMsg('网络错误，请重试');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const levelItem = levels.find((l) => l.id === id);
    if (!levelItem) return;

    if (!confirm(`确定删除 Level ${levelItem.level}（${levelItem.name}）吗？`)) return;

    setDeleting(id);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/levels?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || '删除失败');
        return;
      }
      fetchLevels();
    } catch {
      setErrorMsg('网络错误，请重试');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">等级管理</h1>
          <p className="text-sm text-muted-foreground mt-1">配置每个等级包含的广告位类型</p>
        </div>
        <Button onClick={handleAdd} disabled={adding} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          {adding ? '添加中...' : '添加等级'}
        </Button>
      </div>

      {/* 说明卡片 */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          等级越高，展示的广告位越多。客户端通过API返回的 <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">level</code> 字段控制广告展示策略。
        </div>
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {errorMsg}
        </div>
      )}

      {/* 等级配置列表 */}
      <div className="space-y-4">
        {levels.map((levelItem) => {
          return (
            <Card
              key={levelItem.id}
              className={`p-5 shadow-card border-none ${levelItem.is_default ? 'ring-2 ring-primary/20' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                {/* 左侧：等级信息 */}
                <div className="w-48 shrink-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">Level {levelItem.level}</span>
                    {levelItem.is_default && (
                      <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/10">默认</Badge>
                    )}
                  </div>
                  <Input
                    className="bg-muted border-none text-sm"
                    value={levelItem.name}
                    onChange={(e) => handleFieldChange(levelItem.id, 'name', e.target.value)}
                  />
                  <Input
                    className="bg-muted border-none text-xs text-muted-foreground"
                    placeholder="等级说明"
                    value={levelItem.description || ''}
                    onChange={(e) => handleFieldChange(levelItem.id, 'description', e.target.value)}
                  />
                </div>

                {/* 右侧：广告位开关 */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {slotFields.map((slot) => (
                      <div
                        key={slot.key}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          levelItem[slot.key]
                            ? 'bg-success/5'
                            : 'bg-muted/30'
                        }`}
                      >
                        <span className={`text-sm ${levelItem[slot.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {slot.label}
                        </span>
                        <Switch
                          checked={levelItem[slot.key]}
                          onCheckedChange={(v) => handleFieldChange(levelItem.id, slot.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作区：设为默认 + 删除 */}
                <div className="w-full lg:w-32 shrink-0 flex flex-row lg:flex-col items-center justify-center lg:items-center gap-2 mt-3 lg:mt-0">
                  <Button
                    variant={levelItem.is_default ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDefaultChange(levelItem.id)}
                    className={levelItem.is_default ? '' : 'text-muted-foreground'}
                  >
                    {levelItem.is_default ? '默认' : '设为默认'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(levelItem.id)}
                    disabled={deleting === levelItem.id}
                    className="text-muted-foreground hover:text-destructive gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting === levelItem.id ? '删除中...' : '删除'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {levels.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>暂无等级配置</p>
          <Button onClick={handleAdd} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            添加第一个等级
          </Button>
        </div>
      )}

      {/* 底部操作 */}
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
  );
}
