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
    <div className="min-h-screen bg-[#7FB8E8] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] bg-white/90 rounded-2xl shadow-lg p-8">
        <div className="flex gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="w-2 h-2 rounded-full bg-blue-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">언제 알려드릴까요?</h1>
        <p className="text-gray-600 mb-6">매일 이 시간에 오늘의 브리핑을 보내드려요.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">알림 시각</label>
        <input
          type="time"
          value={pushTime}
          onChange={(e) => setPushTime(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">알림 요일</label>
        <div className="flex gap-2 mb-6">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={day}
              onClick={() => toggleWeekday(day)}
              className={`w-10 h-10 rounded-full text-sm font-semibold ${
                weekdays.includes(day) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full bg-blue-500 text-white font-semibold rounded-lg py-3 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '완료'}
        </button>
      </div>
    </div>
  );
}
