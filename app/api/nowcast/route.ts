/**
 * app/api/nowcast/route.ts — 초단기 강수예측 (담당 C, B의 /api/weather와 별개 엔드포인트)
 *
 * GET /api/nowcast?nx=&ny=            → 기상청 초단기예보(getUltraSrtFcst)로 향후 6시간 강수 예측
 * GET /api/nowcast?nx=&ny=&mock=true  → mock 데이터 (KMA_API_KEY 없이 테스트용)
 *
 * 기존 /api/weather·lib/weather.ts(B, 단기예보 3시간 단위)는 그대로 두고,
 * 더 정밀한(1시간 단위) 초단기 강수 예측만 별도로 제공한다.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  fetchUltraShortTermForecast,
  mockUltraShortTermForecast,
} from "@/lib/ultraShortTermForecast";

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

  try {
    const nowcast = useMock
      ? mockUltraShortTermForecast()
      : await fetchUltraShortTermForecast(nx, ny);
    return NextResponse.json({ nowcast });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: `초단기예보 조회 실패: ${message}` }, { status: 502 });
  }
}
