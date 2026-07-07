'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

export default function TimeOnboardingPage() {
  const router = useRouter();
  const [pushTime, setPushTime] = useState('07:00');
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleFinish = async () => {
    setError('');

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/login');
      return;
    }
    if (weekdays.length === 0) {
      setError('알림 받을 요일을 하나 이상 선택해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: upsertError } = await supabase.from('user_settings').upsert({
        user_id: userId,
        push_time: pushTime,
        weekdays,
        push_enabled: true,
      });

      if (upsertError) throw upsertError;
      router.push('/home');
    } catch (err) {
      console.error(err);
      setError('설정 저장 중 문제가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#8FC4F0_0%,#7FB8E8_100%)] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/40 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(15,45,90,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex gap-1.5">
          <span className="h-1.5 w-6 rounded-full bg-blue-500" />
          <span className="h-1.5 w-6 rounded-full bg-blue-500" />
          <span className="h-1.5 w-6 rounded-full bg-blue-500" />
        </div>

        <p className="mb-3 text-4xl">⏰</p>
        <h1 className="mb-2 text-[22px] font-bold tracking-tight text-gray-900">
          언제 알려드릴까요?
        </h1>
        <p className="mb-6 text-[15px] text-gray-500">매일 이 시간에 오늘의 브리핑을 보내드려요.</p>

        <label className="mb-1.5 block text-sm font-medium text-gray-600">알림 시각</label>
        <input
          type="time"
          value={pushTime}
          onChange={(e) => setPushTime(e.target.value)}
          className="mb-6 w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3.5 text-[15px] text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
        />

        <label className="mb-2 block text-sm font-medium text-gray-600">알림 요일</label>
        <div className="mb-6 flex gap-2">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={day}
              onClick={() => toggleWeekday(day)}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                weekdays.includes(day)
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? '저장 중...' : '완료'}
        </button>
      </div>
    </div>
  );
}
