/**
 * components/WeatherBackground.tsx — 날씨별 배경 테마 (담당 D)
 *
 * 공통기반 6번: 애플 iOS 날씨 앱 오마주. "날씨가 곧 배경".
 * 전체화면 배경색 + 가벼운 애니메이션(CSS transform/opacity만) 위에 children을 올린다.
 *
 * skyTheme 5종:
 *   clear    #7FB8E8 · 해가 은은히 맥동
 *   cloudy   #93AEC4 · 구름 1~2개 천천히 떠다님
 *   overcast #8B95A0 · 구름 여러 개
 *   rain     #55657A · 빗방울 은은히 떨어짐
 *   snow     #A9B4C2 · 눈송이 내림(좌우 흔들림)
 *
 * ※ 애니메이션 keyframes를 컴포넌트 안에 <style>로 포함해, 별도 globals.css 수정 없이 동작.
 *   (B가 만든 /api/weather의 sky_theme 판정값을 그대로 skyTheme으로 넘기면 됨)
 */

import type { ReactNode } from "react";

// 배경 테마 판정값 (B의 날씨 3축 판정 중 sky_theme와 동일 집합)
export type SkyTheme = "clear" | "cloudy" | "overcast" | "rain" | "snow";

// sky_theme → 배경 그라데이션(위→아래). 상단은 밝게, 하단은 짙게.
const THEME_GRADIENT: Record<SkyTheme, string> = {
  clear: "linear-gradient(180deg, #8FC4F0 0%, #7FB8E8 100%)",
  cloudy: "linear-gradient(180deg, #A6BED2 0%, #93AEC4 100%)",
  overcast: "linear-gradient(180deg, #9AA4AF 0%, #8B95A0 100%)",
  rain: "linear-gradient(180deg, #64748C 0%, #55657A 100%)",
  snow: "linear-gradient(180deg, #C2CCD8 0%, #A9B4C2 100%)",
};

// 배경 애니메이션 keyframes (전역). 컴포넌트에 포함해 자체 완결.
const KEYFRAMES = `
@keyframes wb-drift { from { transform: translateX(-15%);} to { transform: translateX(115%);} }
@keyframes wb-fall { from { transform: translateY(-10%); opacity: 0;} 10% { opacity: 1;} to { transform: translateY(110vh); opacity: 0.2;} }
@keyframes wb-sway { from { transform: translateX(-6px);} to { transform: translateX(6px);} }
@keyframes wb-sun { 0%,100% { opacity: 0.85; transform: scale(1);} 50% { opacity: 1; transform: scale(1.06);} }
`;

interface Props {
  skyTheme: SkyTheme;
  children?: ReactNode;
}

/** 화면 전체 배경 + 테마별 애니메이션 레이어 + 콘텐츠 */
export default function WeatherBackground({ skyTheme, children }: Props) {
  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: THEME_GRADIENT[skyTheme] }}
    >
      {/* 애니메이션 keyframes (전역 주입) */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* 데코 레이어 (스크린리더 무시) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {skyTheme === "clear" && <Sun />}
        {skyTheme === "cloudy" && <Clouds count={2} />}
        {skyTheme === "overcast" && <Clouds count={4} />}
        {skyTheme === "rain" && (
          <>
            <Clouds count={3} dim />
            <Precip kind="rain" />
          </>
        )}
        {skyTheme === "snow" && <Precip kind="snow" />}
      </div>

      {/* 실제 콘텐츠 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** 해: 우상단에서 은은하게 맥동 */
function Sun() {
  return (
    <div
      className="absolute right-8 top-16 h-28 w-28 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(255,247,214,0.95) 0%, rgba(255,236,160,0.55) 45%, rgba(255,236,160,0) 70%)",
        animation: "wb-sun 6s ease-in-out infinite",
      }}
    />
  );
}

/** 구름: count개를 서로 다른 속도/위치로 천천히 흐르게 */
function Clouds({ count, dim = false }: { count: number; dim?: boolean }) {
  const clouds = Array.from({ length: count }).map((_, i) => ({
    top: 40 + i * 46,
    scale: 1 - (i % 3) * 0.15,
    duration: 55 + (i % 4) * 15,
    opacity: (dim ? 0.18 : 0.28) - (i % 3) * 0.03,
  }));

  return (
    <>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute left-0 rounded-full bg-white blur-2xl"
          style={{
            top: `${c.top}px`,
            width: `${160 * c.scale}px`,
            height: `${70 * c.scale}px`,
            opacity: c.opacity,
            animation: `wb-drift ${c.duration}s linear ${i * -8}s infinite`,
          }}
        />
      ))}
    </>
  );
}

/** 빗방울/눈송이 낙하 입자 (성능 위해 소량) */
function Precip({ kind }: { kind: "rain" | "snow" }) {
  const count = kind === "rain" ? 22 : 16;
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => {
        const left = (i / count) * 100 + (i % 3);
        const delay = (i % 6) * 0.4;
        const fallDur = kind === "rain" ? 0.9 + (i % 4) * 0.15 : 5 + (i % 5);

        if (kind === "rain") {
          return (
            <span
              key={i}
              className="absolute top-0 h-4 w-[2px] bg-white/40"
              style={{
                left: `${left}%`,
                animation: `wb-fall ${fallDur}s linear ${delay}s infinite`,
              }}
            />
          );
        }

        // 눈: wb-fall(부모)로 낙하 + wb-sway(자식)로 좌우 흔들림 합성
        return (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${left}%`,
              animation: `wb-fall ${fallDur}s linear ${delay}s infinite`,
            }}
          >
            <span
              className="block h-2 w-2 rounded-full bg-white/80"
              style={{
                animation: `wb-sway ${2 + (i % 3)}s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          </span>
        );
      })}
    </>
  );
}
