import { defineConfig, defineSemanticTokens, defineGlobalStyles } from '@pandacss/dev';
import { recipes } from '@src/styles/recipes';

const semanticTokens = defineSemanticTokens({
  colors: {
    text: {
      value: {
        base: '{colors.gray.800}',
        _dark: '{colors.gray.100}',
      },
    },
    body: {
      value: {
        base: '{colors.white}',
        _dark: '{colors.gray.800}',
      },
    },
    button: {
      value: {
        base: '{colors.gray.100}',
        _dark: '{colors.gray.700}',
      },
    },
    aside: {
      value: {
        base: '{colors.gray.50}',
        _dark: '{colors.gray.900}',
      },
    },
    main: {
      value: {
        base: '{colors.white}',
        _dark: '{colors.gray.800}',
      },
    },
  },
});

const globalCss = defineGlobalStyles({
  body: {
    backgroundColor: 'body',
    color: 'text',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  },
  button: {
    backgroundColor: 'button',
    color: 'text',
    border: '1px solid',
    borderColor: 'text',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    _hover: {
      backgroundColor: 'text',
      color: 'body',
    },
  },
});

export default defineConfig({
  // Whether to use CSS reset
  preflight: true,
  minify: true,

  // Where to look for your CSS declarations
  include: ['./src/**/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  jsxFramework: 'react',
  jsxFactory: 'panda',
  outdir: 'styled-system',

  theme: {
    extend: {
      recipes,
      semanticTokens,
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
      },
    },
  },
  conditions: {
    dark: '[data-theme=\'dark\'] &',
  },
});

