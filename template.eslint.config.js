import { defineConfig, globalIgnores } from 'eslint/config';

import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintPluginAva from 'eslint-plugin-ava';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/coverage', '/__tests__']),
  {
    files: ['**/*.js'],
    // tag::rules[]
    rules: {
      // https://prettier.io/docs/en/integrating-with-linters.html#use-eslint-to-run-prettier
      // https://github.com/prettier/eslint-plugin-prettier#options
      'prettier/prettier': [
        'error',
        // https://prettier.io/docs/en/configuration.html#basic-configuration
        {
          // https://prettier.io/docs/en/options.html#quotes
          singleQuote: true,
          // https://prettier.io/docs/en/options.html#semicolons
          semi: true,
          // https://prettier.io/docs/en/options.html#tab-width
          tabWidth: 2,
          // https://prettier.io/docs/en/options.html#print-width
          printWidth: 120,
        },
      ],
      // https://eslint.org/docs/rules/no-unused-vars#ignorerestsiblings
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // https://eslint.org/docs/rules/prefer-const
      'prefer-const': 'error',
      // https://eslint.org/docs/rules/no-alert
      'no-alert': 'error',
      // https://eslint.org/docs/rules/no-console
      'no-console': 'error',
      // https://eslint.org/docs/rules/no-var
      'no-var': 'error',
      // https://eslint.org/docs/rules/linebreak-style
      'linebreak-style': ['error', 'unix'],
      // https://eslint.org/docs/rules/complexity
      complexity: ['error', { max: 5 }],
      // https://eslint.org/docs/rules/max-statements
      'max-statements': ['error', { max: 10 }],
      // https://eslint.org/docs/rules/max-statements-per-line
      'max-statements-per-line': ['error', { max: 1 }],
      // https://eslint.org/docs/rules/max-nested-callbacks
      'max-nested-callbacks': ['error', { max: 2 }],
      // https://eslint.org/docs/rules/max-depth
      'max-depth': ['error', { max: 2 }],
      // https://eslint.org/docs/rules/max-params
      'max-params': ['error', { max: 3 }],
      // https://eslint.org/docs/rules/no-nested-ternary
      'no-nested-ternary': 'error',
      // https://eslint.org/docs/rules/no-trailing-spaces
      'no-trailing-spaces': 'error',
      // https://eslint.org/docs/rules/one-var
      'one-var': ['error', 'never'],
      // https://github.com/avajs/eslint-plugin-ava/blob/main/docs/rules/prefer-power-assert.md
      'ava/prefer-power-assert': 'warn',
      // https://github.com/import-js/eslint-plugin-import/issues/2703
      'import/no-unresolved': 'off',
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v52.0.0/docs/rules/no-anonymous-default-export.md
      'unicorn/no-anonymous-default-export': 'off',
    },
    // end::rules[],
    plugins: {
      ava: eslintPluginAva,
      import: eslintPluginImport,
      promise: eslintPluginPromise,
      security: eslintPluginSecurity,
      unicorn: eslintPluginUnicorn,
    },
    settings: {
      'import/core-modules': ['ava'],
    },
  },
  eslintPluginPrettier,
]);
