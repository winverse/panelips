'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { ChannelEmptyState } from '@src/feature/Channel/ChannelEmptyState';
import { ChannelItem } from '@src/feature/Channel/ChannelItem';
import { ChannelList } from '@src/feature/Channel/ChannelList';
import { ChannelScrapBoard } from '@src/feature/Channel/ChannelScrapBoard';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { KeyboardEvent, useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { toast } from 'react-toastify';

export function ChannelManager() {
  const [channelUrl, setChannelUrl] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const trpc = useTRPC();

  const handleBulkScrap = () => {
    if (channels.length === 0) {
      toast.warning('스크랩할 채널이 없습니다.');
      return;
    }

    const confirmed = window.confirm(
      `${channels.length}개의 채널을 일괄 스크랩하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.`,
    );

    if (confirmed) {
      setIsScrapingInProgress(true);
    }
  };

  const handleRemoveChannel = (url: string) => {
    setChannels(channels.filter((channel) => channel !== url));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const inputUrl = event.currentTarget.value.trim();
      if (!inputUrl) {
        toast.error('URL을 입력해주세요.');
        return;
      }

      if (channels.includes(inputUrl)) {
        toast.warning('이미 추가된 채널입니다.');
        return;
      }

      const success = handleAddChannelUrl(inputUrl);
      if (success) {
        setChannelUrl('');
      }
    }
  };

  const handleAddButton = () => {
    if (!channelUrl.trim()) {
      toast.error('URL을 입력해주세요.');
      return;
    }

    if (channels.includes(channelUrl)) {
      toast.warning('이미 추가된 채널입니다.');
      return;
    }

    const success = handleAddChannelUrl(channelUrl);
    if (success) {
      setChannelUrl('');
    }
  };

  const handleAddChannelUrl = (url: string): boolean => {
    try {
      const parseUrl = new URL(url);
      const { origin, pathname } = parseUrl;

      if (!origin.includes('youtube.com') && !origin.includes('youtu.be')) {
        toast.error('유튜브 URL만 입력 가능합니다.');
        return false;
      }

      const channelId = pathname.split('/')[1];
      const normalizedUrl = decodeURIComponent(`${origin}/${channelId}`);

      console.log('normalizedUrl', normalizedUrl);
      if (channels.includes(normalizedUrl)) {
        toast.warning('이미 추가된 채널입니다.');
        return false;
      }

      setChannels([...channels, normalizedUrl]);
      toast.success('채널이 성공적으로 추가되었습니다.');
      return true;
    } catch (error) {
      toast.error('올바른 URL 형식이 아닙니다. 유효한 유튜브 채널 URL을 입력해주세요.');
      return false;
    }
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
        <Button size="md" variant="primary" type="button" onClick={handleAddButton}>
          추가
        </Button>
      </div>

      <div
        className={flex({
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '0.5rem',
          gap: '1rem',
        })}
      >
        <ChannelList channels={channels} removeItem={handleRemoveChannel} />
        <ChannelScrapBoard youtubeInfo={[]} />
      </div>
    </div>
  );
}
