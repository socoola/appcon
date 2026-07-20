'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Settings, Trash2, Pencil, Loader2 } from 'lucide-react';
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
import { useInView } from '@/hooks/use-in-view';

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

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 20;
const EMPTY_PAGINATION: Pagination = {
  page: 0,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

type FetchMode = 'replace' | 'append';

export default function AppsPage() {
  const router = useRouter();

  // 数据状态
  const [apps, setApps] = useState<AppItem[]>([]);
  const [levels, setLevels] = useState<AdLevel[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 搜索：输入 vs 已应用
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // 增删改 dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', package_name: '', media_id: '', account: '', external_app_id: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [editForm, setEditForm] = useState({ media_id: '', account: '', external_app_id: '' });
  const [editLoading, setEditLoading] = useState(false);

  // 请求代次 + 同步锁
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // 已加载是否还有下一页
  const hasMore =
    pagination.page > 0 && pagination.page < pagination.totalPages;

  // 统一的分页请求：replace 用于 page=1 / 搜索 / 增删后;append 用于滚动加载下一页
  const fetchAppsPage = useCallback(
    async (
      page: number,
      mode: FetchMode,
      searchTerm: string,
    ): Promise<void> => {
      if (mode === 'append' && loadingMoreRef.current) return;

      const requestId = ++requestIdRef.current;

      // replace 模式取消上一请求
      if (mode === 'replace' && abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      if (mode === 'replace') {
        setInitialLoading(true);
        setLoadError(null);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (searchTerm) params.set('search', searchTerm);

        const res = await fetch(`/api/apps?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `请求失败 (${res.status})`);
        }

        const json = await res.json();
        // 过期响应忽略
        if (requestId !== requestIdRef.current) return;

        const items: AppItem[] = json.data || [];
        const nextPagination: Pagination = json.pagination ?? {
          page,
          pageSize: PAGE_SIZE,
          total: items.length,
          totalPages: page,
        };

        if (mode === 'replace') {
          setApps(items);
        } else {
          setApps((prev) => {
            const seen = new Set(prev.map((a) => a.id));
            return [...prev, ...items.filter((a) => !seen.has(a.id))];
          });
        }
        setPagination(nextPagination);
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        const msg = e instanceof Error ? e.message : '请求失败';
        // 用户主动取消不算错误
        if (/abort/i.test(msg)) return;
        setLoadError(msg);
      } finally {
        if (requestId === requestIdRef.current) {
          if (mode === 'replace') {
            setInitialLoading(false);
          } else {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }
        }
      }
    },
    [router],
  );

  const fetchLevels = useCallback(async () => {
    const res = await fetch('/api/levels', { credentials: 'include' });
    const json = await res.json();
    setLevels(json.data || []);
  }, []);

  // 初始化：拉 levels
  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // 搜索变化 → 重新加载 page 1
  useEffect(() => {
    void fetchAppsPage(1, 'replace', appliedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch]);

  // 卸载清理
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // 滚动哨兵
  const { ref: sentinelRef, inView } = useInView<HTMLDivElement>({
    enabled: hasMore && !initialLoading && !loadingMore && !loadError,
    rootMargin: '200px 0px',
    threshold: 0,
  });

  useEffect(() => {
    if (!inView || !hasMore || initialLoading || loadingMore) return;
    void fetchAppsPage(pagination.page + 1, 'append', appliedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const applySearch = () => {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      // 搜索词未变,强制刷新一次
      void fetchAppsPage(1, 'replace', next);
      return;
    }
    setAppliedSearch(next);
  };

  const getLevelName = (levelNum: number) => {
    const found = levels.find((l) => l.level === levelNum);
    return found ? found.name : '';
  };

  const getLevelDescription = (levelNum: number) => {
    const found = levels.find((l) => l.level === levelNum);
    return found?.description || '';
  };

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
        // 清空搜索,确保新 app 可见,然后刷 page 1
        if (searchInput || appliedSearch) {
          setSearchInput('');
          setAppliedSearch('');
        } else {
          void fetchAppsPage(1, 'replace', '');
        }
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || '添加失败');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加失败');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该应用？此操作不可撤销。')) return;
    // 记录滚动位置,后面恢复
    const previousScrollY = window.scrollY;

    // 乐观移除 + 减 total
    setApps((prev) => prev.filter((a) => a.id !== id));
    setPagination((prev) => {
      const nextTotal = Math.max(0, prev.total - 1);
      return {
        ...prev,
        total: nextTotal,
        totalPages: Math.ceil(nextTotal / prev.pageSize),
      };
    });

    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || '删除失败');
        // 回滚：触发 page 1 刷新拿真实数据
        void fetchAppsPage(1, 'replace', appliedSearch);
        return;
      }
      // 权威刷新 page 1,完成后恢复滚动位置
      void (async () => {
        await fetchAppsPage(1, 'replace', appliedSearch);
        requestAnimationFrame(() => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({
            top: Math.min(previousScrollY, Math.max(0, max)),
            behavior: 'auto',
          });
        });
      })();
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
      void fetchAppsPage(1, 'replace', appliedSearch);
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
        // 就地更新 3 个字段,保留滚动位置 + 已加载页
        const updatedMediaId = editForm.media_id.trim() || null;
        const updatedAccount = editForm.account.trim() || null;
        const updatedExternalAppId = editForm.external_app_id.trim() || null;
        setApps((prev) =>
          prev.map((a) =>
            a.id === editingApp.id
              ? {
                  ...a,
                  media_id: updatedMediaId,
                  account: updatedAccount,
                  external_app_id: updatedExternalAppId,
                }
              : a,
          ),
        );
        setEditingApp(null);
        setEditForm({ media_id: '', account: '', external_app_id: '' });
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || '更新失败');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const retry = () => {
    setLoadError(null);
    void fetchAppsPage(pagination.page > 0 ? pagination.page : 1, 'append', appliedSearch);
  };

  // 共用的 table row 渲染（桌面 + 移动卡片复用,避免重复逻辑）
  const renderRows = () =>
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
    ));

  const renderMobileCards = () =>
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
    ));

  const showEmpty = !initialLoading && !loadError && apps.length === 0;
  const showInitialError = initialLoading && loadError && apps.length === 0;
  const showInitialSkeleton = initialLoading && apps.length === 0 && !loadError;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">应用管理</h1>
        <p className="text-sm text-muted-foreground mt-1">按包名管理App广告配置</p>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索应用名称或包名..."
              className="pl-9 bg-muted border-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>
          <Button variant="outline" onClick={applySearch} disabled={initialLoading}>
            搜索
          </Button>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          添加应用
        </Button>
      </div>

      {/* 应用列表表格 - 桌面 */}
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
            {showInitialSkeleton ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    加载中...
                  </span>
                </td>
              </tr>
            ) : showInitialError ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-destructive">
                  <div className="space-y-2">
                    <div>加载失败：{loadError}</div>
                    <Button size="sm" variant="outline" onClick={retry}>
                      重试
                    </Button>
                  </div>
                </td>
              </tr>
            ) : showEmpty ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  {appliedSearch ? '未找到匹配的应用' : '暂无应用，点击上方按钮添加'}
                </td>
              </tr>
            ) : (
              renderRows()
            )}
          </tbody>
        </table>
      </div>

      {/* 移动卡片 */}
      <div className="md:hidden space-y-3">
        {showInitialSkeleton ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow-card">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载中...
            </span>
          </div>
        ) : showInitialError ? (
          <div className="text-center py-12 text-destructive bg-card rounded-lg shadow-card">
            <div className="space-y-2">
              <div>加载失败：{loadError}</div>
              <Button size="sm" variant="outline" onClick={retry}>重试</Button>
            </div>
          </div>
        ) : showEmpty ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow-card">
            {appliedSearch ? '未找到匹配的应用' : '暂无应用，点击上方按钮添加'}
          </div>
        ) : (
          renderMobileCards()
        )}
      </div>

      {/* 滚动哨兵：放在桌面表格 + 移动卡片之后（单一 observer） */}
      {apps.length > 0 && (
        <div
          ref={hasMore ? sentinelRef : undefined}
          className="flex min-h-12 items-center justify-center"
          aria-live="polite"
        >
          {loadingMore ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载更多...
            </span>
          ) : loadError ? (
            <span className="inline-flex items-center gap-3 text-sm text-destructive">
              <span>加载失败：{loadError}</span>
              <Button size="sm" variant="outline" onClick={retry}>重试</Button>
            </span>
          ) : hasMore ? (
            <span className="sr-only">滚动以加载更多应用</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              已加载全部 {pagination.total} 个应用
            </span>
          )}
        </div>
      )}

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