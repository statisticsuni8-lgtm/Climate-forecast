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
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#8FC4F0_0%,#7FB8E8_100%)] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/40 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(15,45,90,0.35)] backdrop-blur-xl">
        <p className="mb-3 text-4xl">☀️</p>
        <h1 className="mb-2 text-[26px] font-bold tracking-tight text-gray-900">안녕하세요</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-gray-500">
          오늘 뭘 챙겨야 할지, 저희가 알려드릴게요.
        </p>

        <label className="mb-1.5 block text-sm font-medium text-gray-600">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
        />

        <label className="mb-1.5 block text-sm font-medium text-gray-600">전화번호</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="01012345678"
          className="mb-2 w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
        />

        {error && <p className="mb-2 text-sm font-medium text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? '확인 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
