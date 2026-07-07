/**
 * lib/checklist.ts — 오늘 챙길 것 체크리스트 파생 로직
 *
 * 이 앱의 원래 정체성("날씨를 보여주는 게 아니라 뭘 챙길지 판단해주는 앱")을
 * AI 문장뿐 아니라 탭 가능한 아이콘 칩으로도 구체화한다.
 * B의 3축 판정(rain_axis/temp_axis/humid_axis) 결과에서 결정적으로 파생하므로
 * Gemini 호출 없이 항상 동일하게 계산된다.
 */

import type { WeatherClassification } from "./weather";

export interface ChecklistItem {
  id: string;
  icon: string;
  label: string;
}

export function deriveChecklistItems(c: WeatherClassification): ChecklistItem[] {
  const items = new Map<string, ChecklistItem>();
  const add = (item: ChecklistItem) => items.set(item.id, item);

  if (c.rain_axis === "rain" || c.rain_axis === "shower") {
    add({ id: "umbrella", icon: "☂️", label: "우산" });
  }
  if (c.rain_axis === "snow" || c.rain_axis === "sleet") {
    add({ id: "umbrella", icon: "☂️", label: "우산" });
    add({ id: "winter_gear", icon: "🧣", label: "방한용품" });
  }
  if (c.temp_axis.includes("hot")) {
    add({ id: "fan", icon: "🧊", label: "손선풍기" });
    add({ id: "sunscreen", icon: "🧴", label: "선크림" });
  }
  if (c.temp_axis.includes("cold") || c.temp_axis.includes("swing")) {
    add({ id: "jacket", icon: "🧥", label: "겉옷" });
  }
  if (c.humid_axis.includes("humid")) {
    add({ id: "handkerchief", icon: "🤧", label: "손수건" });
  }
  if (c.humid_axis.includes("windy")) {
    add({ id: "windbreaker", icon: "🧢", label: "바람막이" });
  }

  return Array.from(items.values());
}
