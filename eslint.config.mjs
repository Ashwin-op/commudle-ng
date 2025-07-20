import angularEslint from '@angular-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// TODO: Remove FlatCompat entirely once all plugins support native flat config
// Currently needed for: compat.extends('plugin:@nx/typescript') and compat.extends('plugin:@nx/javascript')

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/node_modules']),
  // TODO: Scope Angular ESLint plugin to Angular-specific files only
  // Currently registered globally but should be limited to Angular projects once shared components are migrated
  {
    plugins: {
      '@nx': nx,
      '@angular-eslint': angularEslint,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],

    rules: {
      '@nx/enforce-module-boundaries': [
        'warn',
        {
          enforceBuildableLibDependency: true,
          allow: [],

          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: compat.extends('plugin:@nx/typescript'),
    rules: {},
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    extends: compat.extends('plugin:@nx/javascript'),
    rules: {},
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },

    rules: {},
  },
]);
