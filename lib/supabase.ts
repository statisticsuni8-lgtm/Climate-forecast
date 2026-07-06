import { createClient } from '@supabase/supabase-js';

// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
