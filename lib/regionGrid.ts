import { supabase } from './supabase';
import type { Region } from './types';

// 지역명 키워드로 regions 테이블을 검색해 자동완성 목록을 반환
export async function searchRegions(keyword: string): Promise<Region[]> {
  if (!keyword.trim()) return [];

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .ilike('region_name', `%${keyword}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

// region_id로 기상청 단기예보 호출에 필요한 격자 좌표(nx, ny)를 조회
export async function getGrid(regionId: number): Promise<{ nx: number; ny: number } | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('nx, ny')
    .eq('region_id', regionId)
    .single();

  if (error) throw error;
  return data;
}
