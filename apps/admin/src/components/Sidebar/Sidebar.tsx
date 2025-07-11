import { Button } from '@src/components/Button';
import { css } from '@styled-system/css';
import Link from 'next/link';
import { useState } from 'react';

type View = 'channelManagement' | 'newVideos' | 'googleLogin';

export function Sidebar() {
  const menuItems = [
    { id: 'channelManagement', label: '채널 관리', href: '/' },
    { id: 'googleLogin', label: '구글 관리', href: '/google' },
    { id: 'trpc-panel', label: 'trpc panel', href: '/api/panel' },
  ];

  return (
    <nav>
      <h3 className={css({ fontSize: '1.1rem', fontWeight: 'bold', mb: '1rem' })}>메뉴</h3>
      <ul>
        {menuItems.map((item) => (
          <li className={css({ w: '100%' })} key={item.id}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
