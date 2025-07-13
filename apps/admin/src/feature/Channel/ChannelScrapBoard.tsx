import { Button } from '@src/components/Button';
import { ChannelScrapEmptyState } from '@src/feature/Channel/ChannelScrapEmptyState';
import {
  clearAllScrapTargetChannelsAtom,
  removeScrapTargetChannelAtom,
  scrapTargetChannelsAtom,
} from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useAtom } from 'jotai';
import { MdClose, MdImage, MdVideoLibrary } from 'react-icons/md';

export function ChannelScrapBoard() {
  const [channels] = useAtom(scrapTargetChannelsAtom);
  const [, removeScrapChannel] = useAtom(removeScrapTargetChannelAtom);
  const [, clearAllScrapTargetChannels] = useAtom(clearAllScrapTargetChannelsAtom);

  const handleRemoveChannel = (url: string) => {
    removeScrapChannel(url);
  };

  const handleClearAll = () => {
    clearAllScrapTargetChannels();
  };

  if (channels.length === 0) {
    return <ChannelScrapEmptyState />;
  }

  return (
    <div
      className={css({
        w: '100%',
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
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearAll}
          className={css({
            color: 'error.600',
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
      </div>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        })}
      >
        {channels.map((channel) => (
          <div
            key={channel.url}
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
                  {channel.url}
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
                  onClick={() => handleRemoveChannel(channel.url)}
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
        ))}
      </div>
    </div>
  );
}
