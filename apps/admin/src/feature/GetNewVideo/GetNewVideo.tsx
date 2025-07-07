'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import useInput from '@src/hooks/useInput';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation } from '@tanstack/react-query';

export function GetNewVideo() {
  const trpc = useTRPC();
  const [channel, setChannel] = useInput('');

  const { isPending, mutateAsync } = useMutation(
    trpc.youtube.getNewVideo.mutationOptions(),
  );

  const handleClick = async () => {
    const result = await mutateAsync({
      channel,
    });

    console.log(result);
  };

  return (
    <div
      className={flex({
        flexDir: 'row',
        alignItems: 'center',
        gap: '0.5rem',
      })}
    >
      <Input
        size="sm"
        value={channel}
        onChange={setChannel}
        variant="outline"
        style={{ width: '200px' }}
      />
      <Button
        size="sm"
        variant="primary"
        isLoading={isPending}
        onClick={handleClick}
      >
        동기화
      </Button>
    </div>
  );
}
