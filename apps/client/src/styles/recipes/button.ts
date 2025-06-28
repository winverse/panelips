import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'A button component',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    _hover: {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
    _active: {
      transform: 'translateY(0)',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.6,
      _hover: {
        opacity: 0.6,
        transform: 'none',
      },
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: 'blue.500',
        color: 'white',
        _hover: {
          backgroundColor: 'blue.600',
        },
      },
      secondary: {
        backgroundColor: 'gray.100',
        color: 'gray.800',
        _hover: {
          backgroundColor: 'gray.200',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        border: '2px solid {colors.blue.500}',
        color: 'blue.500',
        _hover: {
          backgroundColor: 'blue.500',
          color: 'white',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'gray.700',
        _hover: {
          backgroundColor: 'gray.100',
        },
      },
      danger: {
        backgroundColor: 'red.500',
        color: 'white',
        _hover: {
          backgroundColor: 'red.600',
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
