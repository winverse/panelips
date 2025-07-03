import { Spinner } from '@src/components/Spinner';
import { css } from '@styled-system/css';
import { type ButtonVariant, button } from '@styled-system/recipes/button';
import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  loadingText?: string;
} & ButtonVariant;

export const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  className,
  loadingText = '로딩 중...',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={button({ variant, size })}
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {isLoading ? (
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '2',
          })}
        >
          <Spinner size={size} />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
