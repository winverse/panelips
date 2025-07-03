import { css } from '@styled-system/css';
import { input } from '@styled-system/recipes/input';
import { forwardRef, type InputHTMLAttributes, useId } from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'outline' | 'filled' | 'underline';

type InputProps = {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  variant?: InputVariant;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outline',
      size = 'md',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = useId();
    return (
      <div
        className={css({ display: 'flex', flexDirection: 'column', gap: 0.5 })}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={css({
              fontSize: size,
              fontWeight: 'medium',
              color: 'gray.700',
            })}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={input({ variant, size })}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />

        {error && (
          <span
            className={css({
              fontSize: 'sm',
              color: 'red.600',
            })}
          >
            {error}
          </span>
        )}

        {helperText && !error && (
          <span
            className={css({
              fontSize: 'sm',
              color: 'gray.500',
            })}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
