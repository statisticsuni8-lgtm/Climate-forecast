'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { searchRegions } from '@/lib/regionGrid';
import type { Region } from '@/lib/types';

export default function RegionOnboardingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Region[]>([]);
  const [selected, setSelected] = useState<Region | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 입력 후 300ms 뒤에 검색 (디바운스)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!keyword.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const regions = await searchRegions(keyword);
        setResults(regions);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleNext = async () => {
    setError('');

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/login');
      return;
    }
    if (!selected) {
      setError('지역을 선택해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('favorite_locations')
        .insert({ user_id: userId, region_id: selected.region_id });

      if (insertError) throw insertError;
      router.push('/onboarding/time');
    } catch (err) {
      console.error(err);
      setError('지역 저장 중 문제가 발생했어요. 다시 시도해 주세요.');
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
          <span className="h-1.5 w-6 rounded-full bg-gray-200" />
        </div>

        <p className="mb-3 text-4xl">📍</p>
        <h1 className="mb-2 text-[22px] font-bold tracking-tight text-gray-900">
          어느 지역 날씨가 궁금하세요?
        </h1>
        <p className="mb-6 text-[15px] text-gray-500">동네 이름으로 검색해 주세요.</p>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 강남구"
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
        />

        <div className="mb-4 min-h-[80px]">
          {searching && <p className="text-sm text-gray-400">검색 중...</p>}
          {!searching && keyword.trim() && results.length === 0 && (
            <p className="text-sm text-gray-400">다른 지역명으로 검색해 보세요.</p>
          )}
          <ul className="space-y-1">
            {results.map((region) => (
              <li key={region.region_id}>
                <button
                  onClick={() => setSelected(region)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-[15px] transition ${
                    selected?.region_id === region.region_id
                      ? 'bg-blue-500 font-semibold text-white shadow-md shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {region.region_name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

        <button
          onClick={handleNext}
          disabled={!selected || loading}
          className="w-full rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? '저장 중...' : '다음'}
        </button>
      </div>
    </div>
  );
}
