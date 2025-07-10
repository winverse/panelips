// apps/admin/src/feature/Dashboard/index.tsx
'use client';

import { DashboardLayout } from '@src/components/DashboardLayout';
import { ChannelManager } from '@src/feature/ChannelManager';
import { GoogleLogin } from '@src/feature/GoogleLogin';
import { NewVideoList } from '@src/feature/NewVideoList';
import { css, cva } from '@styled-system/css';
import { useState } from 'react';

const menuItemStyle = cva({
  base: {
    width: '100%',
    textAlign: 'left',
    p: '0.75rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    _hover: { bg: 'gray.300' },
    display: 'block',
  },
  variants: {
    active: {
      true: {
        bg: 'button',
      },
      false: {
        bg: 'transparent',
      },
    },
  },
});

type View = 'channelManagement' | 'newVideos' | 'googleLogin';

export function Dashboard() {
  const [activeView, setActiveView] = useState<View>('channelManagement');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleChannelSelect = (channelUrl: string) => {
    setSelectedChannel(channelUrl);
    setActiveView('newVideos');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'channelManagement':
        return <ChannelManager onSelectChannel={handleChannelSelect} />;
      case 'newVideos':
        return <NewVideoList channelUrl={selectedChannel} />;
      case 'googleLogin':
        return <GoogleLogin />;
      default:
        return <ChannelManager onSelectChannel={handleChannelSelect} />;
    }
  };

  const menuItems = [
    { id: 'channelManagement', label: '채널 관리' },
    { id: 'newVideos', label: '새 동영상 목록' },
    { id: 'googleLogin', label: '구글 로그인' },
  ];

  const sidebarContent = (
    <nav>
      <h3 className={css({ fontSize: '1.1rem', fontWeight: 'bold', mb: '1rem' })}>메뉴</h3>
      <ul className={css({ listStyle: 'none', p: 0, m: 0 })}>
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActiveView(item.id as View)}
              className={menuItemStyle({ active: activeView === item.id })}
            >
              {item.label}
            </button>
          </li>
        ))}
        <li>
          <a
            href="/api/panel"
            target="_blank"
            rel="noopener noreferrer"
            className={menuItemStyle({ active: false })}
          >
            tRPC Panel
          </a>
        </li>
      </ul>
    </nav>
  );

  return <DashboardLayout sidebar={sidebarContent}>{renderContent()}</DashboardLayout>;
}
