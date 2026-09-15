import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Each of these hooks lives beside the provider or component it reads.
      // Fast refresh reloads such a file whole instead of hot-swapping it,
      // which costs a remount while that file is being edited and nothing in
      // the built site.
      'react-refresh/only-export-components': ['error', {
        allowConstantExport: true,
        allowExportNames: [
          'useAuth', 'useSubscription', 'useToast', 'useWishlist', 'usePaged', 'useQueue',
        ],
      }],
      // `const { confirmPassword, ...dto } = form` is how a field is left out.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // Every export here is a component, but made by calling make(), which the
    // rule cannot see through.
    files: ['src/components/icons.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
