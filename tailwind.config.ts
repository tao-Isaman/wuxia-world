import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  // Light-mode-only after the wuxia ink-on-paper redesign. Keeping
  // `darkMode: ["class"]` would let stray `dark:*` Tailwind classes still
  // engage if anyone forgets to scrub them — set to "class" but the
  // matching CSS variables in globals.css are gone, so the toggle is a
  // no-op now.
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Game-specific accent colors
        sideA: "hsl(var(--side-a))",
        sideB: "hsl(var(--side-b))",
        // Wuxia palette aliases — semantic names for places where the
        // shadcn semantic tokens don't fit (e.g., HP red vs destructive
        // red). All driven by the same CSS variables so a future palette
        // tweak in globals.css is the single source of truth.
        ink: "hsl(var(--foreground))",
        paper: "hsl(var(--background))",
        vermilion: "hsl(var(--primary))",
        jade: "hsl(var(--accent))",
      },
      fontFamily: {
        // Charm — calligraphic display font for proper nouns, sect /
        // character / skill names, and section headers (≥18px). Limited
        // Thai coverage at small sizes — never use below 16px.
        display: ["var(--font-display)", "serif"],
        // Sarabun — high-coverage Thai serif for body text, dialog,
        // narration, and any number / metric display. Default sans.
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        // SOV_JomYuth — display font for the battle-scene skill-cast
        // animation overlay. Heavy/calligraphic Thai face; readable at
        // very large sizes. Loaded eagerly (font-display: block) so the
        // first cast animation isn't a font-swap flicker.
        action: ["Jomyuth", "var(--font-display)", "serif"],
      },
      borderRadius: {
        // Pixel-art chrome has no rounded corners. Existing `rounded-*`
        // classes in the codebase still compile but render flat.
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
      },
      boxShadow: {
        // Stacked-shadow step-bevel for pixel-art buttons. Inset shadows
        // produce a 2px inner highlight (top-left) + 2px inner shade
        // (bottom-right); the outer drop is a 2px ink ledge. `pixel-down`
        // swaps inset directions for the :active / pressed state.
        pixel: "inset 2px 2px 0 hsl(40 35% 99%), inset -2px -2px 0 hsl(20 25% 28%), 0 2px 0 hsl(20 15% 12%)",
        "pixel-down": "inset -2px -2px 0 hsl(40 35% 99%), inset 2px 2px 0 hsl(20 25% 28%), 0 0 0 hsl(20 15% 12%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Skill-cast splash: pop in within 0.3s, hold, fade out at end.
        // Total 1.4s — long enough to read at slot-1 but short enough
        // that the staggered hit-damages chain follows fast.
        "skill-cast": {
          "0%":   { opacity: "0", transform: "scale(0.5) translateY(20px)" },
          "20%":  { opacity: "1", transform: "scale(1.20) translateY(0)" },
          "30%":  { opacity: "1", transform: "scale(1.00) translateY(0)" },
          "85%":  { opacity: "1", transform: "scale(1.00) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(1.00) translateY(-15px)" },
        },
        // Per-hit damage pop: 0.45s. Pops in fast, lifts up, fades out.
        // Multiple hits stagger via CSS animation-delay on each element.
        "damage-pop": {
          "0%":   { opacity: "0", transform: "scale(0.4) translateY(0)" },
          "25%":  { opacity: "1", transform: "scale(1.40) translateY(-2px)" },
          "55%":  { opacity: "1", transform: "scale(1.00) translateY(-10px)" },
          "100%": { opacity: "0", transform: "scale(0.95) translateY(-32px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "skill-cast": "skill-cast 1.4s ease-out forwards",
        "damage-pop": "damage-pop 0.45s ease-out forwards",
      },
    },
  },
  plugins: [animate],
};

export default config;
