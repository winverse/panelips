import { defineConfig } from '@pandacss/dev';
import {recipes} from "@src/styles/recipes";

export default defineConfig({
  // Whether to use CSS reset
  preflight: true,

  // Where to look for your CSS declarations
  include: ["./src/**/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  jsxFramework: 'react',
  jsxFactory: 'panda',
  outdir: 'styled-system',

  theme: {
    extend: {
      recipes
    }
  }
});
