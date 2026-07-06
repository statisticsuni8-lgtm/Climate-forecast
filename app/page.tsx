'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    router.replace(userId ? '/home' : '/login');
  }, [router]);

  return null;
}
