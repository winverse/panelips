'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { KeyboardEvent, useState } from 'react';

export function ChannelManager() {
  const [channelUrl, setChannelUrl] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleAddChannel = () => {
    if (channelUrl && !channels.includes(channelUrl)) {
      setChannels([...channels, channelUrl]);
      setChannelUrl('');
    }
  };

  const handleRemoveChannel = (url: string) => {
    setChannels(channels.filter((channel) => channel !== url));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setSelectedChannel(event.currentTarget.value);
    }
  };

  return (
    <div className={css({ p: '1rem', border: '1px solid #eee', borderRadius: '8px' })}>
      <h2 className={css({ fontSize: '1.2rem', fontWeight: 'bold', mb: '1rem' })}>채널 관리</h2>
      <div className={flex({ gap: '0.5rem', mb: '1rem' })}>
        <Input
          type="text"
          placeholder="유튜브 채널 URL"
          value={decodeURIComponent(channelUrl)}
          onChange={(e) => setChannelUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          size="md"
          variant="outline"
          style={{ width: '400px' }}
        />
        <Button size="md" variant="primary" type="button" onClick={handleAddChannel}>
          추가
        </Button>
      </div>

      <h3 className={css({ fontSize: '1rem', fontWeight: 'bold', mb: '0.5rem' })}>저장된 채널</h3>
      <ul className={css({ listStyle: 'none', p: 0 })}>
        {channels.length === 0 ? (
          <li className={css({ color: '#666' })}>Empty Video List</li>
        ) : (
          channels.map((channel) => (
            <li
              key={channel}
              className={flex({ mb: '0.5rem', direction: 'row', alignItems: 'center' })}
            >
              <Button
                size="sm"
                variant="outline"
                key={channel}
                type="button"
                onClick={() => handleRemoveChannel(channel)}
              >
                {decodeURIComponent(channel)}
              </Button>
              <div className={css({ ml: '0.5rem' })}>
                <Button size="sm" variant="primary">
                  영상 업데이트
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
