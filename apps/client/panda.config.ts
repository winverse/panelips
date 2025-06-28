import { defineConfig } from '@pandacss/dev';
import { colors } from '@src/styles/tokens/colors';
import { globalCss } from '@src/styles/global';
import { keyframes } from '@src/styles/keyframes';
import { zIndex } from '@src/styles/tokens/zIndex';
import { layers } from '@src/styles/layers';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  globalCss,
  jsxFramework: 'react',
  jsxFactory: 'panda',
  layers,
  theme: {
    tokens: {
      colors,
      zIndex,
    },
    extend: {
      keyframes,
    },
  },
  outdir: 'styled-system',
  strictTokens: true,
  strictPropertyValues: true,
});
