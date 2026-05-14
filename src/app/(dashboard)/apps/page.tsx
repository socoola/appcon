'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Settings, Trash2 } from 'lucide-react';
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
  level: number;
  status: string;
  total_slots: number;
  enabled_slots: number;
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', package_name: '', media_id: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchApps = useCallback(async () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/apps${params}`, { credentials: 'include' });
    const json = await res.json();
    setApps(json.data || []);
  }, [search]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

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
        setAddForm({ name: '', package_name: '', media_id: '' });
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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">应用管理</h1>
        <p className="text-sm text-muted-foreground mt-1">按包名管理App广告配置</p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索包名..."
            className="pl-9 bg-muted border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          添加应用
        </Button>
      </div>

      {/* 应用列表表格 */}
      <div className="bg-card rounded-lg shadow-card border-none overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">应用名称</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">包名</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">广告位</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">当前Level</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">穿山甲媒体ID</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">状态</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
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
                  <td className="px-5 py-3.5 text-sm text-foreground">Level {app.level}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{app.media_id || '-'}</td>
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

      {/* 添加应用对话框 */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
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
                onChange={(e) => setAddForm({ ...addForm, package_name: e.target.value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={addLoading || !addForm.name || !addForm.package_name}>
              {addLoading ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
