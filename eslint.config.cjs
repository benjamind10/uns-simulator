import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginHooks from 'eslint-plugin-react-hooks';
import eslintPluginImport from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        // ⬇ Glob of files to lint
        files: ['**/*.{ts,tsx,js,jsx}'],
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
        ],

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },

        plugins: {
            react: eslintPluginReact,
            hooks: eslintPluginHooks,
            import: eslintPluginImport,
            '@typescript-eslint': tsPlugin,
        },

        rules: {
            /* ------- base ------------- */
            'no-unused-vars': 'off',                     // delegate to TS rule
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            /* ------- React ------------ */
            'react/react-in-jsx-scope': 'off',          // React 17+

            /* ------- import order ----- */
            'import/order': ['warn', { 'newlines-between': 'always' }],
        },

        settings: {
            react: { version: 'detect' },
            'import/resolver': { typescript: {} },
        },
    },
];
