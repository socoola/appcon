'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Settings, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface AppItem {
  id: string;
  name: string;
  package_name: string;
  media_id: string | null;
  account: string | null;
  external_app_id: string | null;
  level: number;
  status: string;
  total_slots: number;
  enabled_slots: number;
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

export default function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [levels, setLevels] = useState<AdLevel[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', package_name: '', media_id: '', account: '', external_app_id: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [editForm, setEditForm] = useState({ media_id: '', account: '', external_app_id: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchApps = useCallback(async () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/apps${params}`, { credentials: 'include' });
    const json = await res.json();
    setApps(json.data || []);
  }, [search]);

  const fetchLevels = useCallback(async () => {
    const res = await fetch('/api/levels', { credentials: 'include' });
    const json = await res.json();
    setLevels(json.data || []);
  }, []);

  useEffect(() => {
    fetchApps();
    fetchLevels();
  }, [fetchApps, fetchLevels]);

  const getLevelName = (levelNum: number) => {
    const found = levels.find((l) => l.level === levelNum);
    return found ? found.name : '';
  };

  const getLevelDescription = (levelNum: number) => {
    const found = levels.find((l) => l.level === levelNum);
    return found?.description || '';
  };

  const stripWhitespace = (s: string) => s.replace(/\s/g, '');

  const handleAdd = async () => {
    if (!addForm.name || !addForm.package_name) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm({ name: '', package_name: '', media_id: '', account: '', external_app_id: '' });
        fetchApps();
      } else {
        const json = await res.json();
        alert(json.error || '添加失败');
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该应用？此操作不可撤销。')) return;
    const res = await fetch(`/api/apps/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchApps();
    }
  };

  const openEditor = (app: AppItem) => {
    setEditingApp(app);
    setEditForm({
      media_id: app.media_id || '',
      account: app.account || '',
      external_app_id: app.external_app_id || '',
    });
  };

  const handleEditSave = async () => {
    if (!editingApp) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/apps/${editingApp.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_id: editForm.media_id.trim() || null,
          account: editForm.account.trim() || null,
          external_app_id: editForm.external_app_id.trim() || null,
        }),
      });

      if (res.ok) {
        setEditingApp(null);
        setEditForm({ media_id: '', account: '', external_app_id: '' });
        fetchApps();
      } else {
        const json = await res.json();
        alert(json.error || '更新失败');
      }
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">应用管理</h1>
        <p className="text-sm text-muted-foreground mt-1">按包名管理App广告配置</p>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索包名..."
            className="pl-9 bg-muted border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          添加应用
        </Button>
      </div>

      {/* 应用列表表格 */}
      <div className="hidden md:block bg-card rounded-lg shadow-card border-none overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">应用名称</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">包名</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">广告位</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">当前Level</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">穿山甲媒体ID</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">账号</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">App ID</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">状态</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  {search ? '未找到匹配的应用' : '暂无应用，点击上方按钮添加'}
                </td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app.id} className="border-b border-outline-variant/10 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{app.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{app.package_name}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">
                    <span className="text-primary font-medium">{app.enabled_slots}</span>
                    <span className="text-muted-foreground">/{app.total_slots}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <div className="text-foreground font-medium">Level {app.level}</div>
                    <div className="text-xs text-muted-foreground">{getLevelName(app.level)}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{getLevelDescription(app.level)}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono">{app.media_id || '-'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => openEditor(app)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{app.account || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{app.external_app_id || '-'}</td>
                  <td className="px-5 py-3.5">
                    {app.enabled_slots === app.total_slots && app.total_slots > 0 ? (
                      <Badge className="bg-success/10 text-success border-none hover:bg-success/10">已配置</Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning border-none hover:bg-warning/10">未配置</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/apps/${app.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary">
                          <Settings className="w-3.5 h-3.5" />
                          配置
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {apps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow-card">
            {search ? '未找到匹配的应用' : '暂无应用，点击上方按钮添加'}
          </div>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="bg-card rounded-lg p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-foreground">{app.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{app.package_name}</div>
                </div>
                {app.enabled_slots === app.total_slots && app.total_slots > 0 ? (
                  <Badge className="bg-success/10 text-success border-none shrink-0">已配置</Badge>
                ) : (
                  <Badge className="bg-warning/10 text-warning border-none shrink-0">未配置</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span>广告位 <span className="text-primary font-medium">{app.enabled_slots}</span>/{app.total_slots}</span>
                <span>Level {app.level} {getLevelName(app.level)}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono mb-1">
                媒体ID：{app.media_id || '-'}
              </div>
              {app.account && (
                <div className="text-xs text-muted-foreground font-mono mb-1">
                  账号：{app.account}
                </div>
              )}
              {app.external_app_id && (
                <div className="text-xs text-muted-foreground font-mono mb-3">
                  App ID：{app.external_app_id}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openEditor(app)}
                >
                  <Pencil className="w-3.5 h-3.5" /> 编辑
                </Button>
                <Link href={`/apps/${app.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> 配置
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(app.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加应用对话框 */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>添加新应用</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">应用名称</label>
              <Input
                placeholder="如：短视频"
                className="bg-muted border-none"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">包名</label>
              <Input
                placeholder="如：com.san.video"
                className="bg-muted border-none"
                value={addForm.package_name}
                onChange={(e) => setAddForm({ ...addForm, package_name: stripWhitespace(e.target.value) })
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">穿山甲媒体ID</label>
              <Input
                placeholder="如：5000546"
                className="bg-muted border-none"
                value={addForm.media_id}
                onChange={(e) => setAddForm({ ...addForm, media_id: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">账号</label>
              <Input
                placeholder="可选"
                className="bg-muted border-none"
                value={addForm.account}
                onChange={(e) => setAddForm({ ...addForm, account: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">App ID</label>
              <Input
                placeholder="可选"
                className="bg-muted border-none"
                value={addForm.external_app_id}
                onChange={(e) => setAddForm({ ...addForm, external_app_id: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={addLoading || !addForm.name || !addForm.package_name}>
              {addLoading ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingApp)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingApp(null);
            setEditForm({ media_id: '', account: '', external_app_id: '' });
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>编辑应用信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">应用名称</label>
              <div className="text-sm text-muted-foreground">{editingApp?.name}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">穿山甲媒体ID</label>
              <Input
                placeholder="如：5000546"
                className="bg-muted border-none"
                value={editForm.media_id}
                onChange={(e) => setEditForm({ ...editForm, media_id: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">账号</label>
              <Input
                placeholder="可选"
                className="bg-muted border-none"
                value={editForm.account}
                onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">App ID</label>
              <Input
                placeholder="可选"
                className="bg-muted border-none"
                value={editForm.external_app_id}
                onChange={(e) => setEditForm({ ...editForm, external_app_id: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingApp(null);
                setEditForm({ media_id: '', account: '', external_app_id: '' });
              }}
            >
              取消
            </Button>
            <Button onClick={handleEditSave} disabled={editLoading}>
              {editLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
