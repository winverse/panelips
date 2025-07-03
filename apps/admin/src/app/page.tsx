'use client';

import { Button } from '@src/components/Button/Button';
import { Input } from '@src/components/Input';
import useInputs from '@src/hooks/useInputs'; // 1. useInputs 훅 import
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation } from '@tanstack/react-query';

export default function Home() {
  const trpc = useTRPC();
  const [form, onChange] = useInputs({
    email: '',
    password: '',
  });

  const { isPending, mutateAsync } = useMutation(
    trpc.scrap.youtubeChannel.mutationOptions(),
  );

  const handleClick = async () => {
    const result = await mutateAsync({
      googleEmail: form.email,
      googlePassword: form.password,
    });

    console.log(result);
  };

  return (
    <div className={flex({ p: '0.5rem' })}>
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
          <Button
            size="md"
            variant="primary"
            onClick={handleClick}
            // 5. react-query의 로딩 상태를 버튼에 직접 연결
            isLoading={isPending}
          >
            RUN
          </Button>
        </div>
      </div>
    </div>
  );
}
