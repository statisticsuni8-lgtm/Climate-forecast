-- 오늘 챙길 것 체크리스트 상태 테이블 추가 (supabase/schema.sql 참고)
create table if not exists checklist_status (
  user_id       uuid references users(user_id) on delete cascade,
  date          date not null,
  checked_items text[] not null default '{}',
  updated_at    timestamptz default now(),
  primary key (user_id, date)
);
