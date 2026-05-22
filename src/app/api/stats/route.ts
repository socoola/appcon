import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/stats - 获取仪表盘统计数据
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  const appIdsResult = userRole === 'admin'
    ? null
    : await client.from('apps').select('id').eq('owner_user_id', userId || '');

  if (appIdsResult?.error) {
    return NextResponse.json({ error: appIdsResult.error.message }, { status: 500 });
  }

  const appIds = (appIdsResult?.data || []).map((app: { id: string }) => app.id);

  let appsCountQuery = client.from('apps').select('*', { count: 'exact', head: true });
  let slotsCountQuery = client.from('ad_slots').select('*', { count: 'exact', head: true });
  let slotDistributionQuery = client.from('ad_slots').select('slot_name');
  const levelsCountQuery = userRole === 'admin'
    ? client.from('ad_levels').select('*', { count: 'exact', head: true }).eq('is_default', false)
    : null;

  if (userRole !== 'admin') {
    appsCountQuery = appsCountQuery.eq('owner_user_id', userId || '');
    slotsCountQuery = appIds.length > 0 ? slotsCountQuery.in('app_id', appIds) : slotsCountQuery.eq('app_id', '__none__');
    slotDistributionQuery = appIds.length > 0 ? slotDistributionQuery.in('app_id', appIds) : slotDistributionQuery.eq('app_id', '__none__');
  }

  const [appsResult, slotsResult, levelsResult, slotDistributionResult] = await Promise.all([
    appsCountQuery,
    slotsCountQuery,
    levelsCountQuery,
    slotDistributionQuery,
  ]);

  if (appsResult.error || slotsResult.error || levelsResult?.error || slotDistributionResult.error) {
    return NextResponse.json({ error: '查询统计失败' }, { status: 500 });
  }

  const distribution: Record<string, number> = {};
  (slotDistributionResult.data || []).forEach((slot: { slot_name: string }) => {
    distribution[slot.slot_name] = (distribution[slot.slot_name] || 0) + 1;
  });

  return NextResponse.json({
    data: {
      app_count: appsResult.count || 0,
      slot_count: slotsResult.count || 0,
      level_count: levelsResult?.count || 0,
      slot_distribution: distribution,
    },
  });
}
