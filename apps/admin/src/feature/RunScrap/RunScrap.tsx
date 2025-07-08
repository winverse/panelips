'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import useInputs from '@src/hooks/useInputs';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation } from '@tanstack/react-query';

export function RunScrap() {
  const trpc = useTRPC();
  const [form, onChange] = useInputs({
    email: '',
    password: '',
  });

  const { isPending, mutateAsync } = useMutation(trpc.scrap.youtubeChannel.mutationOptions());

  const handleClick = async () => {
    const result = await mutateAsync({
      googleEmail: form.email,
      googlePassword: form.password,
    });
  };

  return (
    <div className={flex({ flexDir: 'column' })}>
      <Input
        variant="outline"
        placeholder="이메일을 입력하세요"
        size="md"
        label="email"
        name="email"
        value={form.email}
        onChange={onChange}
      />
      <Input
        variant="outline"
        placeholder="비밀번호를 입력하세요"
        size="md"
        label="password"
        type="password"
        name="password"
        value={form.password}
        onChange={onChange}
      />
      <div className={css({ mt: '0.5rem', ml: 'auto' })}>
        <Button size="md" variant="primary" onClick={handleClick} isLoading={isPending}>
          LOGIN
        </Button>
      </div>
    </div>
  );
}
