/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds (dark theme)
        'bg-app': '#0a0a0a',          // Base app background
        'bg-surface-1': '#1a1a1a',    // Cards, panels
        'bg-surface-2': '#242424',    // Elevated cards, secondary panels
        'bg-surface-3': '#2d2d2d',    // Popovers, modals
        
        // Borders
        'border-subtle': '#404040',   // Subtle dividers
        'border-medium': '#525252',   // Medium emphasis
        
        // Text
        'text-primary': '#ffffff',    // Primary text
        'text-secondary': '#d1d1d1',  // Secondary text
        'text-muted': '#888888',      // Muted/placeholder text
        
        // Brand colors (Morado)
        'brand-primary': '#A8A5FF',   // Primary accent
        'brand-deep': '#403E6A',      // Deep/pressed state
        
        // Status colors
        'status-success': '#10b981',  // Green
        'status-error': '#dc2626',    // Red (dark version)
        'status-warning': '#f59e0b',  // Amber
      },
      backgroundColor: {
        app: '#0a0a0a',
        'surface-1': '#1a1a1a',
        'surface-2': '#242424',
        'surface-3': '#2d2d2d',
      },
      textColor: {
        primary: '#ffffff',
        secondary: '#d1d1d1',
        muted: '#888888',
      },
      borderColor: {
        subtle: '#404040',
        medium: '#525252',
      },
      ringColor: {
        brand: '#A8A5FF',
      },
    },
  },
  plugins: [],
}


