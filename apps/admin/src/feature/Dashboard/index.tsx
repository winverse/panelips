// apps/admin/src/feature/Dashboard/index.tsx
'use client';

import { DashboardLayout } from '@src/components/DashboardLayout';
import { ChannelManager } from '@src/feature/ChannelManager';
import { GoogleLogin } from '@src/feature/GoogleLogin'; // Import GoogleLogin
import { NewVideoList } from '@src/feature/NewVideoList';
import { css } from '@styled-system/css';
import { useState } from 'react'; // Removed React, flex import is not used in this file

type View = 'channelManagement' | 'newVideos' | 'googleLogin'; // Add 'googleLogin'

export function Dashboard() {
  const [activeView, setActiveView] = useState<View>('channelManagement');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleChannelSelect = (channelUrl: string) => {
    setSelectedChannel(channelUrl);
    setActiveView('newVideos'); // Automatically switch to new videos view when a channel is selected
  };

  const renderContent = () => {
    switch (activeView) {
      case 'channelManagement':
        return <ChannelManager onSelectChannel={handleChannelSelect} />;
      case 'newVideos':
        return <NewVideoList channelUrl={selectedChannel} />;
      case 'googleLogin': // Render GoogleLogin component
        return <GoogleLogin />;
      default:
        return <ChannelManager onSelectChannel={handleChannelSelect} />;
    }
  };

  const sidebarContent = (
    <>
      <h3 className={css({ fontSize: '1.1rem', fontWeight: 'bold', mb: '1rem' })}>메뉴</h3>
      <button
        type="button" // Added type="button"
        onClick={() => setActiveView('channelManagement')}
        className={css({
          width: '100%',
          textAlign: 'left',
          p: '0.75rem 1rem',
          bg: activeView === 'channelManagement' ? '#e2e6ea' : 'transparent',
          color: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          _hover: { bg: '#e2e6ea' },
        })}
      >
        채널 관리
      </button>
      <button
        type="button" // Added type="button"
        onClick={() => setActiveView('newVideos')}
        className={css({
          width: '100%',
          textAlign: 'left',
          p: '0.75rem 1rem',
          bg: activeView === 'newVideos' ? '#e2e6ea' : 'transparent',
          color: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          _hover: { bg: '#e2e6ea' },
        })}
      >
        새 동영상 목록
      </button>
      <button // New Google Login button
        type="button" // Added type="button"
        onClick={() => setActiveView('googleLogin')}
        className={css({
          width: '100%',
          textAlign: 'left',
          p: '0.75rem 1rem',
          bg: activeView === 'googleLogin' ? '#e2e6ea' : 'transparent',
          color: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          _hover: { bg: '#e2e6ea' },
        })}
      >
        구글 로그인
      </button>
    </>
  );

  return <DashboardLayout sidebar={sidebarContent}>{renderContent()}</DashboardLayout>;
}
