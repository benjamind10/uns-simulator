/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],   // remove if you don’t use “project” mode
    },
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',                    // keep last
    ],
    settings: {
        react: { version: 'detect' },
        'import/resolver': { typescript: {} },
    },
    rules: {
        // example tweaks
        'react/react-in-jsx-scope': 'off',      // since React 17+
        'import/order': ['warn', { 'newlines-between': 'always' }],
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
};
