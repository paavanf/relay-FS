import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  // The constraint engine is pure by contract: plain objects in, plain objects
  // out. No database, no config, no environment, no logging, no I/O and no
  // ambient clock - time is passed in as data. That purity is what makes it
  // unit-testable in milliseconds and safe to move into a worker thread.
  //
  // This rule is the enforcement. Without it the first "just import the model
  // here" would go unnoticed until the engine could no longer be tested
  // without a database.
  {
    files: ['src/engine/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'mongoose',
                'pino',
                'pino-http',
                'express',
                '**/models',
                '**/models/**',
                '**/repositories',
                '**/repositories/**',
                '**/config',
                '**/config/**',
                '**/services',
                '**/services/**',
                '**/controllers/**',
                '**/middleware/**',
                '**/routes/**',
                '**/validators/**',
                '**/jobs/**',
                '**/utils/logger.js',
              ],
              message:
                'src/engine must stay pure - no database, config, logging or I/O. Pass the data in as plain objects instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
