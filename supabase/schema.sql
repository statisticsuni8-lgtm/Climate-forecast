-- 사용자
create table if not exists users (
  user_id     uuid primary key default gen_random_uuid(),
  phone       text unique not null,
  name        text not null,
  created_at  timestamptz default now()
);

-- 지역-좌표 매핑 (기상청 격자 좌표. 시드 데이터로 미리 채움)
create table if not exists regions (
  region_id    serial primary key,
  region_name  text not null,          -- 예: "서울특별시 강남구"
  nx           int not null,
  ny           int not null
);

-- 사용자 선호(즐겨찾기) 지역
create table if not exists favorite_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(user_id) on delete cascade,
  region_id   int references regions(region_id),
  label       text,                    -- "집", "회사" 등 (선택)
  created_at  timestamptz default now()
);

-- 사용자 알림 설정
create table if not exists user_settings (
  user_id       uuid primary key references users(user_id) on delete cascade,
  push_time     text default '07:00',  -- "HH:MM"
  weekdays      int[] default '{1,2,3,4,5}', -- 0=일 ~ 6=토
  push_enabled  boolean default true
);

-- 일별 날씨 기록 (축별 판정 결과 저장, 어제와 비교용)
create table if not exists weather_logs (
  id          uuid primary key default gen_random_uuid(),
  region_id   int references regions(region_id),
  date        date not null,
  rain_axis   text,   -- none/rain/snow/sleet/shower
  temp_axis   text,   -- normal/hot/cold/swing
  humid_axis  text,   -- normal/humid/windy
  sky_theme   text,   -- clear/cloudy/overcast/rain/snow (배경용)
  raw_summary jsonb,  -- 원본 요약(기온·습도 등)
  unique (region_id, date)
);

-- 푸시 발송 이력 (홈 재확인 + 기록용)
create table if not exists push_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references users(user_id) on delete cascade,
  date      date not null,
  message   text not null,
  sent_at   timestamptz default now(),
  unique (user_id, date)
);

-- 오늘 챙길 것 체크리스트 상태 (담당 C, 홈 화면 차별화 기능)
-- 항목 목록 자체는 저장하지 않고 lib/checklist.ts에서 그날 판정으로 매번 파생시킨다.
-- 여기엔 사용자가 "체크했다"는 상태(checked_items의 item id 목록)만 저장한다.
create table if not exists checklist_status (
  user_id       uuid references users(user_id) on delete cascade,
  date          date not null,
  checked_items text[] not null default '{}',
  updated_at    timestamptz default now(),
  primary key (user_id, date)
);

-- regions 시드 데이터 (MVP는 우선 5~10개만, 전국 확장은 2차)
-- ⚠️ 아래 nx,ny는 예시값입니다. 실제 값은 기상청 공식 격자 좌표 엑셀에서 확인해 교체하세요.
insert into regions (region_name, nx, ny) values
  ('서울특별시 강남구', 61, 126),
  ('서울특별시 종로구', 60, 127),
  ('인천광역시 남동구', 54, 124),
  ('경기도 성남시 분당구', 62, 123),
  ('부산광역시 해운대구', 99, 75)
on conflict do nothing;
