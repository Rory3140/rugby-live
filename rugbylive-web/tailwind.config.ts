import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:     'var(--bg)',
        surf:   'var(--surf)',
        surf2:  'var(--surf2)',
        surf3:  'var(--surf3)',
        surf4:  'var(--surf4)',
        accent: 'var(--accent)',
        live:   'var(--live)',
        green:  'var(--green)',
      },
      fontFamily: {
        bebas: ['var(--font-bebas)'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1120px',
      },
    },
  },
  plugins: [],
}

export default config
