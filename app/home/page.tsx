"use client";

/**
 * app/home/page.tsx — 화면4 홈·브리핑 (담당 D, 데이터는 A·B·C)
 *
 * A가 남긴 TODO(D) 자리를 구현. A의 규약을 그대로 따른다:
 *   - 세션: localStorage 'user_id' 문자열 (A의 로그인이 저장).
 *   - DB:   @/lib/supabase 의 supabase 클라이언트로 직접 조회.
 *
 * 데이터 흐름:
 *   1) user_id 확인 (없으면 /login)
 *   2) 지역+좌표: favorite_locations ⨝ regions
 *   3) 오늘 날씨: GET /api/weather?nx=&ny=  (B)
 *   4) 오늘 문구: push_logs 오늘자 message (C) → 없으면 GET /api/briefing (C)
 *      "푸시를 지워도 홈에서 다시 본다"(핵심 가치)는 push_logs 재조회로 실현.
 *
 * B·C의 API/테이블이 아직 없어도 각 단계 mock 폴백으로 화면이 먼저 보인다.
 * 상태: loading(스켈레톤) / loaded / error(마지막 저장분 + 안내).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WeatherBackground, { type SkyTheme } from "@/components/WeatherBackground";
import AIBriefingCard from "@/components/AIBriefingCard";
import HourlyForecastStrip, {
  type HourItem,
} from "@/components/HourlyForecastStrip";
import BottomTabBar from "@/components/BottomTabBar";

// sky_theme → 헤더에 보여줄 한국어 날씨 상태 라벨
const SKY_LABEL: Record<SkyTheme, string> = {
  clear: "맑음",
  cloudy: "구름 조금",
  overcast: "흐림",
  rain: "비",
  snow: "눈",
};

// 지역 정보를 못 가져올 때의 기본값 (서울 강남구)
const FALLBACK_REGION = {
  region_name: "내 지역",
  nx: 61,
  ny: 126,
};

interface HomeData {
  regionName: string;
  tmp: number | null;
  skyTheme: SkyTheme;
  skyLabel: string;
  message: string; // 이름 치환 완료된 최종 문장
  hours: HourItem[];
}

type Status = "loading" | "loaded" | "error";

const HOME_CACHE_KEY = "wb_home_cache"; // error 시 "마지막 저장분" 표시용

// 오늘 날짜 YYYY-MM-DD (로컬)
function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 문구의 {name} 자리표시자를 이름으로 치환 (없으면 자리표시자 정리)
function fillName(message: string, name: string): string {
  return name
    ? message.replace(/\{name\}/g, name)
    : message.replace(/\{name\}님?,?\s*/g, "").trim();
}

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<HomeData | null>(null);

  // 당겨서 새로고침 상태
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const load = useCallback(async () => {
    // 1) 세션 확인 (A 규약: localStorage 'user_id')
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    if (!userId) {
      router.replace("/login");
      return;
    }

    try {
      // ── 2) 지역 + 좌표 (favorite_locations ⨝ regions) ──
      let region = { ...FALLBACK_REGION };
      let userName = "";
      try {
        const { data: fav } = await supabase
          .from("favorite_locations")
          .select("regions(region_name, nx, ny)")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        const r = Array.isArray((fav as any)?.regions)
          ? (fav as any).regions[0]
          : (fav as any)?.regions;
        if (r) {
          region = { region_name: r.region_name, nx: r.nx, ny: r.ny };
        }
        // 이름(문구 {name} 치환용)
        const { data: u } = await supabase
          .from("users")
          .select("name")
          .eq("user_id", userId)
          .maybeSingle();
        if (u?.name) userName = u.name as string;
      } catch {
        /* Supabase 미설정/오류 → 기본 지역으로 계속 */
      }

      // ── 3) 오늘 날씨 (B의 API) ──
      let skyTheme: SkyTheme = "clear";
      let tmp: number | null = null;
      let hours: HourItem[] = [];
      try {
        const wRes = await fetch(`/api/weather?nx=${region.nx}&ny=${region.ny}`);
        if (wRes.ok) {
          const w = await wRes.json();
          if (w?.axes?.sky_theme) skyTheme = w.axes.sky_theme as SkyTheme;
          tmp = w?.summary?.tmp ?? w?.tmp ?? null;
          if (Array.isArray(w?.hours)) hours = w.hours as HourItem[];
        }
      } catch {
        /* 날씨 API 미완성 → clear/mock으로 표시 */
      }

      // ── 4) 오늘 문구 (push_logs 우선 → /api/briefing) ──
      let message = "";
      try {
        const { data: pushRow } = await supabase
          .from("push_logs")
          .select("message")
          .eq("user_id", userId)
          .eq("date", todayStr())
          .maybeSingle();
        if (pushRow?.message) message = pushRow.message as string; // 이미 이름 치환됨
      } catch {
        /* push_logs 없음 → 아래 briefing으로 */
      }
      if (!message) {
        try {
          const bRes = await fetch(
            `/api/briefing?nx=${region.nx}&ny=${region.ny}`
          );
          if (bRes.ok) {
            const b = await bRes.json();
            message = fillName(b?.message ?? "", userName);
          }
        } catch {
          /* briefing API 미완성 → 아래 기본 문구 */
        }
      }
      if (!message) {
        message = fillName("{name}님, 좋은 아침이에요 🙂", userName);
      }

      const next: HomeData = {
        regionName: region.region_name,
        tmp,
        skyTheme,
        skyLabel: SKY_LABEL[skyTheme],
        message,
        hours,
      };
      setData(next);
      setStatus("loaded");
      try {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(next));
      } catch {
        /* 무시 */
      }
    } catch {
      // 예기치 못한 전체 실패 → 마지막 저장분 표시 + 안내
      try {
        const cached = localStorage.getItem(HOME_CACHE_KEY);
        if (cached) setData(JSON.parse(cached) as HomeData);
      } catch {
        /* 무시 */
      }
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  // 당겨서 새로고침 실행
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    setPull(0);
  }, [load]);

  // ── 터치 핸들러(당겨서 새로고침) ──
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 70));
  };
  const onTouchEnd = () => {
    if (startY.current == null) return;
    if (pull > 50) void doRefresh();
    else setPull(0);
    startY.current = null;
  };

  const theme: SkyTheme = data?.skyTheme ?? "clear";
  const isLoading = status === "loading";

  return (
    <WeatherBackground skyTheme={theme}>
      <main
        className="flex min-h-[100dvh] flex-col gap-4 px-5 pb-24 pt-12"
        style={{
          transform: `translateY(${pull}px)`,
          transition: pull ? "none" : "transform 0.25s",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {(pull > 0 || refreshing) && (
          <div
            className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-white/80"
            aria-live="polite"
          >
            {refreshing
              ? "새로고침 중…"
              : pull > 50
                ? "놓으면 새로고침"
                : "당겨서 새로고침"}
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="rounded-2xl bg-black/25 px-4 py-2 text-center text-sm text-white backdrop-blur-md"
          >
            최신 정보를 못 불러왔어요. 마지막으로 저장된 내용을 보여드릴게요.
          </div>
        )}

        {/* 지역명 · 현재기온 · 날씨상태 */}
        <header className="text-center text-white">
          <p
            className="text-lg font-medium"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
          >
            {isLoading ? "…" : data?.regionName ?? "내 지역"}
          </p>
          <p
            className="text-6xl font-light leading-tight"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
          >
            {data?.tmp != null ? `${data.tmp}°` : "–"}
          </p>
          <p className="text-sm text-white/85">
            {isLoading ? " " : data?.skyLabel ?? ""}
          </p>
        </header>

        {/* 핵심: 오늘의 추천 카드 (푸시 지워도 여기서 재확인) */}
        <AIBriefingCard
          message={data?.message ?? ""}
          loading={isLoading && !data}
        />

        {/* 보조: 시간대별 예보 */}
        <HourlyForecastStrip hours={data?.hours} />
      </main>

      {/* 하단 탭 (홈만 활성) */}
      <BottomTabBar active="home" />
    </WeatherBackground>
  );
}
