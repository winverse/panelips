// apps/admin/src/feature/ChannelManager/index.tsx
'use client';

import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { KeyboardEvent, useState } from 'react';

interface ChannelManagerProps {
  onSelectChannel: (channelUrl: string) => void;
}

export function ChannelManager({ onSelectChannel }: ChannelManagerProps) {
  const [channelUrl, setChannelUrl] = useState('');
  const [channels, setChannels] = useState<string[]>([]); // Placeholder for fetched channels
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleAddChannel = () => {
    if (channelUrl && !channels.includes(channelUrl)) {
      // TODO: Call tRPC to add channel to backend
      setChannels([...channels, channelUrl]);
      setChannelUrl('');
    }
  };

  const handleSelectChannel = (url: string) => {
    setSelectedChannel(url);
    onSelectChannel(url); // Call the prop function to update parent state
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, url: string) => {
    // Changed HTMLLIElement to HTMLButtonElement
    if (event.key === 'Enter' || event.key === ' ') {
      handleSelectChannel(url);
    }
  };

  return (
    <div
      className={css({ p: '1rem', border: '1px solid #eee', borderRadius: '8px', width: '300px' })}
    >
      <h2 className={css({ fontSize: '1.2rem', fontWeight: 'bold', mb: '1rem' })}>채널 관리</h2>
      <div className={flex({ gap: '0.5rem', mb: '1rem' })}>
        <input
          type="text"
          placeholder="유튜브 채널 URL"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          className={css({
            p: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flexGrow: 1,
          })}
        />
        <button
          type="button" // Added type="button"
          onClick={handleAddChannel}
          className={css({
            p: '0.5rem 1rem',
            bg: '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            _hover: { bg: '#0056b3' },
          })}
        >
          추가
        </button>
      </div>

      <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', mb: '0.5rem' })}>저장된 채널</h3>
      <ul className={css({ listStyle: 'none', p: 0 })}>
        {channels.length === 0 ? (
          <li className={css({ color: '#666' })}>아직 추가된 채널이 없습니다.</li>
        ) : (
          channels.map((channel) => (
            <button // Changed <li> to <button>
              key={channel}
              type="button" // Explicitly set type to button
              onClick={() => handleSelectChannel(channel)}
              onKeyDown={(event) => handleKeyDown(event, channel)}
              className={css({
                width: '100%',
                textAlign: 'left',
                p: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                mb: '0.5rem',
                cursor: 'pointer',
                backgroundColor: selectedChannel === channel ? '#e6f7ff' : 'white',
                _hover: { backgroundColor: '#f0f0f0' },
                background: 'none',
                color: 'inherit',
                font: 'inherit',
                outline: 'none',
                // Add focus style if needed: _focus: { outline: '2px solid blue' }
              })}
            >
              {channel}
            </button>
          ))
        )}
      </ul>
    </div>
  );
}
