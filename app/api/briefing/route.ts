/**
 * app/api/briefing/route.ts — Gemini 오늘의 조언 문구 생성 (담당 C)
 *
 * GET /api/briefing?nx=&ny=            → 실제 기상청 데이터로 판정 후 문구 생성
 * GET /api/briefing?nx=&ny=&mock=true  → mockForecast()로 판정 (API 키 없이 테스트용)
 *
 * B의 /api/weather와 동일하게 nx,ny 격자좌표를 받는다 (D의 홈 화면이 이 방식으로 호출).
 *
 * 반환 문구에는 이름 자리표시자 {name} 이 포함된다(공통기반 원칙 6, 비용 절감).
 * 실제 발송/홈 표시 시 insertName()/fillName()으로 사용자 이름을 채운다.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { classifyWeather, fetchTodayForecast, mockForecast } from "@/lib/weather";
import type {
  HumidAxisLabel,
  RainAxis,
  SkyTheme,
  TempAxisLabel,
  WeatherClassification,
} from "@/lib/weather";
import { generateBriefing } from "@/lib/gemini";

function dateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const nxRaw = searchParams.get("nx");
  const nyRaw = searchParams.get("ny");
  const useMock = searchParams.get("mock") === "true";

  const nx = Number(nxRaw);
  const ny = Number(nyRaw);

  if (!nxRaw || !nyRaw || !Number.isInteger(nx) || !Number.isInteger(ny)) {
    return NextResponse.json(
      { error: "nx, ny는 정수 격자좌표로 필수 입력해야 합니다." },
      { status: 400 }
    );
  }

  let forecast;
  let classification: WeatherClassification;
  try {
    forecast = useMock ? mockForecast() : await fetchTodayForecast(nx, ny);
    classification = classifyWeather(forecast);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: `기상청 날씨 조회 실패: ${message}` }, { status: 502 });
  }

  // regions에서 같은 좌표의 지역명을 best-effort로 찾는다(프롬프트 맥락용, 없어도 동작).
  const { data: region } = await supabase
    .from("regions")
    .select("region_id, region_name")
    .eq("nx", nx)
    .eq("ny", ny)
    .maybeSingle();

  // 어제 판정 결과 조회(지역을 찾았을 때만 — "이틀째" 같은 맥락에 사용).
  // weather_logs.temp_axis/humid_axis는 text 컬럼이라 스케줄러가 배열을 콤마로 join해
  // 저장하므로, 여기서는 다시 배열로 복원해 WeatherClassification 형태로 맞춘다.
  let yesterday: WeatherClassification | null = null;
  if (region) {
    const yesterdayDate = dateStr(new Date(Date.now() - 86400000));
    const { data: yesterdayRow } = await supabase
      .from("weather_logs")
      .select("rain_axis, temp_axis, humid_axis, sky_theme, raw_summary")
      .eq("region_id", region.region_id)
      .eq("date", yesterdayDate)
      .maybeSingle();

    if (yesterdayRow) {
      yesterday = {
        rain_axis: yesterdayRow.rain_axis as RainAxis,
        temp_axis: (yesterdayRow.temp_axis ?? "normal").split(",") as TempAxisLabel[],
        humid_axis: (yesterdayRow.humid_axis ?? "normal").split(",") as HumidAxisLabel[],
        sky_theme: yesterdayRow.sky_theme as SkyTheme,
        raw_summary: yesterdayRow.raw_summary,
      };
    }
  }

  const message = await generateBriefing(classification, {
    regionName: region?.region_name,
    yesterday,
  });

  return NextResponse.json({
    forecast,
    classification,
    message, // 예: "{name}님, 우산 꼭 챙기세요 🙂"
  });
}
