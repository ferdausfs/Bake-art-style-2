import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        siliguri: ['"Hind Siliguri"', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
        playfair: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
