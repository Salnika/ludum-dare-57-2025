import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser'; // Ajout explicite du parser

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser, // Parser TypeScript explicite
      parserOptions: {
        project: './tsconfig.json', // Lien avec ton tsconfig
        sourceType: 'module',
        ecmaVersion: 'latest', // Support des dernières fonctionnalités JS (inclut #)
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: eslintPluginImport,
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      // Clean code
      'no-console': 'warn',
      'no-debugger': 'warn',

      // Imports
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal'],
          'newlines-between': 'always',
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],

      // Règles spécifiques pour supporter les champs privés
      '@typescript-eslint/no-unused-vars': 'off', // Désactive la règle ESLint de base
      'no-unused-vars': 'off', // Désactive la règle ESLint standard
      '@typescript-eslint/no-unused-private-fields': 'warn', // Optionnel : spécifique aux champs privés
      '@typescript-eslint/prefer-const': 'warn', // Encourage l'usage de const, compatible avec #private
    },
  },
];