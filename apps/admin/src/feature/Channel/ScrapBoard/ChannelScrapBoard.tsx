import { Button } from '@src/components/Button';
import { useTRPC } from '@src/lib/trpc';
import {
  clearAllScrapTargetChannelsAtom,
  removeScrapTargetChannelAtom,
  scrapTargetChannelsAtom,
} from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { MdVideoLibrary } from 'react-icons/md';
import { toast } from 'react-toastify';
import { ChannelScrapEmptyState } from './ChannelScrapEmptyState';
import { ChannelScrapItem } from './ChannelScrapItem';

export function ChannelScrapBoard() {
  const trpc = useTRPC();
  const [channels] = useAtom(scrapTargetChannelsAtom);
  const [, removeScrapChannel] = useAtom(removeScrapTargetChannelAtom);
  const [, clearAllScrapTargetChannels] = useAtom(clearAllScrapTargetChannelsAtom);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: scrapChannel } = useMutation(
    trpc.automation.youtubeChannel.scrap.mutationOptions(),
  );

  const handleRemoveChannel = (url: string) => {
    removeScrapChannel(url);
  };

  const handleClearAll = () => {
    clearAllScrapTargetChannels();
  };

  const handleGeminiScraping = async () => {
    if (channels.length === 0) {
      toast.warning('스크랩할 채널이 없습니다.');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      toast.info(`${channels.length}개 채널의 Gemini 분석을 시작합니다...`);

      for (const channel of channels) {
        console.log('channel', channel);
        try {
          const result = await scrapChannel({
            title: channel.title,
            description: channel.description,
            url: channel.url,
            channelId: channel.channelId,
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`채널 ${channel.title} 스크랩 실패:`, result.message);
          }
        } catch (error) {
          failCount++;
          console.error(`채널 ${channel.title} 스크랩 중 오류:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}개 채널의 Gemini 분석이 시작되었습니다.`);
      }
      if (failCount > 0) {
        toast.error(`${failCount}개 채널의 분석에 실패했습니다.`);
      }
    } catch (error) {
      console.error('Gemini 스크랩 중 전체 오류:', error);
      toast.error('Gemini 분석 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (channels.length === 0) {
    return <ChannelScrapEmptyState />;
  }

  return (
    <div
      className={css({
        w: '100%',
        maxH: '100%',
        scrollbar: 'auto',
      })}
    >
      <div
        className={css({
          mb: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          })}
        >
          <MdVideoLibrary
            className={css({
              fontSize: '1.2rem',
              color: 'primary.600',
            })}
          />
          <h3
            className={css({
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'text.primary',
              m: 0,
            })}
          >
            스크랩 대상 ({channels.length}개)
          </h3>
        </div>
        <div className={flex({ gap: '0.5rem' })}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className={css({
              color: 'error.600',
              mr: '0.5rem',
              borderColor: 'error.200',
              _hover: {
                color: 'error.700',
                borderColor: 'error.300',
                bg: 'error.50',
              },
            })}
          >
            전체 삭제
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleGeminiScraping}
            disabled={isProcessing || channels.length === 0}
            className={css({
              _disabled: {
                opacity: 0.6,
                cursor: 'not-allowed',
              },
            })}
          >
            {isProcessing ? 'Gemini 분석 중...' : 'GEMINI 요약하기'}
          </Button>
        </div>
      </div>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        })}
      >
        {channels.map((channel) => (
          <ChannelScrapItem key={channel.url} video={channel} onRemove={handleRemoveChannel} />
        ))}
      </div>
    </div>
  );
}
