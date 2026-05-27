'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Smartphone, Settings, Layers, Activity, Plus, ArrowRight } from 'lucide-react';

interface Stats {
  app_count: number;
  slot_count: number;
  level_count: number;
  slot_distribution: Record<string, number>;
}

interface AuthInfo {
  role: string;
}

const slotNameMap: Record<string, string> = {
  openScreenId: '开屏广告',
  bannerId: 'Banner广告',
  IncentiveVideoId: '激励视频',
  newInsertFullScreenId: '插屏全屏',
};

const slotColorMap: Record<string, string> = {
  openScreenId: 'bg-primary',
  bannerId: 'bg-success',
  IncentiveVideoId: 'bg-warning',
  newInsertFullScreenId: 'bg-chart-4',
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<AuthInfo | null>(null);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});

    fetch('/api/stats', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) { window.location.href = '/login'; return null; }
        return res.json();
      })
      .then((res) => { if (res) setStats(res.data); })
      .catch(() => {});

    fetch('/api/version', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => { if (res?.commit) setVersion(res.commit); })
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: '应用总数',
      value: stats?.app_count ?? '-',
      icon: Smartphone,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: '广告位配置数',
      value: stats?.slot_count ?? '-',
      icon: Settings,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: user?.role === 'admin' ? '等级配置数' : '可见等级',
      value: (stats?.level_count ?? 0) + 1,
      icon: Layers,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: '广告位类型',
      value: Object.keys(stats?.slot_distribution || {}).length || '-',
      icon: Activity,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ];

  const totalSlots = stats?.slot_count || 0;
  const distribution = stats?.slot_distribution || {};
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        <p className="text-sm text-muted-foreground mt-1">App广告配置管理总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-lg p-5 shadow-card border-none"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* 下方区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* 广告位类型分布 */}
        <div className="col-span-3 bg-card rounded-lg p-5 shadow-card border-none">
          <h2 className="text-base font-semibold text-foreground mb-4">广告位类型分布</h2>
          <div className="space-y-4">
            {Object.entries(distribution).map(([key, count]) => {
              const percent = totalSlots > 0 ? ((count / totalSlots) * 100).toFixed(1) : '0';
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{slotNameMap[key] || key}</span>
                    <span className="text-sm text-muted-foreground">{count}个 ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${slotColorMap[key] || 'bg-primary'} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="col-span-2 bg-card rounded-lg p-5 shadow-card border-none">
          <h2 className="text-base font-semibold text-foreground mb-4">快速操作</h2>
          <div className="space-y-3">
            <Link
              href="/apps"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">添加新应用</div>
                  <div className="text-xs text-muted-foreground">配置新App的广告位</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            {isAdmin && (
              <Link
                href="/levels"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">配置Level</div>
                    <div className="text-xs text-muted-foreground">管理广告等级策略</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}

            <Link
              href="/apps"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">管理广告位</div>
                  <div className="text-xs text-muted-foreground">编辑广告位配置</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* 版本信息 */}
      {version && (
        <div className="flex justify-end">
          <a
            href={`https://github.com/socoola/appcon/commit/${version}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            版本 {version}
          </a>
        </div>
      )}
    </div>
  );
}
