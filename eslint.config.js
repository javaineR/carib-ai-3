import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      React: 'readonly',
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    '@next/next': nextPlugin,
  },
  extends: [
    js.configs.recommended,
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-undef': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}); 