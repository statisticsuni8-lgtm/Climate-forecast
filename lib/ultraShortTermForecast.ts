/**
 * lib/ultraShortTermForecast.ts — 기상청 초단기예보(getUltraSrtFcst) 연동 (담당 C)
 *
 * B의 lib/weather.ts(단기예보 getVilageFcst, 3시간 단위 최대 3일)와는 별개로,
 * 향후 6시간을 1시간 단위로 더 정밀하게 보여주는 초단기 강수예측을 제공한다.
 * 기존 /api/weather·lib/weather.ts는 건드리지 않고 완전히 분리된 파일/엔드포인트로 추가.
 */

const KMA_ULTRA_FCST_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

// 기상청 결측치 규칙: 900 이상 또는 -900 이하면 결측으로 처리 (B의 규칙과 동일)
const MISSING_HIGH = 900;
const MISSING_LOW = -900;

// 초단기예보는 매시 30분에 생성되고 API 반영까지 시간이 걸려 45분 정도 여유를 둔다.
const PUBLISH_DELAY_MINUTES = 45;

export type UltraRainType =
  | "none"
  | "rain"
  | "sleet"
  | "snow"
  | "shower"
  | "drizzle"
  | "drizzleSnow"
  | "flurry";

const PTY_TO_RAIN_TYPE: Record<number, UltraRainType> = {
  0: "none",
  1: "rain",
  2: "sleet",
  3: "snow",
  4: "shower",
  5: "drizzle",
  6: "drizzleSnow",
  7: "flurry",
};

export interface UltraHourlySlot {
  time: string; // "HHmm"
  rainType: UltraRainType;
  /** 1시간 강수량(RN1). 기상청이 범주형 문자열로 주는 경우가 많아 원문 그대로 보존 (예: "강수없음", "1.0") */
  rain1h: string | null;
  sky: number | null;
  tmp: number | null;
  reh: number | null;
}

export interface UltraShortTermForecast {
  baseDate: string;
  baseTime: string;
  /** 향후 약 6시간, 1시간 단위 */
  hourly: UltraHourlySlot[];
  /** 지금부터 강수가 시작되는 첫 시각(0~23), 6시간 이내 강수가 없으면 null */
  rainStartHour: number | null;
  /** 지금 이 시각과 가장 가까운 슬롯의 강수형태 */
  currentRainType: UltraRainType;
}

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

/** 현재 시각 기준, 가장 최근에 발표되어 API에 반영됐을 base_date/base_time("HH30") 계산 */
export function getLatestUltraBaseDateTime(now: Date = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  const cursor = new Date(now.getTime() - PUBLISH_DELAY_MINUTES * 60 * 1000);
  let baseHour = cursor.getHours();
  let baseDate = cursor;

  // 아직 이번 시각의 30분 발표분을 못 쓰면(분이 30 미만) 이전 시각 발표분을 사용
  if (cursor.getMinutes() < 30) {
    baseHour -= 1;
  }
  if (baseHour < 0) {
    baseDate = new Date(cursor);
    baseDate.setDate(baseDate.getDate() - 1);
    baseHour = 23;
  }

  return { baseDate: formatDate(baseDate), baseTime: `${String(baseHour).padStart(2, "0")}30` };
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
    body?: { items?: { item: KmaRawItem[] } };
  };
}

/** nx, ny 격자좌표로 향후 6시간 초단기 강수예측을 가져온다 */
export async function fetchUltraShortTermForecast(
  nx: number,
  ny: number,
  now: Date = new Date()
): Promise<UltraShortTermForecast> {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    throw new Error("KMA_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }

  const { baseDate, baseTime } = getLatestUltraBaseDateTime(now);

  const url = new URL(KMA_ULTRA_FCST_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`기상청 초단기예보 API 호출 실패: HTTP ${res.status}`);
  }

  const json = (await res.json()) as KmaResponse;
  const resultCode = json?.response?.header?.resultCode;
  if (resultCode !== "00") {
    throw new Error(
      `기상청 초단기예보 API 오류 응답: ${json?.response?.header?.resultMsg ?? "알 수 없는 오류"}`
    );
  }

  const items = json.response.body?.items?.item ?? [];
  const byTime = new Map<string, UltraHourlySlot>();

  for (const item of items) {
    let slot = byTime.get(item.fcstTime);
    if (!slot) {
      slot = { time: item.fcstTime, rainType: "none", rain1h: null, sky: null, tmp: null, reh: null };
      byTime.set(item.fcstTime, slot);
    }
    switch (item.category) {
      case "PTY": {
        const code = toValueOrNull(item.fcstValue);
        slot.rainType = code !== null ? PTY_TO_RAIN_TYPE[code] ?? "none" : "none";
        break;
      }
      case "RN1":
        slot.rain1h = item.fcstValue;
        break;
      case "SKY":
        slot.sky = toValueOrNull(item.fcstValue);
        break;
      case "T1H":
        slot.tmp = toValueOrNull(item.fcstValue);
        break;
      case "REH":
        slot.reh = toValueOrNull(item.fcstValue);
        break;
      default:
        break;
    }
  }

  const hourly = Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));

  let rainStartHour: number | null = null;
  for (const h of hourly) {
    if (h.rainType !== "none") {
      rainStartHour = Number(h.time.slice(0, 2));
      break;
    }
  }

  const nowHHmm =
    String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
  const current = hourly.find((h) => h.time >= nowHHmm) ?? hourly[0];

  return {
    baseDate,
    baseTime,
    hourly,
    rainStartHour,
    currentRainType: current?.rainType ?? "none",
  };
}

/** 기상청 키 없이도 테스트할 수 있는 mock (1시간 뒤 소나기가 시작되는 시나리오) */
export function mockUltraShortTermForecast(now: Date = new Date()): UltraShortTermForecast {
  const hourly: UltraHourlySlot[] = [
    { time: "1400", rainType: "none", rain1h: "강수없음", sky: 3, tmp: 24, reh: 55 },
    { time: "1500", rainType: "shower", rain1h: "1.0", sky: 4, tmp: 23, reh: 65 },
    { time: "1600", rainType: "shower", rain1h: "3.0", sky: 4, tmp: 22, reh: 70 },
    { time: "1700", rainType: "rain", rain1h: "5.0", sky: 4, tmp: 21, reh: 75 },
    { time: "1800", rainType: "none", rain1h: "강수없음", sky: 3, tmp: 21, reh: 65 },
    { time: "1900", rainType: "none", rain1h: "강수없음", sky: 1, tmp: 20, reh: 60 },
  ];

  return {
    baseDate: formatDate(now),
    baseTime: "1330",
    hourly,
    rainStartHour: 15,
    currentRainType: "none",
  };
}
