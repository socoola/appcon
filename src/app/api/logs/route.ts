import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/logs?page=1&pageSize=20&app_id=&code=&startDate=&endDate=
export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role');
  if (userRole !== 'admin') {
    return NextResponse.json({ error: '仅管理员可访问' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const appIdFilter = searchParams.get('app_id') || '';
  const codeFilter = searchParams.get('code') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const client = getSupabaseClient();

  // 构建查询
  let query = client
    .from('ad_config_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (appIdFilter) {
    query = query.eq('app_id', appIdFilter);
  }
  if (codeFilter) {
    query = query.eq('response_code', parseInt(codeFilter, 10));
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: '查询日志失败', detail: error.message }, { status: 500 });
  }

  // 获取统计数据
  const { data: statsData } = await client
    .from('ad_config_logs')
    .select('response_code, latency_ms')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const totalRequests24h = statsData?.length ?? 0;
  const successCount = statsData?.filter((r: { response_code: number }) => r.response_code === 10000).length ?? 0;
  const failCount = totalRequests24h - successCount;
  const avgLatency = totalRequests24h > 0
    ? Math.round(statsData!.reduce((sum: number, r: { latency_ms: number | null }) => sum + (r.latency_ms || 0), 0) / totalRequests24h)
    : 0;

  return NextResponse.json({
    data: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
    stats: {
      total_24h: totalRequests24h,
      success_24h: successCount,
      fail_24h: failCount,
      avg_latency_ms: avgLatency,
    },
  });
}
