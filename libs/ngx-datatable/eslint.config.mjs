import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['!**/*']),
  {
    extends: compat.extends('../../.eslintrc.json'),
  },
  {
    files: ['**/*.ts'],

    extends: compat.extends('plugin:@nrwl/nx/angular', 'plugin:@angular-eslint/template/process-inline-templates'),

    rules: {
      '@angular-eslint/directive-selector': [
        'warn',
        {
          type: 'attribute',
          prefix: 'commudle',
          style: 'camelCase',
        },
      ],

      '@angular-eslint/component-selector': [
        'warn',
        {
          type: 'element',
          prefix: 'commudle',
          style: 'kebab-case',
        },
      ],

      '@angular-eslint/component-class-suffix': 'warn',
      '@angular-eslint/directive-class-suffix': 'warn',
      '@angular-eslint/no-host-metadata-property': 'warn',
      '@angular-eslint/no-input-rename': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      '@typescript-eslint/ban-types': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      'no-prototype-builtins': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: compat.extends('plugin:@nrwl/nx/angular-template'),
    rules: {},
  },
]);
