// eslint.config.cjs
const react = require('eslint-plugin-react');
const ts = require('@typescript-eslint/eslint-plugin');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      // any other globs you had in .eslintignore
    ],

    plugins: {
      react: react,
      '@typescript-eslint': ts,
    },

    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // your custom overrides here...
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
