/**
 * components/AIBriefingCard.tsx — 오늘의 추천 카드 (담당 D) ← 이 앱의 핵심
 *
 * 반투명 흰 카드에 "오늘의 추천" 라벨 + AI 문장.
 * 사용자가 푸시를 지워도 이 카드로 오늘 조언을 다시 볼 수 있음(핵심 가치).
 *  - props: message(string, 이미 이름 치환 완료된 최종 문장) / loading(boolean)
 *  - loading이면 스켈레톤.
 */

interface Props {
  message: string;
  loading: boolean;
}

export default function AIBriefingCard({ message, loading }: Props) {
  // 혹시 남아있을 {name} 자리표시자는 방어적으로 제거
  const text = message.replace(/\{name\}님?,?\s*/g, "").trim();

  return (
    <section
      className="rounded-3xl bg-white/20 p-5 shadow-lg backdrop-blur-md"
      aria-label="오늘의 추천"
      aria-busy={loading}
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/80">
        오늘의 추천
      </p>

      {loading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-6 w-4/5 animate-pulse rounded-full bg-white/30" />
          <div className="h-6 w-3/5 animate-pulse rounded-full bg-white/25" />
        </div>
      ) : (
        <p
          className="text-2xl font-semibold leading-snug text-white"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
        >
          {text}
        </p>
      )}
    </section>
  );
}
