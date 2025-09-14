// import { type Config } from "prettier";

const config = { // : Config
  plugins: ["prettier-plugin-tailwindcss"],
  tabWidth: 2,
  overrides: [
    {
      files: "*.jsonc",
      options: {
        trailingComma: "none",
      },
    },
  ],
};

export default config;
