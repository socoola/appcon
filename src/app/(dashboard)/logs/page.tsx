'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, FileText, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface LogEntry {
  id: string;
  request_id: string;
  app_id: string;
  channel: string | null;
  nonce: string | null;
  response_code: number;
  response_msg: string;
  level: number | null;
  slot_count: number;
  ip: string | null;
  user_agent: string | null;
  latency_ms: number | null;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total_24h: number;
  success_24h: number;
  fail_24h: number;
  avg_latency_ms: number;
}

const codeLabels: Record<number, { label: string; color: string }> = {
  10000: { label: '成功', color: 'text-green-600 bg-green-50' },
  40001: { label: '参数缺失', color: 'text-amber-600 bg-amber-50' },
  40002: { label: '参数无效', color: 'text-amber-600 bg-amber-50' },
  40003: { label: '请求过期', color: 'text-red-600 bg-red-50' },
  40004: { label: '应用不存在', color: 'text-red-600 bg-red-50' },
  50001: { label: '服务器错误', color: 'text-red-600 bg-red-50' },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<Stats>({ total_24h: 0, success_24h: 0, fail_24h: 0, avg_latency_ms: 0 });
  const [loading, setLoading] = useState(true);
  const [appIdFilter, setAppIdFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (appIdFilter) params.set('app_id', appIdFilter);
      if (codeFilter) params.set('code', codeFilter);

      const res = await fetch(`/api/logs?${params}`, { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      setLogs(json.data || []);
      setPagination(json.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 });
      setStats(json.stats || { total_24h: 0, success_24h: 0, fail_24h: 0, avg_latency_ms: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appIdFilter, codeFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => fetchLogs(pagination.page), 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchLogs, pagination.page]);

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const handleSearch = () => fetchLogs(1);
  const handlePageChange = (newPage: number) => fetchLogs(newPage);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">请求日志</h1>
        <p className="text-sm text-muted-foreground mt-1">ad-config 接口请求记录，数据保留 24 小时</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-outline-variant/20 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Activity className="w-4 h-4" />24h 请求量
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total_24h}</div>
        </div>
        <div className="bg-card rounded-xl border border-outline-variant/20 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />24h 成功
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.success_24h}</div>
        </div>
        <div className="bg-card rounded-xl border border-outline-variant/20 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <XCircle className="w-4 h-4 text-red-500" />24h 失败
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.fail_24h}</div>
        </div>
        <div className="bg-card rounded-xl border border-outline-variant/20 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" />平均耗时
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.avg_latency_ms}<span className="text-sm font-normal text-muted-foreground ml-1">ms</span></div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 bg-card rounded-xl border border-outline-variant/20 p-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="按包名搜索..."
            value={appIdFilter}
            onChange={(e) => setAppIdFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-muted border-none rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
          />
        </div>
        <select
          value={codeFilter}
          onChange={(e) => setCodeFilter(e.target.value)}
          className="bg-muted border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">全部状态</option>
          <option value="10000">成功 (10000)</option>
          <option value="40001">参数缺失 (40001)</option>
          <option value="40002">参数无效 (40002)</option>
          <option value="40003">请求过期 (40003)</option>
          <option value="40004">应用不存在 (40004)</option>
          <option value="50001">服务器错误 (50001)</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          搜索
        </button>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          自动刷新
        </label>
      </div>

      {/* 日志表格 */}
      <div className="bg-card rounded-xl border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">时间</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">包名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">渠道</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">广告位数</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">耗时</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">消息</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    暂无日志记录
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const codeInfo = codeLabels[log.response_code] || { label: String(log.response_code), color: 'text-gray-600 bg-gray-50' };
                  return (
                    <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatTime(log.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.app_id}</td>
                      <td className="px-4 py-3">{log.channel || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${codeInfo.color}`}>
                          {codeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{log.level !== null ? log.level : '-'}</td>
                      <td className="px-4 py-3">{log.slot_count}</td>
                      <td className="px-4 py-3">
                        <span className={`${(log.latency_ms ?? 0) > 500 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {log.latency_ms ?? '-'}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.ip || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate" title={log.response_msg}>{log.response_msg}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/20">
            <span className="text-sm text-muted-foreground">
              共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-outline-variant/20 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-outline-variant/20 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
