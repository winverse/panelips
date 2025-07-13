import { Button } from '@src/components/Button';
import {
  clearAllScrapTargetChannelsAtom,
  removeScrapTargetChannelAtom,
  scrapTargetChannelsAtom,
} from '@src/store';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns'; // 새로 추가
import { useAtom } from 'jotai';
import { MdVideoLibrary } from 'react-icons/md';
import { ChannelScrapEmptyState } from './ChannelScrapEmptyState';
import { ChannelScrapItem } from './ChannelScrapItem';

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
            GEMINI 요약하기
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
          <ChannelScrapItem key={channel.url} channel={channel} onRemove={handleRemoveChannel} />
        ))}
      </div>
    </div>
  );
}
