import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'A button component',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    _hover: {
      opacity: 0.9,
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.6,
      _hover: {
        opacity: 0.6,
      },
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: 'primary.400',
        color: 'white',
        _hover: {
          backgroundColor: 'primary.500',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
      secondary: {
        backgroundColor: 'background.primary',
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'border.primary',
        _hover: {
          backgroundColor: 'primary.50',
          borderColor: 'primary.200',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: 'primary.300',
        color: 'primary.600',
        _hover: {
          backgroundColor: 'primary.50',
          borderColor: 'primary.400',
          color: 'primary.700',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'text.secondary',
        _hover: {
          backgroundColor: 'primary.50',
          color: 'primary.600',
        },
      },
      danger: {
        backgroundColor: 'error.400',
        color: 'white',
        _hover: {
          backgroundColor: 'error.500',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
        },
      },
    },
    size: {
      sm: {
        height: '32px',
        paddingX: '12px',
        fontSize: '14px',
      },
      md: {
        height: '40px',
        paddingX: '16px',
        fontSize: '16px',
      },
      lg: {
        height: '48px',
        paddingX: '24px',
        fontSize: '18px',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
