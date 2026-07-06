// 기상청 단기예보 조회서비스(getVilageFcst) 호출 + 파싱 + 3축(강수/기온/습도바람) 판정
// 담당: Part B (날씨 연동·판정)

const KMA_BASE_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

// ── 판정 기준 상수 (여기만 고치면 기준값 전체 조정 가능) ─────────────────
const TEMP_HOT_THRESHOLD = 28; // TMX가 이 값 이상이면 hot
const TEMP_COLD_THRESHOLD = 5; // TMN이 이 값 이하이면 cold
const TEMP_SWING_THRESHOLD = 10; // (TMX-TMN)이 이 값 이상이면 swing(일교차)
const HUMID_THRESHOLD = 80; // REH가 이 값 이상이면 humid
const WINDY_THRESHOLD = 9; // WSD가 이 값 이상이면 windy

// 기상청 결측치 규칙: 900 이상 또는 -900 이하면 결측으로 처리
const MISSING_HIGH = 900;
const MISSING_LOW = -900;

// 기상청 발표시각(하루 8회)
const BASE_TIMES = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"];
// 발표 후 API 반영까지 여유를 두는 시간(분). 발표 직후 호출 시 빈 응답 방지.
const PUBLISH_DELAY_MINUTES = 10;

// ── 타입 정의 ─────────────────────────────────────────────────────────
export type PtyCode = 0 | 1 | 2 | 3 | 4;
export type RainAxis = "none" | "rain" | "sleet" | "snow" | "shower";
export type TempAxisLabel = "normal" | "hot" | "cold" | "swing";
export type HumidAxisLabel = "normal" | "humid" | "windy";
export type SkyTheme = "clear" | "cloudy" | "overcast" | "rain" | "snow";

// 시간대별(1시간 단위) 예보 한 칸
export interface HourlyForecast {
  time: string; // "HHmm"
  pty: number | null;
  sky: number | null;
  tmp: number | null;
  pop: number | null;
  reh: number | null;
  wsd: number | null;
}

// 오늘 하루치 예보 (fetchTodayForecast의 반환 형태)
export interface TodayForecast {
  date: string; // "yyyyMMdd" (오늘 날짜, base_date와 다를 수 있음)
  hourly: HourlyForecast[];
  tmx: number | null; // 오늘의 일 최고기온
  tmn: number | null; // 오늘의 일 최저기온
}

export interface RawSummary {
  tmp: number | null; // 현재 시각에 가장 가까운 기온
  tmx: number | null;
  tmn: number | null;
  reh: number | null; // 현재 시각에 가장 가까운 습도
  wsd: number | null; // 현재 시각에 가장 가까운 풍속
  pop: number | null; // 오늘 중 최대 강수확률
  rainStartHour: number | null; // 강수가 시작되는 첫 시각(0~23), 없으면 null
}

export interface WeatherClassification {
  rain_axis: RainAxis;
  temp_axis: TempAxisLabel[]; // 여러 조건이 동시에 해당될 수 있어 배열로 반환 (예: ["cold","swing"])
  humid_axis: HumidAxisLabel[]; // 여러 조건이 동시에 해당될 수 있어 배열로 반환 (예: ["humid","windy"])
  sky_theme: SkyTheme;
  raw_summary: RawSummary;
}

// ── 내부 유틸 ─────────────────────────────────────────────────────────

// 기상청 결측치(900 이상 또는 -900 이하)를 null로 변환
function toValueOrNull(raw: string): number | null {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  if (n >= MISSING_HIGH || n <= MISSING_LOW) return null;
  return n;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// 현재 시각 기준, 가장 최근에 발표되어 API에 반영됐을 base_date/base_time 계산
// (아침 알림 용도로 호출하면 자연히 05시 또는 08시 발표분이 선택됨)
export function getLatestBaseDateTime(now: Date = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  const cursor = new Date(now.getTime() - PUBLISH_DELAY_MINUTES * 60 * 1000);
  const hhmm = String(cursor.getHours()).padStart(2, "0") + String(cursor.getMinutes()).padStart(2, "0");

  // BASE_TIMES 중 cursor 시각보다 작거나 같은 가장 늦은 시각을 찾음
  let picked: string | null = null;
  for (const t of BASE_TIMES) {
    if (t <= hhmm) picked = t;
  }

  if (picked) {
    return { baseDate: formatDate(cursor), baseTime: picked };
  }

  // 오늘의 발표시각이 아직 하나도 지나지 않았다면(예: 새벽 01:50) 전날 23시 발표분 사용
  const yesterday = new Date(cursor);
  yesterday.setDate(yesterday.getDate() - 1);
  return { baseDate: formatDate(yesterday), baseTime: "2300" };
}

interface KmaRawItem {
  fcstDate: string;
  fcstTime: string;
  category: string;
  fcstValue: string;
}

interface KmaResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item: KmaRawItem[] };
    };
  };
}

// ── 기상청 API 호출 ───────────────────────────────────────────────────

// nx, ny 격자좌표로 오늘 하루치 시간대별 예보를 가져와 TodayForecast로 정리해서 반환
export async function fetchTodayForecast(
  nx: number,
  ny: number,
  now: Date = new Date()
): Promise<TodayForecast> {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    throw new Error("KMA_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }

  const { baseDate, baseTime } = getLatestBaseDateTime(now);

  const url = new URL(KMA_BASE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`기상청 API 호출 실패: HTTP ${res.status}`);
  }

  const json = (await res.json()) as KmaResponse;
  const resultCode = json?.response?.header?.resultCode;
  if (resultCode !== "00") {
    throw new Error(
      `기상청 API 오류 응답: ${json?.response?.header?.resultMsg ?? "알 수 없는 오류"}`
    );
  }

  const items = json.response.body?.items?.item ?? [];
  if (items.length === 0) {
    throw new Error("기상청 API 응답에 예보 데이터가 없습니다.");
  }

  const todayDate = formatDate(now);

  // fcstTime별로 항목을 모아 시간대별 예보로 정리
  const byTime = new Map<string, HourlyForecast>();
  let tmx: number | null = null;
  let tmn: number | null = null;

  for (const item of items) {
    if (item.fcstDate !== todayDate) continue; // 오늘 날짜만 사용

    if (item.category === "TMX") {
      tmx = toValueOrNull(item.fcstValue);
      continue;
    }
    if (item.category === "TMN") {
      tmn = toValueOrNull(item.fcstValue);
      continue;
    }

    let slot = byTime.get(item.fcstTime);
    if (!slot) {
      slot = { time: item.fcstTime, pty: null, sky: null, tmp: null, pop: null, reh: null, wsd: null };
      byTime.set(item.fcstTime, slot);
    }

    const value = toValueOrNull(item.fcstValue);
    switch (item.category) {
      case "PTY":
        slot.pty = value;
        break;
      case "SKY":
        slot.sky = value;
        break;
      case "TMP":
        slot.tmp = value;
        break;
      case "POP":
        slot.pop = value;
        break;
      case "REH":
        slot.reh = value;
        break;
      case "WSD":
        slot.wsd = value;
        break;
    }
  }

  const hourly = Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));

  return { date: todayDate, hourly, tmx, tmn };
}

// ── 3축 판정 ─────────────────────────────────────────────────────────

const PTY_TO_RAIN_AXIS: Record<number, RainAxis> = {
  0: "none",
  1: "rain",
  2: "sleet",
  3: "snow",
  4: "shower",
};

const SKY_TO_THEME: Record<number, SkyTheme> = {
  1: "clear",
  3: "cloudy",
  4: "overcast",
};

// 현재 시각(now)에 가장 가까운 시간대의 예보 한 칸을 찾음 (raw_summary용)
function findNearestHourly(hourly: HourlyForecast[], now: Date): HourlyForecast | null {
  if (hourly.length === 0) return null;
  const nowHHmm = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");

  // now보다 같거나 이후인 첫 예보를 우선 사용(가장 가까운 미래), 없으면 마지막 항목 사용
  const upcoming = hourly.find((h) => h.time >= nowHHmm);
  return upcoming ?? hourly[hourly.length - 1];
}

// TodayForecast를 받아 강수/기온/습도바람 3축 + 배경 테마 + 요약을 판정
export function classifyWeather(forecast: TodayForecast, now: Date = new Date()): WeatherClassification {
  const { hourly, tmx, tmn } = forecast;

  // 강수축: 하루 중 강수(PTY!=0)가 하나라도 있으면 그 시각의 종류를 사용, 없으면 none
  let rainAxis: RainAxis = "none";
  let rainStartHour: number | null = null;
  for (const h of hourly) {
    if (h.pty !== null && h.pty !== 0) {
      rainAxis = PTY_TO_RAIN_AXIS[h.pty] ?? "none";
      rainStartHour = Number(h.time.slice(0, 2));
      break; // 하루 중 가장 이른 강수 시각만 필요
    }
  }

  // 기온축: hot / cold / swing 여부를 각각 독립적으로 판정 (동시에 여러 개 해당 가능)
  const tempAxis: TempAxisLabel[] = [];
  if (tmx !== null && tmx >= TEMP_HOT_THRESHOLD) tempAxis.push("hot");
  if (tmn !== null && tmn <= TEMP_COLD_THRESHOLD) tempAxis.push("cold");
  if (tmx !== null && tmn !== null && tmx - tmn >= TEMP_SWING_THRESHOLD) tempAxis.push("swing");
  if (tempAxis.length === 0) tempAxis.push("normal");

  // 습도·바람축: 하루 중 최고 습도/풍속 기준으로 판정
  const maxReh = hourly.reduce<number | null>((max, h) => {
    if (h.reh === null) return max;
    return max === null ? h.reh : Math.max(max, h.reh);
  }, null);
  const maxWsd = hourly.reduce<number | null>((max, h) => {
    if (h.wsd === null) return max;
    return max === null ? h.wsd : Math.max(max, h.wsd);
  }, null);

  const humidAxis: HumidAxisLabel[] = [];
  if (maxReh !== null && maxReh >= HUMID_THRESHOLD) humidAxis.push("humid");
  if (maxWsd !== null && maxWsd >= WINDY_THRESHOLD) humidAxis.push("windy");
  if (humidAxis.length === 0) humidAxis.push("normal");

  // 배경 테마: 강수가 있으면 강수 우선, 없으면 하늘상태(SKY)로 결정
  let skyTheme: SkyTheme;
  if (rainAxis === "snow") {
    skyTheme = "snow";
  } else if (rainAxis === "rain" || rainAxis === "sleet" || rainAxis === "shower") {
    skyTheme = "rain";
  } else {
    const nearest = findNearestHourly(hourly, now);
    const skyCode = nearest?.sky;
    skyTheme = (skyCode !== null && skyCode !== undefined ? SKY_TO_THEME[skyCode] : undefined) ?? "clear";
  }

  // 오늘 중 최대 강수확률(POP)
  const maxPop = hourly.reduce<number | null>((max, h) => {
    if (h.pop === null) return max;
    return max === null ? h.pop : Math.max(max, h.pop);
  }, null);

  const nearestNow = findNearestHourly(hourly, now);

  return {
    rain_axis: rainAxis,
    temp_axis: tempAxis,
    humid_axis: humidAxis,
    sky_theme: skyTheme,
    raw_summary: {
      tmp: nearestNow?.tmp ?? null,
      tmx,
      tmn,
      reh: nearestNow?.reh ?? null,
      wsd: nearestNow?.wsd ?? null,
      pop: maxPop,
      rainStartHour,
    },
  };
}

// ── 테스트용 mock 데이터 ─────────────────────────────────────────────
// 기상청 API 키가 없는 팀원도 이 함수로 UI/로직을 개발할 수 있도록 제공.
// 맑고 평범한 하루(더위/추위/강수 없음)를 기본값으로 제공.
export function mockForecast(now: Date = new Date()): TodayForecast {
  const date = formatDate(now);
  const hourly: HourlyForecast[] = [
    { time: "0600", pty: 0, sky: 1, tmp: 18, pop: 10, reh: 60, wsd: 2 },
    { time: "0900", pty: 0, sky: 1, tmp: 21, pop: 10, reh: 55, wsd: 3 },
    { time: "1200", pty: 0, sky: 3, tmp: 24, pop: 20, reh: 50, wsd: 3 },
    { time: "1500", pty: 0, sky: 3, tmp: 26, pop: 20, reh: 48, wsd: 4 },
    { time: "1800", pty: 0, sky: 1, tmp: 23, pop: 10, reh: 55, wsd: 3 },
    { time: "2100", pty: 0, sky: 1, tmp: 20, pop: 10, reh: 60, wsd: 2 },
  ];

  return { date, hourly, tmx: 26, tmn: 17 };
}
