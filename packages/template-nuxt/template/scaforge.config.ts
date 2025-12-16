import { defineConfig } from '@scaforge/core';

export default defineConfig({
  name: '{{name}}',
  template: 'nuxt',
  plugins: {},
  settings: {
    generateExamples: true,
    codeStyle: {
      semicolons: true,
      singleQuote: true,
      tabWidth: 2,
    },
  },
});