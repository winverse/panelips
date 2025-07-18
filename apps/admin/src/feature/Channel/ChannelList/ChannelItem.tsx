import { Button } from '@src/components/Button';
import { Spinner } from '@src/components/Spinner';
import { useTooltip } from '@src/hooks/useTooltip';
import { useTRPC } from '@src/lib/trpc';
import { addScrapChannelAtom, removeChannelAtom, ScrapVideo } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { MdMailOutline, MdMovie } from 'react-icons/md';
import { toast } from 'react-toastify';

type ChannelItemProps = {
  channel: string;
};

export function ChannelItem({ channel }: ChannelItemProps) {
  const trpc = useTRPC();
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
          {decodeURIComponent(channel)}
        </Button>
        <tooltip.TooltipComponent />
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
