/**
 * components/HourlyForecastStrip.tsx — 시간대별 예보 스트립 (담당 D)
 *
 * props hours(배열: {time, icon, temp}). 가로 스크롤.
 * 실데이터는 B의 /api/weather 시간대별 예보로 채운다. 없으면 mock으로 UI 먼저.
 */

export interface HourItem {
  time: string; // "지금" / "08시" ...
  icon: string; // 이모지 아이콘 (임시)
  temp: number; // 기온(℃)
}

// mock 시간대별 데이터 (여름 아침 가정)
const MOCK_HOURS: HourItem[] = [
  { time: "지금", icon: "☀️", temp: 26 },
  { time: "09시", icon: "☀️", temp: 28 },
  { time: "10시", icon: "🌤️", temp: 29 },
  { time: "11시", icon: "🌤️", temp: 30 },
  { time: "12시", icon: "☁️", temp: 30 },
  { time: "13시", icon: "🌦️", temp: 29 },
  { time: "14시", icon: "🌧️", temp: 28 },
];

interface Props {
  hours?: HourItem[];
}

export default function HourlyForecastStrip({ hours }: Props) {
  const list = hours && hours.length > 0 ? hours : MOCK_HOURS;

  return (
    <section
      className="rounded-3xl bg-white/15 p-4 backdrop-blur-md"
      aria-label="시간대별 예보"
    >
      <ul className="flex gap-4 overflow-x-auto pb-1">
        {list.map((h, i) => (
          <li
            key={i}
            className="flex min-w-[52px] flex-col items-center gap-1 text-white"
          >
            <span className="text-xs text-white/80">{h.time}</span>
            <span className="text-xl" role="img" aria-label={`${h.time} 날씨`}>
              {h.icon}
            </span>
            <span className="text-sm font-medium">{h.temp}°</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
