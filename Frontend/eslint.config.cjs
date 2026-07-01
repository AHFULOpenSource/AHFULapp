const importPlugin = require('eslint-plugin-import');
const unicorn = require('eslint-plugin-unicorn');

module.exports = [
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

      // Enforce PascalCase filenames for component-like files,
      // and allow index files / config files to be exempt.
      'unicorn/filename-case': [
        'error',
        {
          case: 'pascalCase',
          ignore: [
            /^vite\.config\.[jt]s$/,
            /^eslint\.config\.cjs$/,
            /^index\.(js|jsx|ts|tsx)$/, // barrel files
            /^\.[a-z]+rc\.[cm]?js$/,     // dotfile configs
          ],
        },
      ],

      // Enforce camelCase for variables
      camelcase: [
        'error',
        {
          properties: 'never', // don't force it on object keys from external APIs
          ignoreDestructuring: false,
        },
      ],
    },
  },
];