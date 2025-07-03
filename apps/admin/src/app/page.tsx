'use client';

import { Button } from '@src/components/Button/Button';
import { useTRPC } from '@src/lib/trpc';
import { flex } from '@styled-system/patterns';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();

  const youtubeChannelMutation = useMutation(
    trpc.scrap.youtubeChannel.mutationOptions(),
  );

  const handleClick = () => {
    const result = youtubeChannelMutation.mutateAsync({
      googleEmail: 'google@email.com',
      googlePassword: 'password',
    });

    console.log('result', result);
  };

  return (
    <div className={flex({ fontWeight: 'bold' })}>
      <Button size="lg" variant="primary" onClick={handleClick}>
        RUN
      </Button>
    </div>
  );
}
