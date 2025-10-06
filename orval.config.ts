import { defineConfig } from "orval";

export default defineConfig({
  plm: {
    input: {
      target: "http://localhost:3000/api/docs/openapi.json",
    },
    output: {
      target: "./packages/client/src/generated/api.ts",
      client: "fetch",
      mode: "tags-split",
      override: {
        mutator: {
          path: "./packages/client/src/lib/api-client.ts",
          name: "customFetch",
        },
      },
      clean: true,
    },
  },
});
