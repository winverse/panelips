import { Button } from '@src/components/Button';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

type ChannelItemProps = {
  channel: string;
  removeItem: (channel: string) => void;
};

export function ChannelItem({ channel, removeItem }: ChannelItemProps) {
  const trpc = useTRPC();
  const { isPending, data } = useQuery(
    trpc.youtube.getNewVideo.queryOptions({
      url: channel,
    }),
  );

  return (
    <li key={channel} className={flex({ mb: '0.5rem', direction: 'row', alignItems: 'center' })}>
      <Button
        size="sm"
        variant="outline"
        key={channel}
        type="button"
        onClick={() => removeItem(channel)}
        isLoading={isPending}
      >
        {decodeURIComponent(channel)}
      </Button>
      <div className={css({ ml: '0.5rem' })}>
        <Button size="sm" variant="primary">
          영상 업데이트
        </Button>
      </div>
      {data && <div className={css({ ml: '0.5rem' })}>{data.length}개의 신규 영상이 있습니다.</div>}
    </li>
  );
}
