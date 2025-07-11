import { ChannelEmptyState } from '@src/feature/Channel/ChannelEmptyState';
import { ChannelItem } from '@src/feature/Channel/ChannelItem';
import { css } from '@styled-system/css';

type ChannelListProps = {
  channels: string[];
  removeItem: (url: string) => void;
};

export function ChannelList({ channels, removeItem: handleRemoveChannel }: ChannelListProps) {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
        flexDir: 'column',
        w: '50%',
        border: '1px solid',
        borderColor: 'border.primary',
        borderRadius: '8px',
        p: '1rem',
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
      <ul className={css({ listStyle: 'none', p: 0, w: '100%', mt: '1rem' })}>
        {channels.length === 0 ? (
          <ChannelEmptyState />
        ) : (
          channels.map((channel) => (
            <ChannelItem key={channel} removeItem={handleRemoveChannel} channel={channel} />
          ))
        )}
      </ul>
    </div>
  );
}
