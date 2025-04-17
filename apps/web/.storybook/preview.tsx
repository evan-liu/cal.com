import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { Preview } from "@storybook/react";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { CSSProperties } from "react";

import { IconSprites } from "@calcom/ui/components/icon";

import { AppRouterI18nProvider } from "../app/AppRouterI18nProvider";
import "../styles/globals.css";

const interFont = Inter({ subsets: ["latin"], variable: "--font-inter", preload: true, display: "swap" });
const calFont = localFont({
  src: "../fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  preload: true,
  display: "block",
  weight: "600",
});

const translations = require(`../public/static/locales/en/common.json`);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => {
      return (
        <div
          style={
            {
              "--font-inter": interFont.style.fontFamily.replace(/'/g, ""),
              "--font-cal": calFont.style.fontFamily.replace(/'/g, ""),
            } as CSSProperties
          }
          className="font-[family-name:var(--font-inter)]">
          <TooltipProvider>
            <AppRouterI18nProvider translations={translations} locale="en" ns="common">
              <IconSprites />
              <Story />
            </AppRouterI18nProvider>
          </TooltipProvider>
        </div>
      );
    },
  ],
};

export default preview;
