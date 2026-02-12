import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          light: '#A8A5FF',
          dark: '#403E6A',
          accent: '#7C6FD8',
        },
      },
      backgroundColor: {
        dark: '#0f0f0f',
        card: '#1a1a1a',
      },
    },
  },
  plugins: [],
}
export default config
