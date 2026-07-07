/**
 * components/RainAlertBanner.tsx — 초단기 강수예측 알림 배너 (담당 C, 차별화 기능)
 *
 * 강의실·집 등 실내에 있어서 날씨를 못 보고 있다가 나갈 때가 돼서야 비를
 * 맞는 상황을 막기 위한 배너. C의 /api/nowcast(초단기예보, 향후 6시간 1시간
 * 단위)를 이용해 "지금 오고 있는지" 또는 "곧 시작되는지"를 눈에 띄게 보여준다.
 *
 * 아무 일 없으면(강수 없음) 화면을 차지하지 않도록 null을 반환한다.
 */

export type UltraRainType =
  | "none"
  | "rain"
  | "sleet"
  | "snow"
  | "shower"
  | "drizzle"
  | "drizzleSnow"
  | "flurry";

interface Props {
  currentRainType: UltraRainType;
  /** 향후 6시간 이내에 강수가 시작되는 시각(0~23). 없으면 null */
  rainStartHour: number | null;
}

const RAIN_LABEL: Record<UltraRainType, string> = {
  none: "",
  rain: "비",
  shower: "소나기",
  snow: "눈",
  sleet: "진눈깨비",
  drizzle: "이슬비",
  drizzleSnow: "빗방울눈날림",
  flurry: "눈날림",
};

function formatHour(hour: number): string {
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}시`;
}

export default function RainAlertBanner({ currentRainType, rainStartHour }: Props) {
  if (currentRainType !== "none") {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-blue-600/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg backdrop-blur-md"
      >
        ☔ 지금 {RAIN_LABEL[currentRainType]}이(가) 오고 있어요 — 우산 챙기셨나요?
      </div>
    );
  }

  if (rainStartHour != null) {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-amber-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg backdrop-blur-md"
      >
        ⏰ {formatHour(rainStartHour)}부터 비 소식이 있어요 — 나가기 전에 우산 챙기세요!
      </div>
    );
  }

  return null;
}
