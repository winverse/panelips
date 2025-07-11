'use client';

import { Button } from '@src/components/Button';
import { Input } from '@src/components/Input';
import useInputs from '@src/hooks/useInputs';
import { useTRPC } from '@src/lib/trpc';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';

export function GoogleLoginForm() {
  const trpc = useTRPC();
  const [form, onChange] = useInputs({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const { isPending, mutateAsync } = useMutation(trpc.login.googleLogin.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!form.email || !form.password) {
      setMessage('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const data = await mutateAsync({ email: form.email, password: form.password });
      console.log('data', data);
      if (data.success) {
        setMessage('✅ 구글 로그인 성공! 쿠키가 저장되었습니다.');
      } else {
        setMessage('❌ 구글 로그인 실패. 자격 증명을 확인하거나 2단계 인증을 해제해주세요.');
      }
    } catch (error: any) {
      setMessage(`❌ 로그인 중 오류 발생: ${error.message}`);
      console.error('Google login error:', error);
    }
  };

  return (
    <div
      className={css({ p: '1rem', border: '1px solid #eee', borderRadius: '8px', width: '350px' })}
    >
      <h2 className={css({ fontSize: '1.2rem', fontWeight: 'bold', mb: '1rem' })}>구글 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div className={flex({ flexDirection: 'column', gap: '0.75rem', mb: '1rem' })}>
          <Input
            type="email"
            name="email"
            placeholder="구글 이메일"
            value={form.email}
            onChange={onChange}
            className={css({
              p: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100%',
            })}
            disabled={isPending}
          />
          <Input
            type="password"
            name="password"
            placeholder="구글 비밀번호"
            value={form.password}
            onChange={onChange}
            className={css({
              p: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100%',
            })}
            disabled={isPending}
          />
        </div>
        <Button size="md" variant="primary" type="submit" disabled={isPending}>
          {isPending ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      {message && (
        <p
          className={css({
            mt: '1rem',
            fontSize: '0.9rem',
            color: message.startsWith('❌') ? 'red' : 'green',
          })}
        >
          {message}
        </p>
      )}
    </div>
  );
}
