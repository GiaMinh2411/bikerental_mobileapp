import { createTamagui } from "tamagui";
import { defaultConfig } from "@tamagui/config/v6";
export const colors = {
  forest: "#164D3C",
  mint: "#E5F0E8",
  ground: "#F3F5EF",
  ink: "#172D25",
  muted: "#5A6C62",
  line: "#D7DFD8",
  white: "#FFFFFF",
  error: "#A22C29",
} as const;
export const metrics = {
  screen: 20,
  section: 24,
  card: 16,
  control: 48,
  radius: 14,
  maxWidth: 1120,
  formWidth: 680,
} as const;
export const typography = {
  hero: 34,
  title: 28,
  section: 22,
  card: 19,
  body: 16,
  label: 14,
  meta: 13,
} as const;
export const config = createTamagui({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      forest: colors.forest,
      mint: colors.mint,
      ink: colors.ink,
    },
    space: {
      ...defaultConfig.tokens.space,
      screen: metrics.screen,
      card: metrics.card,
      section: metrics.section,
    },
    radius: {
      ...defaultConfig.tokens.radius,
      card: metrics.radius,
      control: 12,
    },
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
    allowedStyleValues: "somewhat-strict",
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: colors.ground,
      color: colors.ink,
      accentBackground: colors.forest,
      accentColor: colors.white,
    },
  },
  media: {
    sm: { maxWidth: 639 },
    md: { minWidth: 640 },
    lg: { minWidth: 1024 },
  },
});
type Conf = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
