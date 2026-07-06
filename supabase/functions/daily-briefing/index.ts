/**
 * supabase/functions/daily-briefing/index.ts — 매일 아침 스케줄러 (담당 C)
 *
 * Supabase Edge Function (Deno 런타임). cron으로 매 분 실행되며,
 * 지금 시각(KST, "HH:MM")이 push_time과 일치하는 사용자에게 오늘의 조언을 생성·기록한다.
 *
 * 흐름:
 *  1) 지금 시각·요일이 push_time/weekdays와 맞는 발송 대상(user_settings.push_enabled) 조회
 *  2) 사용자의 즐겨찾기 지역 → 기상청 조회 → 3축 판정 (지역당 1회, weather_logs upsert)
 *  3) 지역당 Gemini 1회 호출로 문구 생성({name} 자리표시자 유지) — 비용 절감(공통기반 원칙 6)
 *  4) 사용자별로 이름 치환 후 push_logs upsert (실제 푸시 발송은 MVP 우선순위상 스텁)
 *
 * ⚠️ Deno 런타임이라 Next 앱의 lib/weather.ts, lib/gemini.ts를 직접 import할 수 없어
 * (상대경로 확장자·번들러 차이) 같은 로직을 여기 재구현한다. B/C가 판정 기준이나
 * 프롬프트 규칙을 바꾸면 이 파일도 함께 수정해야 한다 (lib/weather.ts, lib/gemini.ts와 동기화 유지).
 *
 * 배포: supabase functions deploy daily-briefing
 * cron: Supabase Dashboard > Edge Functions > Schedules → 매 분("* * * * *") 권장
 *       (push_time을 정확히 "HH:MM" 일치로 비교하므로 매 분 실행해야 놓치지 않음)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KMA_API_KEY = Deno.env.get("KMA_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const CRON_SECRET = Deno.env.get("DAILY_BRIEFING_CRON_SECRET") ?? "";
const GEMINI_MODEL = "gemini-2.0-flash-lite";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── 날씨 판정 (lib/weather.ts와 동일 기준값) ──────────────────────────
const TEMP_HOT_THRESHOLD = 28;
const TEMP_COLD_THRESHOLD = 5;
const TEMP_SWING_THRESHOLD = 10;
const HUMID_THRESHOLD = 80;
const WINDY_THRESHOLD = 9;
const MISSING_HIGH = 900;
const MISSING_LOW = -900;
const BASE_TIMES = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"];
const PUBLISH_DELAY_MINUTES = 10;
const KMA_BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

const PTY_TO_RAIN_AXIS: Record<number, string> = {
  0: "none",
  1: "rain",
  2: "sleet",
  3: "snow",
  4: "shower",
};
const SKY_TO_THEME: Record<number, string> = { 1: "clear", 3: "cloudy", 4: "overcast" };

function toValueOrNull(raw: string): number | null {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  if (n >= MISSING_HIGH || n <= MISSING_LOW) return null;
  return n;
}

function formatKmaDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function getLatestBaseDateTime(now: Date): { baseDate: string; baseTime: string } {
  const cursor = new Date(now.getTime() - PUBLISH_DELAY_MINUTES * 60 * 1000);
  const hhmm = String(cursor.getHours()).padStart(2, "0") + String(cursor.getMinutes()).padStart(2, "0");
  let picked: string | null = null;
  for (const t of BASE_TIMES) {
    if (t <= hhmm) picked = t;
  }
  if (picked) return { baseDate: formatKmaDate(cursor), baseTime: picked };
  const yesterday = new Date(cursor);
  yesterday.setDate(yesterday.getDate() - 1);
  return { baseDate: formatKmaDate(yesterday), baseTime: "2300" };
}

interface HourlySlot {
  time: string;
  pty: number | null;
  sky: number | null;
  reh: number | null;
  wsd: number | null;
}

// nx,ny로 기상청 오늘 예보를 가져와 시간대별 슬롯 + tmx/tmn으로 정리
async function fetchTodayForecast(nx: number, ny: number, now: Date) {
  if (!KMA_API_KEY) throw new Error("KMA_API_KEY가 설정되어 있지 않습니다.");

  const { baseDate, baseTime } = getLatestBaseDateTime(now);
  const url = new URL(KMA_BASE_URL);
  url.searchParams.set("serviceKey", KMA_API_KEY);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`기상청 API 호출 실패: HTTP ${res.status}`);

  const json = await res.json();
  const resultCode = json?.response?.header?.resultCode;
  if (resultCode !== "00") {
    throw new Error(`기상청 API 오류 응답: ${json?.response?.header?.resultMsg ?? "알 수 없는 오류"}`);
  }

  const items = json.response.body?.items?.item ?? [];
  const todayDate = formatKmaDate(now);
  const byTime = new Map<string, HourlySlot>();
  let tmx: number | null = null;
  let tmn: number | null = null;

  for (const item of items) {
    if (item.fcstDate !== todayDate) continue;
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
      slot = { time: item.fcstTime, pty: null, sky: null, reh: null, wsd: null };
      byTime.set(item.fcstTime, slot);
    }
    const value = toValueOrNull(item.fcstValue);
    if (item.category === "PTY") slot.pty = value;
    if (item.category === "SKY") slot.sky = value;
    if (item.category === "REH") slot.reh = value;
    if (item.category === "WSD") slot.wsd = value;
  }

  const hourly = Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));
  return { hourly, tmx, tmn };
}

interface Classification {
  rain_axis: string;
  temp_axis: string[];
  humid_axis: string[];
  sky_theme: string;
  raw_summary: Record<string, unknown>;
}

// lib/weather.ts의 classifyWeather와 동일한 3축 판정 로직
function classifyWeather(forecast: { hourly: HourlySlot[]; tmx: number | null; tmn: number | null }): Classification {
  const { hourly, tmx, tmn } = forecast;

  let rainAxis = "none";
  let rainStartHour: number | null = null;
  for (const h of hourly) {
    if (h.pty !== null && h.pty !== 0) {
      rainAxis = PTY_TO_RAIN_AXIS[h.pty] ?? "none";
      rainStartHour = Number(h.time.slice(0, 2));
      break;
    }
  }

  const tempAxis: string[] = [];
  if (tmx !== null && tmx >= TEMP_HOT_THRESHOLD) tempAxis.push("hot");
  if (tmn !== null && tmn <= TEMP_COLD_THRESHOLD) tempAxis.push("cold");
  if (tmx !== null && tmn !== null && tmx - tmn >= TEMP_SWING_THRESHOLD) tempAxis.push("swing");
  if (tempAxis.length === 0) tempAxis.push("normal");

  const maxReh = hourly.reduce<number | null>((max, h) => (h.reh === null ? max : max === null ? h.reh : Math.max(max, h.reh)), null);
  const maxWsd = hourly.reduce<number | null>((max, h) => (h.wsd === null ? max : max === null ? h.wsd : Math.max(max, h.wsd)), null);

  const humidAxis: string[] = [];
  if (maxReh !== null && maxReh >= HUMID_THRESHOLD) humidAxis.push("humid");
  if (maxWsd !== null && maxWsd >= WINDY_THRESHOLD) humidAxis.push("windy");
  if (humidAxis.length === 0) humidAxis.push("normal");

  let skyTheme: string;
  if (rainAxis === "snow") skyTheme = "snow";
  else if (rainAxis === "rain" || rainAxis === "sleet" || rainAxis === "shower") skyTheme = "rain";
  else {
    const skyCode = hourly[0]?.sky;
    skyTheme = (skyCode != null ? SKY_TO_THEME[skyCode] : undefined) ?? "clear";
  }

  return {
    rain_axis: rainAxis,
    temp_axis: tempAxis,
    humid_axis: humidAxis,
    sky_theme: skyTheme,
    raw_summary: { tmx, tmn, rainStartHour },
  };
}

// 기상청 키 없거나 호출 실패 시 사용하는 mock (맑고 평범한 하루)
function mockClassification(): Classification {
  return {
    rain_axis: "none",
    temp_axis: ["normal"],
    humid_axis: ["normal"],
    sky_theme: "clear",
    raw_summary: { tmx: 24, tmn: 16, rainStartHour: null },
  };
}

// ── Gemini 호출 + fallback (lib/gemini.ts와 동일 규칙) ────────────────
function formatHour(hour: number): string {
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}시`;
}

function fallbackMessage(c: Classification, yesterday: Classification | null): string {
  const rainStartHour = (c.raw_summary.rainStartHour as number | null) ?? null;
  const repeatRain = !!yesterday && yesterday.rain_axis === c.rain_axis && c.rain_axis !== "none";
  const repeatSwing = !!yesterday && yesterday.temp_axis.includes("swing") && c.temp_axis.includes("swing");

  let rain: string | null = null;
  const time = rainStartHour != null ? `${formatHour(rainStartHour)}부터 ` : "";
  if (c.rain_axis === "rain") rain = repeatRain ? "이틀째 비가 이어져요, 우산 챙기세요" : `${time}비 소식이 있어요, 우산 챙기세요`;
  else if (c.rain_axis === "snow") rain = repeatRain ? "이틀째 눈이 이어져요, 방한과 미끄럼 조심하세요" : `${time}눈이 내려요, 방한과 미끄럼 조심하세요`;
  else if (c.rain_axis === "sleet") rain = "비 섞인 눈이 와요, 우산과 방한을 함께 챙기세요";
  else if (c.rain_axis === "shower") rain = "소나기가 올 수 있어요, 우산을 챙겨두면 안심이에요";

  let temp: string | null = null;
  if (c.temp_axis.includes("hot")) temp = "낮 기온이 높으니 시원하게 입으세요";
  else if (c.temp_axis.includes("cold")) temp = "쌀쌀하니 겉옷을 챙기세요";
  else if (c.temp_axis.includes("swing")) temp = repeatSwing ? "어제처럼 오늘도 일교차가 크니 겉옷 하나 챙기세요" : "일교차가 크니 겉옷 하나 챙기면 좋아요";

  let humid: string | null = null;
  if (c.humid_axis.includes("humid")) humid = "습도가 높아 끈적할 수 있어요";
  else if (c.humid_axis.includes("windy")) humid = "바람이 강하니 유의하세요";

  const secondary = temp ?? humid;
  if (!rain && !secondary) {
    return "{name}님, 좋은 아침이에요. 맑고 쾌적한 날씨예요, 기분 좋은 하루 보내세요 ☀️";
  }
  const body = [rain, secondary].filter(Boolean).join(", ");
  return `{name}님, 좋은 아침이에요. ${body} 🙂`;
}

function buildPrompt(c: Classification, regionName: string, yesterday: Classification | null): string {
  const lines: string[] = [];
  lines.push("너는 매일 아침 사용자에게 '오늘 뭘 챙길지' 한 문장으로 알려주는 다정한 친구다.");
  lines.push("아래 날씨 판정을 바탕으로 행동 조언을 2문장 이내(존댓말)로 만들어라.");
  lines.push("규칙: 아침 인사로 시작, 이모지 1개까지 허용, 사용자 이름 자리는 반드시 {name} 로 표기.");
  lines.push("");
  lines.push(`- 지역: ${regionName}`);
  lines.push(`- 강수: ${c.rain_axis}`);
  lines.push(`- 기온: ${c.temp_axis.join(", ")}`);
  lines.push(`- 습도·바람: ${c.humid_axis.join(", ")}`);
  if (yesterday && yesterday.rain_axis === c.rain_axis && c.rain_axis !== "none") {
    lines.push("- 참고: 어제도 같은 강수였음(이틀째) → 자연스럽게 언급 가능.");
  }
  lines.push("");
  lines.push("최종 문장만 출력해라(다른 설명 금지).");
  return lines.join("\n");
}

async function generateBriefing(c: Classification, regionName: string, yesterday: Classification | null): Promise<string> {
  if (!GEMINI_API_KEY) return fallbackMessage(c, yesterday);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(c, regionName, yesterday) }] }] }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return fallbackMessage(c, yesterday);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const message = text?.trim();
    if (!message) return fallbackMessage(c, yesterday);
    return message.includes("{name}") ? message : `{name}님, ${message}`;
  } catch {
    return fallbackMessage(c, yesterday);
  }
}

function insertName(message: string, name: string): string {
  return message.replace(/\{name\}/g, name);
}

// ── 메인 핸들러 ────────────────────────────────────────────────────
function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const kst = kstNow();
  const hhmm = kst.toISOString().slice(11, 16); // "07:00" (kst를 UTC로 만들었으므로 그대로 슬라이스)
  const weekday = kst.getUTCDay(); // kst를 UTC 메서드로 다루므로 getUTCDay가 KST 요일과 일치
  const todayDate = dateStr(kst);
  const yesterdayDate = dateStr(new Date(kst.getTime() - 86400000));

  // 1) 발송 대상 조회: users를 기준으로 user_settings·favorite_locations를 각각 임베드한다.
  // (user_settings와 favorite_locations는 서로 FK가 없는 형제 테이블이라 PostgREST가
  //  둘 사이의 조인 경로를 못 찾는다 — users를 기준점으로 두면 해결된다.)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      "user_id, name, user_settings!inner(push_time, weekdays, push_enabled), favorite_locations(region_id, regions(region_id, region_name, nx, ny))"
    )
    .eq("user_settings.push_enabled", true)
    .eq("user_settings.push_time", hhmm);

  if (usersError) {
    console.error("[daily-briefing] users 조회 실패:", usersError);
    return new Response(JSON.stringify({ ok: false, error: usersError.message }), { status: 500 });
  }

  // deno-lint-ignore no-explicit-any
  const due = (users ?? []).filter((u: any) => (u.user_settings?.weekdays ?? []).includes(weekday));

  // 2~3) 지역별로 1회만 판정/문구 생성 (같은 지역 사용자는 문구를 공유)
  const regionMessageCache = new Map<number, string>();
  let loggedCount = 0;

  for (const user of due as any[]) {
    const favorite = user.favorite_locations?.[0];
    const region = favorite?.regions;
    if (!region) continue;

    let message = regionMessageCache.get(region.region_id);

    if (!message) {
      const { data: yesterdayRow } = await supabase
        .from("weather_logs")
        .select("rain_axis, temp_axis, humid_axis, sky_theme, raw_summary")
        .eq("region_id", region.region_id)
        .eq("date", yesterdayDate)
        .maybeSingle();

      const yesterdayClassification: Classification | null = yesterdayRow
        ? {
            rain_axis: yesterdayRow.rain_axis ?? "none",
            temp_axis: (yesterdayRow.temp_axis ?? "normal").split(","),
            humid_axis: (yesterdayRow.humid_axis ?? "normal").split(","),
            sky_theme: yesterdayRow.sky_theme ?? "clear",
            raw_summary: yesterdayRow.raw_summary ?? {},
          }
        : null;

      let classification: Classification;
      try {
        const forecast = await fetchTodayForecast(region.nx, region.ny, kst);
        classification = classifyWeather(forecast);
      } catch (error) {
        console.error("[daily-briefing] 기상청 조회 실패, mock으로 대체:", error);
        classification = mockClassification();
      }

      // weather_logs upsert (temp_axis/humid_axis는 text 컬럼이라 배열을 콤마로 join)
      await supabase.from("weather_logs").upsert(
        {
          region_id: region.region_id,
          date: todayDate,
          rain_axis: classification.rain_axis,
          temp_axis: classification.temp_axis.join(","),
          humid_axis: classification.humid_axis.join(","),
          sky_theme: classification.sky_theme,
          raw_summary: classification.raw_summary,
        },
        { onConflict: "region_id,date" }
      );

      message = await generateBriefing(classification, region.region_name, yesterdayClassification);
      regionMessageCache.set(region.region_id, message);
    }

    const personalized = insertName(message, user.name ?? "");

    // 4) push_logs upsert — 사용자가 푸시를 지워도 홈 화면이 여기서 오늘 문구를 다시 불러온다(핵심 기능)
    await supabase.from("push_logs").upsert(
      { user_id: user.user_id, date: todayDate, message: personalized },
      { onConflict: "user_id,date" }
    );
    // TODO(C, 여력 되면): 실제 웹 푸시(FCM) 발송 연동. MVP는 push_logs 저장이 최우선.

    loggedCount++;
  }

  return new Response(
    JSON.stringify({ ok: true, time: hhmm, weekday, processed: due.length, logged: loggedCount }),
    { headers: { "Content-Type": "application/json" } }
  );
});
