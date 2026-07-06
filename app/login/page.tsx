'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidPhone = (value: string) => /^[0-9]{10,11}$/.test(value);

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('전화번호는 숫자 10~11자리로 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      // 전화번호로 기존 사용자인지 먼저 확인
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('user_id')
        .eq('phone', phone)
        .maybeSingle();

      if (selectError) throw selectError;

      let userId: string;

      if (existingUser) {
        userId = existingUser.user_id;
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ phone, name })
          .select('user_id')
          .single();

        if (insertError) throw insertError;
        userId = newUser.user_id;
      }

      localStorage.setItem('user_id', userId);

      // 온보딩(즐겨찾기 지역 + 알림 설정)을 이미 마쳤는지 확인해 분기
      const [{ data: favorites }, { data: settings }] = await Promise.all([
        supabase.from('favorite_locations').select('id').eq('user_id', userId).limit(1),
        supabase.from('user_settings').select('user_id').eq('user_id', userId).maybeSingle(),
      ]);

      if (favorites && favorites.length > 0 && settings) {
        router.push('/home');
      } else {
        router.push('/onboarding/region');
      }
    } catch (err) {
      console.error(err);
      setError('로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#7FB8E8] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] bg-white/90 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">안녕하세요</h1>
        <p className="text-gray-600 mb-8">오늘 뭘 챙겨야 할지, 저희가 알려드릴게요.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="01012345678"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white font-semibold rounded-lg py-3 mt-4 disabled:opacity-50"
        >
          {loading ? '확인 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
