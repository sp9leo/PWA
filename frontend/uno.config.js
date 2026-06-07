import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 cursor-pointer select-none inline-flex items-center justify-center gap-1.5',
    'btn-primary': 'btn bg-blue-600 text-white hover:bg-blue-700',
    'btn-ghost': 'btn text-gray-400 hover:text-white hover:bg-white/5',
    'btn-sm': 'px-2.5 py-1.5 text-xs',
    'card': 'bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-4',
    'card-hover': 'card hover:bg-gray-800/80 transition-colors',
    'input': 'w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors',
    'input-sm': 'w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors',
    'label': 'text-xs font-medium text-gray-400 uppercase tracking-wider',
    'badge': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    'chip': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all select-none',
    'chip-active': 'chip bg-white/10 text-white',
    'chip-inactive': 'chip text-gray-400 hover:text-white hover:bg-white/5',
  },
  theme: {
    colors: {
      status: {
        'en-route': '#3b82f6',
        'on-scene': '#f59e0b',
        'triaged': '#f97316',
        'transport': '#8b5cf6',
        'cleared': '#22c55e',
      }
    }
  },
  rules: [
    [/^status-bg-(.+)$/, ([, c]) => ({ 'background-color': `var(--status-${c})`, '--un-bg-opacity': '0.15' })],
    [/^status-text-(.+)$/, ([, c]) => ({ color: `var(--status-${c})` })],
    [/^status-border-(.+)$/, ([, c]) => ({ 'border-color': `var(--status-${c})` })],
  ],
  preflights: [
    {
      getCSS: () => `
        :root {
          --status-en-route: #3b82f6;
          --status-on-scene: #f59e0b;
          --status-triaged: #f97316;
          --status-transport: #8b5cf6;
          --status-cleared: #22c55e;
        }
        * { -webkit-tap-highlight-color: transparent; }
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `
    }
  ]
})
