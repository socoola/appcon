import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/stats - 获取仪表盘统计数据
export async function GET() {
  const client = getSupabaseClient();

  const [appsResult, slotsResult, levelsResult] = await Promise.all([
    client.from('apps').select('*', { count: 'exact', head: true }),
    client.from('ad_slots').select('*', { count: 'exact', head: true }),
    client.from('ad_levels').select('*', { count: 'exact', head: true }).eq('is_default', false),
  ]);

  // 广告位类型分布
  const { data: slotDistribution } = await client
    .from('ad_slots')
    .select('slot_name');

  const distribution: Record<string, number> = {};
  (slotDistribution || []).forEach((slot: { slot_name: string }) => {
    distribution[slot.slot_name] = (distribution[slot.slot_name] || 0) + 1;
  });

  return NextResponse.json({
    data: {
      app_count: appsResult.count || 0,
      slot_count: slotsResult.count || 0,
      level_count: levelsResult.count || 0,
      slot_distribution: distribution,
    },
  });
}
