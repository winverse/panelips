import { Button } from '@src/components/Button/Button';
import { trpc } from '@src/lib/trpc';
import { flex } from '@styled-system/patterns';
import { useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const youtubeChannelQuery = trpc.scrap.youtubeChannel.useQuery();
  return (
    <div className={flex({ fontWeight: 'bold' })}>
      <Button size="lg" variant="primary">
        RUN
      </Button>
    </div>
  );
}
