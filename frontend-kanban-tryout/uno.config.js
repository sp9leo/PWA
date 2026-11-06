import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 cursor-pointer select-none inline-flex items-center justify-center gap-1.5',
    'btn-primary': 'btn bg-blue-700 text-white hover:bg-blue-800 shadow-sm',
    'btn-ghost': 'btn text-gray-700 hover:text-gray-900 hover:bg-gray-100',
    'btn-sm': 'px-3 py-1.5 text-sm',
    'card': 'bg-white rounded-xl border border-gray-200 shadow-sm p-4',
    'card-hover': 'card hover:shadow-md hover:border-gray-300 transition-all',
    'input': 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors',
    'input-sm': 'w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors',
    'label': 'text-sm font-semibold text-gray-700',
    'badge': 'inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold tracking-wide',
    'chip': 'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all select-none border',
    'chip-active': 'chip bg-gray-900 text-white border-gray-900 shadow-sm',
    'chip-inactive': 'chip bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900',
  },
  theme: {
    colors: {
      status: {
        'en-route': '#1d4ed8',
        'on-scene': '#b45309',
        'triaged': '#c2410c',
        'transport': '#6d28d9',
        'cleared': '#15803d',
      }
    }
  },
  rules: [
    [/^status-bg-(.+)$/, ([, c]) => ({ 'background-color': `var(--status-${c})` })],
    [/^status-text-(.+)$/, () => ({ color: '#ffffff' })],
    [/^status-border-(.+)$/, ([, c]) => ({ 'border-color': `var(--status-${c})` })],
  ],
  preflights: [
    {
      getCSS: () => `
        :root {
          --status-en-route: #1d4ed8;
          --status-on-scene: #b45309;
          --status-triaged: #c2410c;
          --status-transport: #6d28d9;
          --status-cleared: #15803d;
          color-scheme: light;
        }
        body {
          background-color: #f8fafc;
          color: #0f172a;
        }
        * { -webkit-tap-highlight-color: transparent; }
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `
    }
  ]
})
