import { Button } from '@src/components/Button';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';

type ChannelItemProps = {
  channel: string;
  removeItem: (channel: string) => void;
};

export function ChannelItem({ channel, removeItem }: ChannelItemProps) {
  return (
    <li key={channel} className={flex({ mb: '0.5rem', direction: 'row', alignItems: 'center' })}>
      <Button
        size="sm"
        variant="outline"
        key={channel}
        type="button"
        onClick={() => removeItem(channel)}
      >
        {decodeURIComponent(channel)}
      </Button>
      <div className={css({ ml: '0.5rem' })}>
        <Button size="sm" variant="primary">
          영상 업데이트
        </Button>
      </div>
    </li>
  );
}
