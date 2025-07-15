import { Button } from '@src/components/Button';
import { type ScrapVideo } from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import Image from 'next/image';
import { BsFiletypeJson } from 'react-icons/bs';
import { MdClose, MdImage } from 'react-icons/md';
import { TbScript } from 'react-icons/tb';

interface ChannelScrapItemProps {
  video: ScrapVideo;
  onRemove: (url: string) => void;
}

export function ChannelScrapItem({ video, onRemove }: ChannelScrapItemProps) {
  const isScriptCompleted = video.isScriptAnalysisComplete;
  const isJsonCompleted = video.isJsonAnalysisComplete;

  return (
    <div
      className={css({
        position: 'relative',
        bg: 'background.primary',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '12px',
        p: '1rem',
        transition: 'all 0.2s ease',
        opacity: isJsonCompleted && isScriptCompleted ? 0.6 : 1,
        _hover: {
          borderColor: 'border.secondary',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      })}
    >
      {/* Badges */}
      <div
        className={css({
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          display: 'flex',
          gap: '4px',
          zIndex: 10,
        })}
      >
        {isScriptCompleted && (
          <div
            className={css({
              bg: 'green.500',
              color: 'white',
              borderRadius: '50%',
              w: '20px',
              h: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            })}
            title="Script analysis completed"
          >
            <TbScript />
          </div>
        )}
        {isJsonCompleted && (
          <div
            className={css({
              bg: 'blue.500',
              color: 'white',
              borderRadius: '50%',
              w: '20px',
              h: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            })}
            title="JSON analysis completed"
          >
            <BsFiletypeJson />
          </div>
        )}
      </div>
      <div className={flex({ direction: 'row', gap: '0.75rem' })}>
        <div
          className={css({
            flexShrink: 0,
            w: '60px',
            h: '60px',
            bg: 'background.secondary',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          })}
        >
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              className={css({
                w: '100%',
                h: '100%',
                objectFit: 'cover',
              })}
              width={60}
              height={60}
            />
          ) : (
            <MdImage
              className={css({
                fontSize: '1.5rem',
                color: 'text.tertiary',
              })}
            />
          )}
        </div>

        {/* Content */}
        <div
          className={css({
            flex: 1,
            minW: 0,
          })}
        >
          <h4
            className={css({
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'text.primary',
              mb: '0.25rem',
              m: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
            title={video.title}
          >
            {video.title}
          </h4>
          <a
            className={css({
              fontSize: '0.75rem',
              color: 'text.secondary',
              m: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
            href={video.url}
            target="_blank"
          >
            {`${video.url.slice(0, 30)}...`}
          </a>
        </div>

        <div
          className={css({
            flexShrink: 0,
          })}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(video.url)}
            className={css({
              p: '0.375rem',
              minW: 'auto',
              color: 'text.tertiary',
              borderColor: 'transparent',
              _hover: {
                color: 'error.600',
                borderColor: 'error.200',
                bg: 'error.50',
              },
            })}
          >
            <MdClose />
          </Button>
        </div>
      </div>
    </div>
  );
}
