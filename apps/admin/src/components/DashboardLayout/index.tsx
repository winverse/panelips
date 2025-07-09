// apps/admin/src/components/DashboardLayout/index.tsx
'use client';

import React, { ReactNode } from 'react';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  return (
    <div className={flex({ height: '100vh', width: '100vw' })}>
      <aside
        className={css({
          width: '250px',
          bg: '#f8f9fa',
          borderRight: '1px solid #e9ecef',
          p: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        })}
      >
        {sidebar}
      </aside>
      <main
        className={css({
          flexGrow: 1,
          p: '1rem',
          overflowY: 'auto',
        })}
      >
        {children}
      </main>
    </div>
  );
}
