/**
 * ESLint Configuration
 *
 * Code quality and style enforcement configuration
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },

  extends: ["eslint:recommended"],

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },

  rules: {
    // Error Prevention
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "error",
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "no-undef": "error",
    "no-unreachable": "error",
    "no-duplicate-imports": "error",

    // Code Style
    // indent: ["error", 4, { SwitchCase: 1 }],
    // 'quotes': ['error', 'single', { avoidEscape: true }],
    semi: ["error", "always"],
    // "comma-dangle": ["error", "never"],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "space-before-function-paren": ["error", "never"],
    "keyword-spacing": "error",
    "space-infix-ops": "error",

    // Best Practices
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "brace-style": ["error", "1tbs"],
    "no-var": "error",
    "prefer-const": "error",
    "prefer-arrow-callback": "error",
    "arrow-spacing": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-extra-boolean-cast": "error",
    "no-extra-semi": "error",
    "no-fallthrough": "error",
    "no-func-assign": "error",
    "no-global-assign": "error",
    "no-implicit-globals": "error",
    "no-inner-declarations": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-obj-calls": "error",
    "no-prototype-builtins": "error",
    "no-redeclare": "error",
    "no-regex-spaces": "error",
    "no-sparse-arrays": "error",
    "no-unexpected-multiline": "error",
    "use-isnan": "error",
    "valid-typeof": "error",

    // ES6+ Features
    // "arrow-parens": ["error", "as-needed"],
    "template-curly-spacing": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
  },

  overrides: [
    {
      files: ["**/*.test.js", "**/__tests__/**/*.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-console": "off", // Allow console in tests
      },
    },
    {
      files: [
        "webpack.config.js",
        "rollup.config.js",
        "babel.config.js",
        "jest.config.js",
      ],
      env: {
        node: true,
      },
      rules: {
        "no-console": "off",
      },
    },
  ],
};
