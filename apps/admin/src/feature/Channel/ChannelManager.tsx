'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import { useTRPC } from '@src/lib/trpc';
import { addChannelAtom, channelsAtom, channelUrlAtom } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { KeyboardEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ChannelList } from './ChannelList';
import { ChannelScrapBoard } from './ScrapBoard';

export function ChannelManager() {
  const trpc = useTRPC();
  const [channelUrl, setChannelUrl] = useAtom(channelUrlAtom);
  const [channels] = useAtom(channelsAtom);
  const [, addChannel] = useAtom(addChannelAtom);
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);

  const { mutateAsync: googleLogin } = useMutation(trpc.automation.google.login.mutationOptions());
  const { data: channelData } = useQuery(trpc.youtube.getChannels.queryOptions());

  // URL-title 매핑 생성
  const channelTitleMap =
    channelData?.reduce(
      (acc, channel) => {
        acc[channel.url] = channel.title;
        return acc;
      },
      {} as Record<string, string>,
    ) || {};

  // URL-isLiked 매핑 생성
  const channelLikedMap =
    channelData?.reduce(
      (acc, channel) => {
        acc[channel.url] = channel.isLiked;
        return acc;
      },
      {} as Record<string, boolean>,
    ) || {};

  useEffect(() => {
    if (!channelData || !Array.isArray(channelData)) return;
    const result = channelData.map((channel) => {
      const { success, message } = addChannel(channel.url);
      if (!success) {
        console.error(message);
      }
      return success;
    });
    const success = result.every((s) => s);
    if (success) {
      toast.success('채널 자동 추가!');
    } else {
      toast.error('채널 자동 추가 실패!');
    }
  }, [channelData, addChannel]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoginLoading(true);
    try {
      const result = await googleLogin();
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          toast.success('✅ 구글 로그인 성공! 쿠키가 저장되었습니다.');
        } else {
          const error = 'error' in result ? result.error : '알 수 없는 오류';
          toast.error(`❌ 구글 로그인 실패: ${error || '알 수 없는 오류'}`);
        }
      } else {
        toast.error('❌ 구글 로그인 실패: 알 수 없는 오류');
      }
    } catch (error: any) {
      toast.error(`❌ 로그인 중 오류 발생: ${error.message || '알 수 없는 오류'}`);
      console.error('Google login error:', error);
    } finally {
      setIsGoogleLoginLoading(false);
    }
  };

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
        minH: '100%',
      })}
    >
      <div
        className={flex({
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '1rem',
        })}
      >
        <h2
          className={css({
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'text.primary',
            m: 0,
          })}
        >
          채널 관리
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoginLoading}
          className={css({
            color: 'primary.600',
            borderColor: 'primary.200',
            _hover: {
              color: 'primary.700',
              borderColor: 'primary.300',
              bg: 'primary.50',
            },
            _disabled: {
              opacity: 0.6,
              cursor: 'not-allowed',
            },
          })}
        >
          {isGoogleLoginLoading ? '로그인 중...' : '구글 로그인'}
        </Button>
      </div>
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
        <ChannelList
          channels={channels}
          channelTitleMap={channelTitleMap}
          channelLikedMap={channelLikedMap}
        />
        <ChannelScrapBoard />
      </div>
    </div>
  );
}
