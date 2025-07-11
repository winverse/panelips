import { Button } from '@src/components/Button';
import { useTooltip } from '@src/hooks/useTooltip';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MdDownload, MdMailOutline, MdMovie } from 'react-icons/md';

type ChannelItemProps = {
  channel: string;
  removeItem: (channel: string) => void;
};


export function ChannelItem({ channel, removeItem }: ChannelItemProps) {
  const [showVideoList, setShowVideoList] = useState(false);
  const trpc = useTRPC();
  const { isPending, data } = useQuery(
    trpc.youtube.getNewVideo.queryOptions({
      url: channel,
    }),
  );

  const tooltip = useTooltip({
    content: '클릭하여 삭제',
    position: 'top',
  });

  return (
    <div className={css({ mb: '0.5rem' })}>
      <li key={channel} className={flex({ direction: 'row', alignItems: 'center' })}>
        <Button
          size="sm"
          variant="outline"
          key={channel}
          type="button"
          onClick={() => removeItem(channel)}
          {...tooltip.tooltipProps}
        >
          {decodeURIComponent(channel)}
        </Button>
        <tooltip.TooltipComponent />
        {data && (
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
            <Button
              size="sm"
              variant="primary"
              type="button"
              onClick={() => setShowVideoList(!showVideoList)}
              className={css({ display: 'flex', alignItems: 'center', gap: '0.25rem' })}
            >
              <MdDownload />
              스크랩
            </Button>
          </div>
        )}
      </li>
      {showVideoList && data && data.length > 0 && (
        <div
          className={css({
            mt: '0.5rem',
            ml: '1rem',
            p: '1rem',
            bg: 'background.secondary',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'border.primary',
          })}
        >
          <h4 className={css({ mb: '0.75rem', fontSize: '0.9rem', fontWeight: '600' })}>
            신규 영상 목록
          </h4>
          <div className={css({ display: 'grid', gap: '0.75rem' })}>
            {data.map((video, index) => (
              <div
                key={index}
                className={css({
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  p: '0.5rem',
                  bg: 'background.primary',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: 'border.secondary',
                })}
              >
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={css({
                      width: '80px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0,
                    })}
                  />
                )}
                <div className={css({ flex: 1, minWidth: 0 })}>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css({
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: 'text.primary',
                      textDecoration: 'none',
                      lineHeight: '1.4',
                      _hover: {
                        color: 'primary.600',
                        textDecoration: 'underline',
                      },
                    })}
                  >
                    {video.title}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
