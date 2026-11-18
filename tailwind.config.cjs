/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
    "./index.html",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
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
          50: "#fef7ee",
          100: "#fdedd3",
          200: "#fad7a5",
          300: "#f6bc6d",
          400: "#f19833",
          500: "#ed7d0b",
          600: "#de6306",
          700: "#b84a09",
          800: "#943b0f",
          900: "#793210",
          950: "#411806",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors for the museum theme
        museum: {
          gold: "#D4AF37",
          "gold-light": "#F4E4BC",
          "gold-dark": "#B8941F",
          bronze: "#CD7F32",
          "bronze-light": "#E6B366",
          "bronze-dark": "#A0621F",
          stone: "#8B7355",
          "stone-light": "#B5A082",
          "stone-dark": "#6B5A42",
          earth: "#8B4513",
          "earth-light": "#CD853F",
          "earth-dark": "#654321",
        },
        ethiopian: {
          green: "#009639",
          yellow: "#FEDF00",
          red: "#EF2118",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
       fontFamily: {
      garamond: ["var(--font-eb-garamond)", "serif"],
    },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "fade-in-down": "fade-in-down 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        shimmer: "shimmer 2s linear infinite",
        typewriter: "typewriter 3s steps(40) 1s 1 normal both",
        blink: "blink 1s infinite",
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
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(212, 175, 55, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        blink: {
          "0%, 50%": { borderColor: "transparent" },
          "51%, 100%": { borderColor: "currentColor" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern": "url('/images/hero-bg.png')",
        "footer-pattern": "url('/images/footer-bg.png')",
        "ticket-pattern": "url('/images/ticket-bg.png')",
        "museum-texture":
          "linear-gradient(45deg, #f4e4bc 25%, transparent 25%), linear-gradient(-45deg, #f4e4bc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4e4bc 75%), linear-gradient(-45deg, transparent 75%, #f4e4bc 75%)",
      },
      backgroundSize: {
        texture: "20px 20px",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        museum: "0 4px 20px rgba(212, 175, 55, 0.15)",
        "museum-lg": "0 10px 40px rgba(212, 175, 55, 0.2)",
        "inner-museum": "inset 0 2px 4px rgba(212, 175, 55, 0.1)",
        glow: "0 0 20px rgba(212, 175, 55, 0.5)",
        "glow-lg": "0 0 40px rgba(212, 175, 55, 0.6)",
      },
      dropShadow: {
        museum: "0 4px 8px rgba(212, 175, 55, 0.25)",
        glow: "0 0 10px rgba(212, 175, 55, 0.8)",
      },
      screens: {
        xs: "475px",
        "3xl": "1600px",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "2/3": "2 / 3",
        "9/16": "9 / 16",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      transitionDuration: {
        2000: "2000ms",
        3000: "3000ms",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      scale: {
        102: "1.02",
        103: "1.03",
      },
      rotate: {
        1: "1deg",
        2: "2deg",
        3: "3deg",
      },
      skew: {
        1: "1deg",
        2: "2deg",
        3: "3deg",
      },
      brightness: {
        25: ".25",
        175: "1.75",
      },
      contrast: {
        25: ".25",
        175: "1.75",
      },
      grayscale: {
        50: ".5",
      },
      hueRotate: {
        15: "15deg",
        30: "30deg",
        60: "60deg",
        90: "90deg",
      },
      invert: {
        25: ".25",
        50: ".5",
        75: ".75",
      },
      saturate: {
        25: ".25",
        75: ".75",
        175: "1.75",
      },
      sepia: {
        25: ".25",
        75: ".75",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
    // Custom plugin for museum-specific utilities
    ({ addUtilities, addComponents, theme }) => {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        },
        ".text-shadow-lg": {
          textShadow: "4px 4px 8px rgba(0,0,0,0.2)",
        },
        ".text-shadow-museum": {
          textShadow: "2px 2px 4px rgba(212, 175, 55, 0.3)",
        },
        ".bg-museum-pattern": {
          backgroundImage:
            "linear-gradient(45deg, #f4e4bc 25%, transparent 25%), linear-gradient(-45deg, #f4e4bc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4e4bc 75%), linear-gradient(-45deg, transparent 75%, #f4e4bc 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme("colors.gray.100"),
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.museum.gold"),
            borderRadius: "3px",
          },
        },
      }

      const newComponents = {
        ".btn-museum": {
          padding: `${theme("spacing.3")} ${theme("spacing.6")}`,
          backgroundColor: theme("colors.museum.gold"),
          color: theme("colors.white"),
          borderRadius: theme("borderRadius.lg"),
          fontWeight: theme("fontWeight.semibold"),
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: theme("colors.museum.gold-dark"),
            transform: "translateY(-1px)",
            boxShadow: theme("boxShadow.museum"),
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        ".card-museum": {
          backgroundColor: theme("colors.white"),
          borderRadius: theme("borderRadius.xl"),
          boxShadow: theme("boxShadow.museum"),
          padding: theme("spacing.6"),
          border: `1px solid ${theme("colors.museum.gold")}20`,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: theme("boxShadow.museum-lg"),
            transform: "translateY(-2px)",
          },
        },
        ".gradient-museum": {
          background: `linear-gradient(135deg, ${theme("colors.museum.gold")} 0%, ${theme("colors.museum.bronze")} 100%)`,
        },
        ".gradient-ethiopian": {
          background: `linear-gradient(135deg, ${theme("colors.ethiopian.green")} 0%, ${theme("colors.ethiopian.yellow")} 50%, ${theme("colors.ethiopian.red")} 100%)`,
        },
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
    },
  ],
}
