import { defineConfig } from '@scaforge/core';

export default defineConfig({
  name: '{{name}}',
  template: 'hydrogen',
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