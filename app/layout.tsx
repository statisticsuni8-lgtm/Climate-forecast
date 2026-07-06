import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '오늘 뭐 입지',
  description: '오늘의 날씨 브리핑을 전해드려요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
