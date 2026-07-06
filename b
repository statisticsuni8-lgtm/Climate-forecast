02 · 파트 B — 기상청 연동·날씨 판정 담당


⚠️ 먼저 00_공통기반_먼저읽기.md를 코딩 AI에 넣은 뒤 이 파일을 넣으세요.
이 파일만 봐도 B 파트가 완성되도록 썼습니다.



담당 범위 한 줄

기상청 단기예보 API를 호출하고, 응답을 3축(강수·기온·습도바람)으로 판정하는 로직. 날씨 판정기.

만들 파일


lib/weather.ts — 기상청 호출 + 파싱 + 3축 판정
app/api/weather/route.ts — nx,ny 받아 오늘 판정 결과 반환하는 API



기상청 API 핵심 정보 (근거: 대화에서 확인한 단기예보 스펙)


API: 기상청 단기예보 조회서비스 getVilageFcst (공공데이터포털)
입력: nx, ny(격자좌표), base_date, base_time
발표시각: 02,05,08,11,14,17,20,23시. 아침 알림은 05시 또는 08시 발표분 사용.
쓸 항목:
코드의미용도PTY강수형태강수 축 (0없음/1비/2비눈/3눈/4소나기)SKY하늘상태배경 테마 (1맑음/3구름많음/4흐림)TMP1시간 기온현재 기온 표시TMX일 최고기온기온 축(더위)TMN일 최저기온기온 축(추위)POP강수확률문장 참고REH습도습도 축WSD풍속바람 축


결측치: 값이 900 이상 또는 −900 이하이면 결측 처리.



코딩 AI에 넣을 지시문 (복사해서 사용)

당신은 Next.js 14 + TypeScript 프로젝트에서 "기상청 날씨 연동·판정" 파트를 구현합니다.

[전제]
- 환경변수 KMA_API_KEY (공공데이터포털 단기예보 조회서비스 키).
- 입력으로 nx, ny(정수 격자좌표)를 받습니다.

[1] lib/weather.ts
- fetchTodayForecast(nx, ny): 기상청 getVilageFcst 호출.
  - base_date/base_time은 현재 시각 기준 가장 최근 발표분(05 또는 08시 우선) 계산.
  - 오늘 날짜의 시간대별 예보 항목(PTY,SKY,TMP,TMX,TMN,POP,REH,WSD)을 파싱.
  - 값이 900 이상 또는 -900 이하이면 null(결측) 처리.
- classifyWeather(forecast): 아래 3축으로 판정한 객체를 반환.
    rain_axis:  PTY가 시간대 중 하나라도 있으면 rain/snow/sleet/shower, 없으면 none
    temp_axis:  hot(TMX>=28) / cold(TMN<=5) / swing((TMX-TMN)>=10) / normal
                (우선순위: swing이 hot·cold와 겹치면 함께 표기 가능하도록 배열도 허용)
    humid_axis: humid(REH>=80) / windy(WSD>=9) / normal
    sky_theme:  강수 있으면 rain 또는 snow, 없으면 SKY로 clear/cloudy/overcast
  - raw_summary: { tmp, tmx, tmn, reh, wsd, pop, rainStartHour } 형태로 요약.
    rainStartHour: 비가 시작되는 첫 시각(없으면 null). "오후 2시부터 비" 문장에 사용.

[2] app/api/weather/route.ts
- GET ?nx=..&ny=.. 로 호출하면 { forecast, classification } JSON 반환.
- 기상청 호출 실패 시 502와 에러 메시지.

[요구]
- 판정 기준 숫자(28, 5, 10, 80, 9)는 상수로 상단에 모아 쉽게 조정 가능하게.
- 모든 함수에 한국어 주석. 파싱 예외·결측 처리 꼼꼼히.
- 테스트용 mockForecast()도 함께 제공(다른 팀원이 API 키 없이 UI 개발 가능하도록).


3축 판정 규칙 (00번 5장과 동일 · 여기 다시 명시)

축항목판정값기준강수PTYnone/rain/snow/sleet/shower0없음,1비,2비눈,3눈,4소나기기온TMX,TMNnormal/hot/cold/swinghot≥28, cold≤5, swing차이≥10습도·바람REH,WSDnormal/humid/windyhumid≥80, windy≥9배경(sky_theme)PTY+SKYclear/cloudy/overcast/rain/snow강수 우선, 없으면 SKY

다른 파트와의 접점


A: getGrid(regionId)가 준 nx,ny를 입력으로 받음.
C: classifyWeather 결과 + raw_summary를 Gemini 프롬프트 재료로 넘김. weather_logs 저장은 C(스케줄러)가 담당하되, 판정 함수는 B 제공.
D: 홈 화면의 현재기온·시간대별 예보·배경 테마가 이 판정 결과를 사용.


산출물 확인 체크


 nx,ny 넣으면 오늘 3축 판정 + 배경 테마가 나온다
 결측치(900↑/−900↓) 안전 처리
 mockForecast()로 키 없이도 테스트 가능
