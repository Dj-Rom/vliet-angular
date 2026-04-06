// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config({
  files: ['**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    angular.configs.tsRecommended,
  ],
  processor: angular.processInlineTemplates,
  rules: {
    // Angular
    '@angular-eslint/prefer-inject': 'off',

    // TypeScript – TURN OFF STRICT RULES
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',

    // JS core rules
    'no-useless-escape': 'off',
    'no-empty': 'off',
  },
});
