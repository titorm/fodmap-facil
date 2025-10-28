module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["react", "react-native"],
  rules: {
    "react/prop-types": "off",
    "react-native/no-unused-styles": "warn",
    "react-native/no-inline-styles": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
