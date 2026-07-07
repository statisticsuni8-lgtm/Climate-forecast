/**
 * lib/gemini.ts — Google Gemini 호출 + fallback (담당 C)
 *
 * 공통기반 원칙:
 *  5) AI 호출 실패 시 미리 만든 템플릿 문구(fallback)로 대체해 앱이 멈추지 않게 한다.
 *  6) Gemini 호출은 지역당 1회만 하고 "이름"은 발송 시 문장에 삽입해 비용을 아낀다.
 *     → 생성 문구에는 이름 자리표시자 {name} 를 남기고, insertName()으로 채운다.
 *
 * 모델: 공통기반 문서는 gemini-1.5-flash로 고정했지만 2026-07 기준 해당 모델이
 * 단종되어(ListModels에 없음) 호출 시 404가 난다. 같은 free-tier "flash" 계열 중
 * 가장 가벼운 gemini-2.0-flash-lite로 대체했다. 필요하면 MODEL 상수만 바꾸면 된다.
 */

import type { HumidAxisLabel, RainAxis, TempAxisLabel, WeatherClassification } from "./weather";

const MODEL = "gemini-2.0-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TIMEOUT_MS = 8000;

/** Gemini 준비 여부(키가 실제로 설정됐는지) */
export const isGeminiReady = !!GEMINI_API_KEY;

/** 어제 대비 맥락(반복 방지) — 프롬프트에 "이틀째" 같은 문맥을 추가하는 데 사용 */
export interface BriefingContext {
  regionName?: string; // 지역명 (문장 톤 참고용, 실제 이름은 {name}으로)
  yesterday?: WeatherClassification | null; // 어제 판정
}

function describeTempAxis(axis: TempAxisLabel[]): string {
  if (axis.length === 0 || (axis.length === 1 && axis[0] === "normal")) return "평범";
  return axis.filter((a) => a !== "normal").join(", ");
}

function describeHumidAxis(axis: HumidAxisLabel[]): string {
  if (axis.length === 0 || (axis.length === 1 && axis[0] === "normal")) return "평범";
  return axis.filter((a) => a !== "normal").join(", ");
}

// ── 프롬프트 구성 ────────────────────────────────────────────
/** 3축 판정 → Gemini용 한국어 프롬프트 문자열 */
export function buildPrompt(classification: WeatherClassification, ctx: BriefingContext = {}): string {
  const lines: string[] = [];
  lines.push("너는 매일 아침 사용자에게 '오늘 뭘 챙길지' 한 문장으로 알려주는 다정한 친구다.");
  lines.push("아래 날씨 판정을 바탕으로 행동 조언을 2문장 이내(존댓말)로 만들어라.");
  lines.push("규칙: 아침 인사로 시작, 이모지 1개까지 허용, 사용자 이름 자리는 반드시 {name} 로 표기.");
  lines.push("날씨를 나열하지 말고 '무엇을 챙길지/어떻게 대비할지'를 말할 것.");
  lines.push("");
  if (ctx.regionName) lines.push(`- 지역: ${ctx.regionName}`);
  lines.push(`- 강수: ${classification.rain_axis}`);
  lines.push(`- 강수 시작 시각: ${classification.raw_summary.rainStartHour ?? "없음"}`);
  lines.push(`- 기온: ${describeTempAxis(classification.temp_axis)}`);
  lines.push(`- 습도·바람: ${describeHumidAxis(classification.humid_axis)}`);

  const sameRainAsYesterday =
    !!ctx.yesterday && ctx.yesterday.rain_axis === classification.rain_axis && classification.rain_axis !== "none";
  if (sameRainAsYesterday) {
    lines.push("- 참고: 어제도 같은 강수였음(이틀째) → 자연스럽게 언급 가능.");
  }
  const sameHumidAsYesterday =
    !!ctx.yesterday &&
    ctx.yesterday.humid_axis.includes("humid") &&
    classification.humid_axis.includes("humid");
  if (sameHumidAsYesterday) {
    lines.push("- 참고: 어제도 습했음(이틀째) → 자연스럽게 언급 가능.");
  }

  lines.push("");
  lines.push("최종 문장만 출력해라(다른 설명 금지).");
  return lines.join("\n");
}

// ── Gemini 호출 ──────────────────────────────────────────────
/**
 * 3축 판정으로 오늘의 조언 문장을 생성한다.
 * - 키 없음 / 호출 실패 / 타임아웃 / 빈 응답이면 fallbackMessage로 대체(앱이 멈추지 않음).
 * - 반환 문구에는 이름 자리표시자 {name} 이 포함된다 → 발송/표시 시 insertName()으로 치환.
 */
export async function generateBriefing(
  classification: WeatherClassification,
  ctx: BriefingContext = {}
): Promise<string> {
  if (!isGeminiReady) return fallbackMessage(classification, ctx);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(classification, ctx) }] }],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return fallbackMessage(classification, ctx);

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const message = text?.trim();
    if (!message) return fallbackMessage(classification, ctx);

    // 모델이 {name}을 빠뜨렸으면 앞에 붙여 일관성 유지
    return message.includes("{name}") ? message : `{name}님, ${message}`;
  } catch {
    // 네트워크/타임아웃/파싱 오류 등 어떤 실패든 fallback으로 (앱 지속)
    return fallbackMessage(classification, ctx);
  }
}

// ── Fallback 템플릿 ──────────────────────────────────────────
function rainClause(rainAxis: RainAxis, rainStartHour: number | null, repeat: boolean): string | null {
  const time = rainStartHour != null ? `${formatHour(rainStartHour)}부터 ` : "";
  switch (rainAxis) {
    case "rain":
      return repeat ? "이틀째 비가 이어져요, 우산 챙기세요" : `${time}비 소식이 있어요, 우산 챙기세요`;
    case "snow":
      return repeat ? "이틀째 눈이 이어져요, 방한과 미끄럼 조심하세요" : `${time}눈이 내려요, 방한과 미끄럼 조심하세요`;
    case "sleet":
      return "비 섞인 눈이 와요, 우산과 방한을 함께 챙기세요";
    case "shower":
      return "소나기가 올 수 있어요, 우산을 챙겨두면 안심이에요";
    case "none":
    default:
      return null;
  }
}

function tempClause(tempAxis: TempAxisLabel[], repeatSwing: boolean): string | null {
  if (tempAxis.includes("hot")) return "낮 기온이 높으니 시원하게 입으세요";
  if (tempAxis.includes("cold")) return "쌀쌀하니 겉옷을 챙기세요";
  if (tempAxis.includes("swing")) {
    return repeatSwing ? "어제처럼 오늘도 일교차가 크니 겉옷 하나 챙기세요" : "일교차가 크니 겉옷 하나 챙기면 좋아요";
  }
  return null;
}

function humidClause(humidAxis: HumidAxisLabel[]): string | null {
  if (humidAxis.includes("humid")) return "습도가 높아 끈적할 수 있어요";
  if (humidAxis.includes("windy")) return "바람이 강하니 유의하세요";
  return null;
}

function formatHour(hour: number): string {
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}시`;
}

/** Gemini 없이도 항상 자연스러운 문장이 나오도록 하는 규칙 기반 템플릿 ({name} 자리표시자 유지) */
export function fallbackMessage(
  classification: WeatherClassification,
  ctx: BriefingContext = {}
): string {
  const { yesterday } = ctx;
  const repeatRain = !!yesterday && yesterday.rain_axis === classification.rain_axis;
  const repeatSwing =
    !!yesterday && yesterday.temp_axis.includes("swing") && classification.temp_axis.includes("swing");

  const rain = rainClause(classification.rain_axis, classification.raw_summary.rainStartHour, repeatRain);
  const temp = tempClause(classification.temp_axis, repeatSwing);
  const humid = humidClause(classification.humid_axis);

  // 챙길 것이 여럿이어도 2문장을 넘기지 않도록, 강수를 우선하고
  // 두 번째 문장은 기온(옷차림)을 우선, 없으면 습도·바람을 채운다.
  const secondary = temp ?? humid;

  if (!rain && !secondary) {
    return "{name}님, 좋은 아침이에요. 맑고 쾌적한 날씨예요, 기분 좋은 하루 보내세요 ☀️";
  }

  const body = [rain, secondary].filter((s): s is string => !!s).join(", ");
  return `{name}님, 좋은 아침이에요. ${body} 🙂`;
}

/** 발송/표시 시 이름 자리표시자 {name} 를 실제 이름으로 치환 (비용 절감 원칙 6) */
export function insertName(message: string, name: string): string {
  return message.replace(/\{name\}/g, name);
}
