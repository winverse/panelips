import { css } from '@styled-system/css';
import Link from 'next/link';

export function Sidebar() {
  const menuItems = [
    { id: 'channels', label: '채널 관리', href: '/' },
    { id: 'google', label: '구글 관리', href: '/google' },
    { id: 'panels', label: '패널 관리', href: '/panels' },
    { id: 'trpc-panel', label: 'API', href: '/api/panel' },
  ];

  return (
    <nav>
      <h3 className={css({ fontSize: '1.1rem', fontWeight: 'bold', mb: '1rem' })}>메뉴</h3>
      <ul>
        {menuItems.map((item, index) => (
          <li
            className={css({ w: '100%', mt: index === menuItems.length - 1 ? 'auto' : '0' })}
            key={item.id}
          >
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
