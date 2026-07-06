// 공통 데이터 타입 정의 (Supabase 테이블과 1:1 대응)

export interface User {
  user_id: string;
  phone: string;
  name: string;
  created_at?: string;
}

export interface Region {
  region_id: number;
  region_name: string;
  nx: number;
  ny: number;
}

export interface FavoriteLocation {
  id: string;
  user_id: string;
  region_id: number;
  label?: string | null;
  created_at?: string;
}

export interface UserSettings {
  user_id: string;
  push_time: string;
  weekdays: number[];
  push_enabled: boolean;
}
