const importPlugin = require('eslint-plugin-import');
const unicorn = require('eslint-plugin-unicorn');

module.exports = [
  // Global ignores — skip linting entirely for these
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'],
  },

  {
    plugins: {
      import: importPlugin,
      unicorn,
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
        },
      },
    },

    rules: {
      'import/no-unresolved': ['error', { caseSensitive: true }],

      'unicorn/filename-case': [
        'error',
        {
          case: 'pascalCase',
          ignore: [
            // Firebase requires this exact filename
            /^firebase-messaging-sw\.js$/,
            // Build/config tooling files
            /^vite\.config\.[jt]s$/,
            /^eslint\.config\.(js|cjs|mjs)$/,
            /^use[A-Z].*\.[jt]sx?$/, 
            /^[a-z].*Api\.[jt]sx?$/,
            /^firebase\.[jt]s$/,
            /^CompanionAI\.js$/,
            /^index\.[jt]sx?$/,
          ],
        },
      ],

      camelcase: [
        'error',
        {
          properties: 'never',
          ignoreDestructuring: false,
        },
      ],
    },
  },

  {
    files: ['vite.config.js', 'eslint.config.cjs'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];