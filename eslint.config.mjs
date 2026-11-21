import expo from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';

const ignorados = {
  ignores: ['**/node_modules/', '**/dist/', '**/.expo/', '**/coverage/', 'android/', 'ios/'],
};

export default [
  ignorados,
  ...expo,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
