'use client';

import dynamic from 'next/dynamic';

export const DynamicThemeProvider = dynamic(
  () => import('./themeProvider').then((mod) => mod.ThemeProvider),
  {
    ssr: false,
  },
);
