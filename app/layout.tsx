import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

// 시스템 폰트만 쓰면 브라우저 기본 세리프/산세리프로 밋밋하게 보이던 문제 수정.
// 공통기반 디자인 규칙: "시스템 기본 (Pretendard 권장, 없으면 sans-serif)".
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: '오늘 뭐 입지',
  description: '오늘의 날씨 브리핑을 전해드려요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className="font-sans antialiased bg-[#7FB8E8]">{children}</body>
    </html>
  );
}
