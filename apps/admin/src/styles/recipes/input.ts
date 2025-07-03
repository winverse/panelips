import { defineRecipe } from '@pandacss/dev';

export const inputRecipe = defineRecipe({
  className: 'input',
  description: 'Input component styles',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'gray.300',
    bg: 'white',
    px: '3',
    py: '2',
    fontSize: 'sm',
    fontWeight: 'medium',
    transition: 'all 0.2s',
    outline: 'none',
    _focus: {
      borderColor: 'blue.500',
      boxShadow: '0 0 0 1px {colors.blue.500}',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      bg: 'gray.50',
    },
    _invalid: {
      borderColor: 'red.500',
      _focus: {
        borderColor: 'red.500',
        boxShadow: '0 0 0 1px {colors.red.500}',
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
        borderColor: 'gray.300',
        bg: 'white',
      },
      filled: {
        borderColor: 'transparent',
        bg: 'gray.100',
      },
      underline: {
        borderRadius: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid',
        borderColor: 'gray.300',
        bg: 'transparent',
        px: '0',
        _focus: {
          borderColor: 'blue.500',
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
