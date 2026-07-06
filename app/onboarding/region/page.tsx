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
    <div className="min-h-screen bg-[#7FB8E8] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] bg-white/90 rounded-2xl shadow-lg p-8">
        <div className="flex gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">어느 지역 날씨가 궁금하세요?</h1>
        <p className="text-gray-600 mb-6">동네 이름으로 검색해 주세요.</p>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 강남구"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="mb-4 min-h-[80px]">
          {searching && <p className="text-sm text-gray-400">검색 중...</p>}
          {!searching && keyword.trim() && results.length === 0 && (
            <p className="text-sm text-gray-400">다른 지역명으로 검색해 보세요.</p>
          )}
          <ul className="divide-y divide-gray-100">
            {results.map((region) => (
              <li key={region.region_id}>
                <button
                  onClick={() => setSelected(region)}
                  className={`w-full text-left px-4 py-3 rounded-lg ${
                    selected?.region_id === region.region_id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {region.region_name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleNext}
          disabled={!selected || loading}
          className="w-full bg-blue-500 text-white font-semibold rounded-lg py-3 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '다음'}
        </button>
      </div>
    </div>
  );
}
