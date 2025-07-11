import { defineConfig, defineSemanticTokens, defineGlobalStyles } from '@pandacss/dev';
import { recipes } from '@src/styles/recipes';

const semanticTokens = defineSemanticTokens({
  colors: {
    // Primary colors (Yellow-based theme)
    primary: {
      50: { value: '#fffbeb' },
      100: { value: '#fef3c7' },
      200: { value: '#fde68a' },
      300: { value: '#fcd34d' },
      400: { value: '#fbbf24' },
      500: { value: '#f59e0b' },
      600: { value: '#d97706' },
      700: { value: '#b45309' },
      800: { value: '#92400e' },
      900: { value: '#78350f' },
      950: { value: '#451a03' },
    },

    // Neutral colors
    neutral: {
      50: { value: '#fafaf9' },
      100: { value: '#f5f5f4' },
      200: { value: '#e7e5e4' },
      300: { value: '#d6d3d1' },
      400: { value: '#a8a29e' },
      500: { value: '#78716c' },
      600: { value: '#57534e' },
      700: { value: '#44403c' },
      800: { value: '#292524' },
      900: { value: '#1c1917' },
      950: { value: '#0c0a09' },
    },

    // Success colors (Green)
    success: {
      50: { value: '#f0fdf4' },
      100: { value: '#dcfce7' },
      500: { value: '#22c55e' },
      600: { value: '#16a34a' },
      700: { value: '#15803d' },
    },

    // Error colors (Red)
    error: {
      50: { value: '#fef2f2' },
      100: { value: '#fee2e2' },
      500: { value: '#ef4444' },
      600: { value: '#dc2626' },
      700: { value: '#b91c1c' },
    },

    // Warning colors (Orange)
    warning: {
      50: { value: '#fff7ed' },
      100: { value: '#ffedd5' },
      500: { value: '#f97316' },
      600: { value: '#ea580c' },
      700: { value: '#c2410c' },
    },

    // Semantic tokens
    background: {
      primary: {
        value: {
          base: '{colors.white}',
          _dark: '{colors.neutral.900}',
        },
      },
      secondary: {
        value: {
          base: '{colors.neutral.50}',
          _dark: '{colors.neutral.800}',
        },
      },
      tertiary: {
        value: {
          base: '{colors.neutral.100}',
          _dark: '{colors.neutral.700}',
        },
      },
    },

    border: {
      primary: {
        value: {
          base: '{colors.neutral.200}',
          _dark: '{colors.neutral.700}',
        },
      },
      secondary: {
        value: {
          base: '{colors.neutral.300}',
          _dark: '{colors.neutral.600}',
        },
      },
    },

    // Main semantic tokens
    text: {
      value: {
        base: '{colors.neutral.900}',
        _dark: '{colors.neutral.100}',
      },
      primary: {
        value: {
          base: '{colors.neutral.900}',
          _dark: '{colors.neutral.100}',
        },
      },
      secondary: {
        value: {
          base: '{colors.neutral.600}',
          _dark: '{colors.neutral.400}',
        },
      },
      muted: {
        value: {
          base: '{colors.neutral.500}',
          _dark: '{colors.neutral.500}',
        },
      },
      inverse: {
        value: {
          base: '{colors.white}',
          _dark: '{colors.neutral.900}',
        },
      },
    },

    body: {
      value: {
        base: '{colors.white}',
        _dark: '{colors.neutral.900}',
      },
    },
    button: {
      value: {
        base: '{colors.neutral.100}',
        _dark: '{colors.neutral.700}',
      },
    },
    aside: {
      value: {
        base: '{colors.neutral.50}',
        _dark: '{colors.neutral.800}',
      },
    },
    main: {
      value: {
        base: '{colors.white}',
        _dark: '{colors.neutral.900}',
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
