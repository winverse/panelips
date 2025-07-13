import { Button } from '@src/components/Button';
import { type ScrapChannel } from '@src/store/channelAtoms';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdClose, MdImage } from 'react-icons/md';

interface ChannelScrapItemProps {
  channel: ScrapChannel;
  onRemove: (url: string) => void;
}

export function ChannelScrapItem({ channel, onRemove }: ChannelScrapItemProps) {
  return (
    <div
      className={css({
        bg: 'background.primary',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '12px',
        p: '1rem',
        transition: 'all 0.2s ease',
        _hover: {
          borderColor: 'border.secondary',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      })}
    >
      <div className={flex({ direction: 'row', gap: '0.75rem' })}>
        {/* Thumbnail */}
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
          {channel.thumbnail ? (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className={css({
                w: '100%',
                h: '100%',
                objectFit: 'cover',
              })}
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
            title={channel.title}
          >
            {channel.title}
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
            href={channel.url}
            target="_blank"
          >
            {`${channel.url.slice(0, 30)}...`}
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
            onClick={() => onRemove(channel.url)}
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
