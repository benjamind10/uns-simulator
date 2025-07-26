const eslintPluginReact = require('eslint-plugin-react');
const eslintPluginHooks = require('eslint-plugin-react-hooks');
const eslintPluginImport = require('eslint-plugin-import');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            'coverage/',
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
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'react/react-in-jsx-scope': 'off',
            'import/order': ['warn', { 'newlines-between': 'always' }],
        },

        settings: {
            react: { version: 'detect' },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: ['./tsconfig.json'],
                },
            },
        },
    },
];
