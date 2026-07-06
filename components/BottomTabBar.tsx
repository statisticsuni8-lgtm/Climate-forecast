/**
 * components/BottomTabBar.tsx — 하단 탭 바 (담당 D)
 *
 * 홈/알림기록/설정 3탭. MVP는 '홈'만 활성,
 * 나머지(알림기록·설정)는 2차 범위라 비활성 회색으로 자리만 잡아둔다.
 */

interface Props {
  active?: "home" | "history" | "settings";
}

const TABS = [
  { key: "home", label: "홈", icon: "🏠", enabled: true },
  { key: "history", label: "알림기록", icon: "🔔", enabled: false }, // 2차
  { key: "settings", label: "설정", icon: "⚙️", enabled: false }, // 2차
] as const;

export default function BottomTabBar({ active = "home" }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[480px] justify-around border-t border-white/20 bg-black/20 px-4 py-2 backdrop-blur-md"
      aria-label="하단 탭 메뉴"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            disabled={!tab.enabled}
            aria-label={tab.enabled ? tab.label : `${tab.label} (준비 중)`}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={!tab.enabled}
            className={[
              "flex flex-col items-center gap-0.5 text-xs transition",
              tab.enabled ? "text-white" : "cursor-not-allowed text-white/40",
              isActive ? "font-semibold" : "font-normal",
            ].join(" ")}
          >
            <span className="text-lg" aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
