import type { StorybookConfig } from "@storybook/nextjs";
import { dirname, join } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

export default {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    {
      name: getAbsolutePath("@storybook/addon-essentials"),
      options: { docs: false },
    },
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {},
  },
  staticDirs: ["../public", { from: "../fonts", to: "fonts" }],
} satisfies StorybookConfig;
