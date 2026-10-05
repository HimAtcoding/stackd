import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The service role key bypasses row-level security. It's for local import scripts only, never the app.
  {
    files: ["app/**", "components/**", "lib/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='SUPABASE_SERVICE_ROLE_KEY'], Literal[value='SUPABASE_SERVICE_ROLE_KEY']",
          message: "The service role key is for local import scripts only, never app code.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
