import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // PascalCase identifiers are React components. They are often used only
      // inside JSX, which this config cannot see without eslint-plugin-react,
      // so treat them as used - for destructured props (args) as well as vars.
      // e.g. SidebarLink({ icon: Icon }) rendering <Icon />.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^(_|[A-Z])', varsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
];
