import '@src/styles/globals.css';
import { ReactQueryProvider } from '@src/providers/reactQueryProvider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Panelips - 전문가 예측 검증 플랫폼',
  description:
    '유튜브 패널 프로그램 전문가들의 발언을 자동 수집·분석하여 예측 정확도를 검증하여 신뢰할 수 있는 미래 전망을 제공',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
