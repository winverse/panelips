import { Button } from '@src/components/Button';
import { Spinner } from '@src/components/Spinner';
import { useTooltip } from '@src/hooks/useTooltip';
import { useTRPC } from '@src/lib/trpc';
import { addScrapChannelAtom, removeChannelAtom, ScrapVideo } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { MdFavorite, MdFavoriteBorder, MdMailOutline, MdMovie } from 'react-icons/md';
import { toast } from 'react-toastify';

type ChannelItemProps = {
  channel: string;
  channelTitle?: string;
  isLiked: boolean;
};

export function ChannelItem({ channel, channelTitle, isLiked }: ChannelItemProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [_, addScrapChannel] = useAtom(addScrapChannelAtom);

  const [, removeChannel] = useAtom(removeChannelAtom);
  const { isPending, data } = useQuery(
    trpc.youtube.getNewVideo.queryOptions({
      url: channel,
    }),
  );

  const tooltip = useTooltip({
    content: '클릭하여 삭제',
    position: 'top',
  });

  const { mutateAsync: toggleChannelLike } = useMutation(
    trpc.youtube.toggleChannelLike.mutationOptions(),
  );

  const handleToggleLike = async () => {
    try {
      const result = await toggleChannelLike({ url: channel });
      if (result.success) {
        // 채널 목록 쿼리를 무효화하여 새로운 데이터를 가져오도록 함
        queryClient.invalidateQueries({ queryKey: ['youtube', 'getChannels'] });
        toast.success(result.isLiked ? '채널을 좋아요했습니다!' : '채널 좋아요를 취소했습니다!');
      } else {
        toast.error('좋아요 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      toast.error('좋아요 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const _handelAddScrapChannel = (channels: ScrapVideo[]) => {
    addScrapChannel(channels);
    toast.success('스크랩 대상에 추가 되었습니다.');
  };

  return (
    <div className={css({ mb: '0.5rem' })}>
      <li key={channel} className={flex({ direction: 'row', alignItems: 'center' })}>
        <Button
          size="sm"
          variant="outline"
          key={channel}
          type="button"
          onClick={() => removeChannel(channel)}
          {...tooltip.tooltipProps}
        >
          {channelTitle || decodeURIComponent(channel)}
        </Button>
        <tooltip.TooltipComponent />

        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={handleToggleLike}
          className={css({
            ml: '0.5rem',
            color: isLiked ? 'red.500' : 'gray.400',
            _hover: {
              color: isLiked ? 'red.600' : 'red.500',
            },
          })}
        >
          {isLiked ? <MdFavorite size={18} /> : <MdFavoriteBorder size={18} />}
        </Button>
        {isPending && (
          <div
            className={css({
              ml: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              px: '0.75rem',
              py: '0.375rem',
              bg: 'background.secondary',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'border.primary',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            })}
          >
            <Spinner size="sm" />
            <span>영상 정보 로딩중...</span>
          </div>
        )}
        {!!data && Array.isArray(data) && (
          <div
            className={css({ ml: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' })}
          >
            <div
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                px: '0.75rem',
                py: '0.375rem',
                bg: data.length > 0 ? 'success.100' : 'background.secondary',
                color: data.length > 0 ? 'success.700' : 'text.secondary',
                border: '1px solid',
                borderColor: data.length > 0 ? 'success.500' : 'border.primary',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
              })}
            >
              <span
                className={css({
                  fontSize: '0.9rem',
                })}
              >
                {data.length > 0 ? <MdMovie /> : <MdMailOutline />}
              </span>
              <span>{data.length > 0 ? `${data.length}개 신규 영상` : '신규 영상 없음'}</span>
            </div>
          </div>
        )}
      </li>
    </div>
  );
}
