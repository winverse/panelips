'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { addChannelAtom, channelsAtom, channelUrlAtom } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useAtom } from 'jotai';
import { KeyboardEvent } from 'react';
import { toast } from 'react-toastify';
import { ChannelList } from './List';
import { ChannelScrapBoard } from './Scrap';

export function ChannelManager() {
  const [channelUrl, setChannelUrl] = useAtom(channelUrlAtom);
  const [channels] = useAtom(channelsAtom);
  const [, addChannel] = useAtom(addChannelAtom);

  const handleAddChannel = (url: string) => {
    const { success, message } = addChannel(url);
    if (success) {
      toast.success(message);
      setChannelUrl('');
    } else {
      toast.warning(message);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddChannel(event.currentTarget.value);
    }
  };

  const handleAddButtonClick = () => {
    handleAddChannel(channelUrl);
  };

  return (
    <div
      className={css({
        p: '1rem',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '8px',
        h: '100%',
      })}
    >
      <h2
        className={css({
          fontSize: '1.2rem',
          fontWeight: 'bold',
          mb: '1rem',
          color: 'text.primary',
        })}
      >
        채널 관리
      </h2>
      <div className={flex({ gap: '0.5rem', mb: '1rem' })}>
        <Input
          type="text"
          placeholder="유튜브 채널 URL"
          value={channelUrl}
          onChange={(e) => setChannelUrl(decodeURIComponent(e.target.value))}
          onKeyDown={handleKeyDown}
          size="md"
          variant="outline"
          style={{ width: '400px' }}
        />
        <Button size="md" variant="primary" type="button" onClick={handleAddButtonClick}>
          추가
        </Button>
      </div>

      <div
        className={flex({
          justifyContent: 'space-between',
          alignItems: 'flex-top',
          mb: '0.5rem',
          gap: '1rem',
        })}
      >
        <ChannelList channels={channels} />
        <ChannelScrapBoard />
      </div>
    </div>
  );
}
