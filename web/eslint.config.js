import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // public/vendor holds third-party bundles (pannellum) that we ship verbatim.
  // Linting them produced 382 errors in minified code we do not own, which
  // drowned out anything real and made `npm run lint` useless.
  //
  // test-results / playwright-report are the same problem from a different
  // direction: a Playwright run writes minified page scripts into its trace
  // artifacts, so `npm run lint` reported 316 errors in captured third-party
  // JavaScript purely because tests had been run recently.
  globalIgnores(['dist', 'public/vendor', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
