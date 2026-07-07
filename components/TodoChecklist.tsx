"use client";

/**
 * components/TodoChecklist.tsx — 오늘 챙길 것 체크리스트 (담당 C, 차별화 기능)
 *
 * AI 문장 한 줄과 별개로, 오늘의 3축 판정에서 파생된 항목(우산·겉옷·손선풍기 등)을
 * 탭 가능한 칩으로 보여준다. 탭하면 "챙겼다"는 상태가 checklist_status에 즉시 저장되어
 * 다음에 다시 열어도 유지된다(습관 형성형 UX).
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChecklistItem } from "@/lib/checklist";

interface Props {
  items: ChecklistItem[];
  userId: string;
  date: string;
  initialChecked: string[];
}

export default function TodoChecklist({ items, userId, date, initialChecked }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set(initialChecked));

  const toggle = async (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setChecked(next); // 낙관적 업데이트 — 저장 결과를 기다리지 않고 바로 반영

    try {
      await supabase
        .from("checklist_status")
        .upsert(
          { user_id: userId, date, checked_items: Array.from(next) },
          { onConflict: "user_id,date" }
        );
    } catch {
      /* 저장 실패해도 화면 체크 상태는 유지(다음 로드 때 다시 동기화됨) */
    }
  };

  if (items.length === 0) {
    return (
      <section
        className="rounded-3xl bg-white/15 p-4 text-center backdrop-blur-md"
        aria-label="오늘 챙길 것"
      >
        <p className="text-sm text-white/85">오늘은 특별히 챙길 게 없어요, 편하게 나가세요 😊</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white/15 p-4 backdrop-blur-md" aria-label="오늘 챙길 것">
      <p className="mb-3 text-sm font-medium text-white/90">오늘 챙길 것</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={isChecked}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
                isChecked
                  ? "bg-white text-gray-800 shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isChecked && <span aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
