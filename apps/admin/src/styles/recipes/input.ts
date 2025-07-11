import { defineRecipe } from '@pandacss/dev';

export const inputRecipe = defineRecipe({
  className: 'input',
  description: 'Input component styles',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: 'border.primary',
    bg: 'background.primary',
    px: '3',
    py: '2',
    fontSize: 'sm',
    fontWeight: 'medium',
    transition: 'all 0.15s ease',
    outline: 'none',
    _focus: {
      borderColor: 'primary.500',
      boxShadow: 'none',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      bg: 'background.secondary',
    },
    _invalid: {
      borderColor: 'error.500',
      _focus: {
        borderColor: 'error.500',
        boxShadow: 'none',
      },
    },
  },
  variants: {
    size: {
      sm: {
        px: '2',
        py: '1',
        fontSize: 'xs',
      },
      md: {
        px: '3',
        py: '2',
        fontSize: 'sm',
      },
      lg: {
        px: '4',
        py: '3',
        fontSize: 'md',
      },
    },
    variant: {
      outline: {
        borderColor: 'border.primary',
        bg: 'background.primary',
      },
      filled: {
        borderColor: 'transparent',
        bg: 'background.secondary',
      },
      underline: {
        borderRadius: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid',
        borderColor: 'border.primary',
        bg: 'transparent',
        px: '0',
        _focus: {
          borderColor: 'primary.500',
          boxShadow: 'none',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
  },
});
