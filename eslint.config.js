import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', fetch: 'readonly' },
    },
    plugins: { react: react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      'react/jsx-no-undef': 'error',
      'react/react-in-jsx-scope': 'off',
      ...reactHooks.configs.recommended.rules,
    },
    settings: { react: { version: 'detect' } },
  }
);
