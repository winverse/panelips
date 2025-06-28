import { defineConfig } from '@pandacss/dev';
import { colors } from '@src/styles/colors';
import { globalCss } from '@src/styles/global';
import { keyframes } from '@src/styles/keyframes';
import { zIndex } from '@src/styles/zIndex';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  globalCss,
  // Files to exclude
  exclude: [],

  jsxFramework: 'react',
  jsxFactory: 'panda',

  // Useful for theme customization
  theme: {
    tokens: {
      colors,
      zIndex,
    },
    extend: {
      keyframes,
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',
});
