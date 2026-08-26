import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8e1',
          100: '#ffecb3',
          400: '#ffca28',
          500: '#ffb300',
          600: '#fb8c00',
          700: '#e65100'
        }
      }
    }
  },
  plugins: []
};

export default config;
