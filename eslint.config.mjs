import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Allow empty catch blocks (we use them for graceful degradation)
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Downgrade to warn — fetch-in-useEffect is a common pattern used across all pages
      "react-hooks/set-state-in-effect": "warn",
      // Downgrade to warn — used for navigation in event handlers
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "drizzle/", "_legacy/"],
  },
];

export default eslintConfig;
