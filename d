04 · 파트 D — 프론트엔드 화면 담당


⚠️ 먼저 00_공통기반_먼저읽기.md를 코딩 AI에 넣은 뒤 이 파일을 넣으세요.
이 파일만 봐도 D 파트가 완성되도록 썼습니다.



담당 범위 한 줄

사용자가 실제로 보는 모든 화면. 애플 날씨 앱 오마주 배경 + 온보딩 3화면 + 홈 브리핑. 사용자가 보는 전부.

만들 파일


app/layout.tsx, app/page.tsx — 공통 레이아웃, 진입 분기
components/WeatherBackground.tsx — 날씨별 배경 테마 (핵심)
components/AIBriefingCard.tsx — 오늘의 추천 카드 (핵심)
components/HourlyForecastStrip.tsx — 시간대별 예보
components/BottomTabBar.tsx — 하단 탭 (MVP는 홈만 활성)
app/home/page.tsx — 홈 화면 조립



참고: 온보딩 3화면의 페이지 뼈대는 A가 만들고, D는 그 안의 UI/디자인을 다듬습니다. 협업 구간.




코딩 AI에 넣을 지시문 (복사해서 사용)

당신은 Next.js 14(App Router) + TypeScript + Tailwind 프로젝트에서
"프론트엔드 화면" 파트를 구현합니다. 애플 iOS 날씨 앱을 오마주한 감성이 목표입니다.

[디자인 전제]
- 모바일 우선. 콘텐츠 최대폭 480px, 화면 중앙 정렬.
- 날씨별 배경 테마 5가지(sky_theme): 배경색 + 가벼운 애니메이션.
  clear    하늘색 #7FB8E8  (해)
  cloudy   회청  #93AEC4  (구름 떠다님)
  overcast 회색  #8B95A0  (구름 여러개)
  rain     어두운청회 #55657A (빗방울 떨어짐)
  snow     밝은회청 #A9B4C2 (눈송이 내림)
- 애니메이션은 CSS transform/opacity만. 과하지 않게(구름 천천히, 빗방울 은은히).
- 친근한 존댓말 톤. 폰트 Pretendard(없으면 sans-serif).

[1] components/WeatherBackground.tsx
- props: skyTheme('clear'|'cloudy'|'overcast'|'rain'|'snow'), children.
- 전체화면 배경으로 해당 테마 색 + 애니메이션 요소(해/구름/빗방울/눈)를 깔고
  그 위에 children을 올림.

[2] components/AIBriefingCard.tsx  ← 이 앱의 핵심
- props: message(string), loading(boolean).
- 반투명 흰 카드에 "오늘의 추천" 라벨 + AI 문장 표시.
- 사용자가 푸시를 지워도 이 카드로 오늘 조언을 다시 볼 수 있음(핵심 가치).
- loading이면 스켈레톤.

[3] components/HourlyForecastStrip.tsx
- props: hours(배열: {time, icon, temp}).
- 가로 스크롤 시간대별 예보 스트립.

[4] components/BottomTabBar.tsx
- 홈/알림기록/설정 3탭. MVP는 홈만 활성(나머지는 비활성 회색).

[5] app/home/page.tsx (화면4 홈)
- localStorage의 user_id로 사용자 확인(없으면 /login 리다이렉트).
- 데이터 로드:
    · 지역+좌표: favorite_locations join regions (Supabase)
    · 오늘 날씨: GET /api/weather?nx=..&ny=.. (B가 만든 API)
    · 오늘 문구: push_logs에서 오늘자 message 조회. 없으면 GET /api/briefing로 즉석 생성.
- 화면 구성(위→아래): 지역·현재기온 헤더 → AIBriefingCard → HourlyForecastStrip → BottomTabBar.
- 배경: 날씨 판정의 sky_theme을 WeatherBackground에 전달.
- 상태: loading(스켈레톤) / loaded / error(마지막 저장분 표시 + 안내).
- 당겨서 새로고침(pull to refresh) 있으면 좋음(선택).

[6] app/page.tsx
- localStorage user_id 있으면 /home, 없으면 /login 으로 분기.

[요구]
- API·DB 아직 없을 때를 대비해, 각 데이터에 mock 기본값을 두고 UI가 먼저 보이게.
- 모든 컴포넌트 재사용 가능하게 props로 분리. 한국어 주석.
- 접근성: 이미지·아이콘 대체텍스트, 버튼 aria-label.


화면설계 요약 (근거: 기획서 v2 화면4 + 애플 날씨앱 스크린샷 + 목업)

홈 화면 컴포넌트 트리

WeatherBackground(skyTheme)
├─ LocationHeader (지역명, 현재기온, 날씨상태)
├─ AIBriefingCard (오늘의 추천 문장)   ← 푸시 지워도 여기서 재확인
├─ HourlyForecastStrip (시간대별)
└─ BottomTabBar (홈/알림기록/설정, MVP는 홈만)

상태표시loading스켈레톤loaded배경+카드+예보error마지막 저장분 + "최신 정보를 못 불러왔어요"

다른 파트와의 접점


A: favorite_locations/regions 조회, 세션(localStorage user_id).
B: GET /api/weather 로 판정·배경테마·시간대별 예보 수신.
C: push_logs에서 오늘 message 조회(핵심). 없으면 /api/briefing.


페르소나 검증 (나화진)

아침에 앱 열면 → 하늘 분위기 배경 + "우산 챙기세요" 카드가 바로 보임. 푸시 지웠어도 홈에서 재확인 가능.

산출물 확인 체크


 5가지 배경 테마가 각각 다르게 보인다
 AIBriefingCard에 오늘 문구가 뜬다(푸시 지워도)
 API 없어도 mock으로 화면이 먼저 보인다
