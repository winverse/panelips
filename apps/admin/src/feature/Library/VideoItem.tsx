import { Button } from '@src/components/Button';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { format } from 'date-fns';
import { MdDownload } from 'react-icons/md';
import type { VideoData } from './downloadUtils';
import { VideoDetails } from './VideoDetails';

interface VideoItemProps {
  video: VideoData;
  isSelected: boolean;
  onToggleDetails: (videoId: string) => void;
  onDownloadScript: (data: any, filename: string) => void;
  onDownloadJson: (data: any, filename: string) => void;
}

export function VideoItem({
  video,
  isSelected,
  onToggleDetails,
  onDownloadScript,
  onDownloadJson,
}: VideoItemProps) {
  return (
    <div
      className={css({
        p: '1rem',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '8px',
        bg: 'background.secondary',
      })}
    >
      <div
        className={flex({
          justifyContent: 'space-between',
          alignItems: 'start',
          mb: '0.5rem',
        })}
      >
        <div className={css({ flex: 1 })}>
          <h3
            className={css({
              fontSize: '1.1rem',
              fontWeight: '600',
              mb: '0.5rem',
              color: 'text.primary',
            })}
          >
            {video.title}
          </h3>
          <div
            className={css({
              fontSize: '0.9rem',
              color: 'text.secondary',
              mb: '0.5rem',
            })}
          >
            채널: {video.channelTitle} | 게시일:{' '}
            {format(new Date(video.publishedAt), 'yyyy-MM-dd HH:mm')}
          </div>
          <div className={flex({ gap: '1rem', fontSize: '0.8rem' })}>
            <span
              className={css({
                color: video.hasScript ? 'green.600' : 'red.600',
                fontWeight: '500',
              })}
            >
              스크립트: {video.hasScript ? '있음' : '없음'}
            </span>
            <span
              className={css({
                color: video.hasJson ? 'green.600' : 'red.600',
                fontWeight: '500',
              })}
            >
              JSON: {video.hasJson ? '있음' : '없음'}
            </span>
          </div>
        </div>

        <div className={flex({ gap: '0.5rem' })}>
          {video.hasScript && (
            <Button
              type="button"
              onClick={() => onDownloadScript(video.scriptData, `script_${video.videoId}.json`)}
              variant="primary"
              size="sm"
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
              })}
            >
              <MdDownload size={14} />
              스크립트
            </Button>
          )}

          {video.hasJson && (
            <Button
              type="button"
              onClick={() => onDownloadJson(video.jsonData, `json_${video.videoId}.json`)}
              variant="secondary"
              size="sm"
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
                bg: 'primary.500',
                _hover: { bg: 'primary.600' },
              })}
            >
              <MdDownload size={14} />
              JSON
            </Button>
          )}
        </div>
      </div>

      <Button
        type="button"
        onClick={() => onToggleDetails(video.id)}
        variant="ghost"
        size="sm"
        className={css({
          fontSize: '0.8rem',
          color: 'primary.600',
          textDecoration: 'underline',
          _hover: { color: 'primary.700' },
        })}
      >
        {isSelected ? '상세 정보 숨기기' : '상세 정보 보기'}
      </Button>

      {isSelected && <VideoDetails video={video} />}
    </div>
  );
}
