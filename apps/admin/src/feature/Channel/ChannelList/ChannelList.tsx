import { Button } from '@src/components/Button';
import { useTRPC } from '@src/lib/trpc';
import { addScrapChannelAtom, ScrapVideo } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useQueries } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { ChannelEmptyState } from './ChannelEmptyState';
import { ChannelItem } from './ChannelItem';

type ChannelListProps = {
  channels: string[];
  channelTitleMap: Record<string, string>;
};

export function ChannelList({ channels, channelTitleMap }: ChannelListProps) {
  const trpc = useTRPC();
  const [, addScrapChannel] = useAtom(addScrapChannelAtom);

  // Fetch data for all channels
  const channelQueries = useQueries({
    queries: channels.map((channel) => ({
      ...trpc.youtube.getNewVideo.queryOptions({
        url: channel,
      }),
      enabled: channels.length > 0,
    })),
  });

  const handleBulkScrap = () => {
    // Check if all queries are successful and have data
    const allChannelData: ScrapVideo[] = [];
    let hasError = false;
    let errorMessage = '일부 채널 정보를 가져오는데 실패했습니다.';

    for (const query of channelQueries) {
      if (query.isError) {
        hasError = true;

        // YouTube API 쿼터 초과 에러 확인
        const error = query.error as any;
        if (error?.message?.includes('YouTube API 일일 사용량 한도를 초과했습니다')) {
          errorMessage = 'YouTube API 일일 사용량 한도를 초과했습니다. 내일 다시 시도해주세요.';
        } else if (error?.message?.includes('YouTube API 요청 오류')) {
          errorMessage = 'YouTube API 요청에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error?.message?.includes('YouTube 서버에 일시적인 문제')) {
          errorMessage = 'YouTube 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        break;
      }
      if (query.data && Array.isArray(query.data)) {
        allChannelData.push(...query.data);
      }
    }

    if (hasError) {
      toast.error(errorMessage);
      return;
    }

    if (allChannelData.length === 0) {
      toast.warning('스크랩할 영상이 없습니다.');
      return;
    }

    addScrapChannel(allChannelData);
    toast.success(`${allChannelData.length}개의 영상이 스크랩 대상에 추가되었습니다.`);
  };

  // Check if any queries are still loading
  const isLoading = channelQueries.some((query) => query.isPending);

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
        flexDir: 'column',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '8px',
        p: '1rem',
      })}
    >
      <div
        className={flex({
          justifyContent: 'space-around',
          alignItems: 'center',
          mb: '1rem',
          w: '100%',
        })}
      >
        <h3
          className={css({
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'text.primary',
            w: '100%',
          })}
        >
          저장된 채널
        </h3>
        <Button
          size="sm"
          variant="primary"
          type="button"
          onClick={handleBulkScrap}
          disabled={channels.length === 0 || isLoading}
        >
          {isLoading ? '로딩중...' : '일괄 스크랩'}
        </Button>
      </div>
      <ul className={css({ listStyle: 'none', p: 0, w: '100%' })}>
        {channels.length === 0 ? (
          <ChannelEmptyState />
        ) : (
          channels.map((channel) => (
            <ChannelItem key={channel} channel={channel} channelTitle={channelTitleMap[channel]} />
          ))
        )}
      </ul>
    </div>
  );
}
