// @ts-check
import eslint from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      '@stylistic': stylisticPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Ensure defaults are passed explicitly to avoid ESLint 9 hitting the old plugin bug.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: false,
          allowTaggedTemplates: false,
          allowTernary: false,
        },
      ],

      'no-multi-spaces': 'error',

      'space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always',
        },
      ],

      indent: [2, 'tab'],
      'no-tabs': 0,

      'require-await': 'off',
      'no-unused-vars': 'off',
      'no-trailing-spaces': 'warn',
      'comma-dangle': ['warn', 'never'],

      'object-curly-newline': ['warn', {
        ImportDeclaration: 'never',
        ExportDeclaration: 'never',
      }],

      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'function-paren-newline': ['error', 'consistent'],
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single'],
      'space-before-blocks': ['error', { functions: 'always', keywords: 'always', classes: 'always' }],
      'jsx-quotes': ['warn', 'prefer-single'],
      'keyword-spacing': ['error', { before: true, after: true }],
      semi: ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],

      '@stylistic/type-annotation-spacing': [
        'error',
        {
          overrides: {
            property: {
              before: false,
              after: true,
            },
            colon: {
              before: false,
              after: true,
            },
            variable: {
              before: true,
              after: true,
            },
          },
        },
      ],
    },
  },
);
