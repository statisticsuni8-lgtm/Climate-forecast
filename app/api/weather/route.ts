import { NextRequest, NextResponse } from "next/server";
import { classifyWeather, fetchTodayForecast, mockForecast } from "@/lib/weather";

// GET /api/weather?nx=..&ny=..            -> 실제 기상청 데이터로 오늘 판정 반환
// GET /api/weather?nx=..&ny=..&mock=true  -> mockForecast()로 판정 반환 (API 키 없이 테스트용)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
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

  try {
    const forecast = useMock ? mockForecast() : await fetchTodayForecast(nx, ny);
    const classification = classifyWeather(forecast);
    return NextResponse.json({ forecast, classification });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `기상청 날씨 조회 실패: ${message}` },
      { status: 502 }
    );
  }
}
