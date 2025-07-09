import { css } from '@styled-system/css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner = ({ size = 'md', color, className }: SpinnerProps) => {
  const spinnerSize = {
    sm: '12px',
    md: '16px',
    lg: '20px',
  }[size];

  return (
    <div
      className={css({
        display: 'inline-block',
        width: spinnerSize,
        height: spinnerSize,
        border: '2px solid currentColor',
        borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
        color: color || 'currentColor',
      })}
    />
  );
};
