import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import path from "node:path";
const layers = ["shared", "entities", "features", "widgets", "pages", "app"];
const boundaries = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        const filename = context.filename.replaceAll("\\", "/");
        const marker = "/src/";
        const pos = filename.lastIndexOf(marker);
        if (pos < 0) return;
        const from = filename.slice(pos + marker.length).split("/");
        const resolved = source.startsWith("@/")
          ? source.slice(2)
          : source.startsWith(".")
            ? path.posix.normalize(
                path.posix.join(
                  path.posix.dirname(filename.slice(pos + marker.length)),
                  source,
                ),
              )
            : null;
        if (!resolved) return;
        const to = resolved.split("/");
        const a = layers.indexOf(from[0]);
        const b = layers.indexOf(to[0]);
        if (a < 0 || b < 0) return;
        const sameSlice = from[0] === to[0] && from[1] === to[1];
        if (
          b > a ||
          (a === b && !sameSlice && !["shared", "app"].includes(from[0]))
        )
          context.report({
            node,
            message:
              "FSD: imports must point down; sibling slices cannot import each other.",
          });
        if (!sameSlice && !["shared", "app"].includes(to[0]) && to.length > 2)
          context.report({
            node,
            message: "FSD: import through the slice public API.",
          });
      },
    };
  },
};
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { fsd: { rules: { boundaries } } },
    rules: { "fsd/boundaries": "error" },
  },
  globalIgnores([
    ".local/**",
    "backend/dist/**",
    "backend/tests/**",
    ".next/**",
    "node_modules/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
