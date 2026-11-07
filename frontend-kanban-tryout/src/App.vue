<template>
  <div class="min-h-100dvh bg-gray-50 text-gray-900">
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold text-gray-900 no-underline">
          <span class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">IT</span>
          Incident Tracker
        </RouterLink>
        <nav class="flex items-center gap-1">
          <RouterLink v-for="tab in visibleTabs" :key="tab.path" :to="tab.path"
            class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            :class="$route.path === tab.path ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'">
            {{ tab.name }}
          </RouterLink>
        </nav>
        <div class="flex items-center gap-2 text-xs">
          <!-- Install button hidden for now
          <button v-if="installable" @click="install" class="btn-primary btn-sm">+ Install</button>
          -->
          <span class="w-2 h-2 rounded-full" :class="connected ? 'bg-green-500' : 'bg-red-500'"></span>
          <span class="text-gray-600 hidden sm:inline">{{ connected ? 'Live' : 'Offline' }}</span>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Counters strip -->
      <div class="mb-4 flex flex-wrap gap-4">
        <div class="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total units</div>
          <div class="text-2xl font-bold text-gray-900">{{ totalUnits }}</div>
        </div>
        <div class="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total crew</div>
          <div class="text-2xl font-bold text-gray-900">{{ totalCrew }}</div>
        </div>
        <div v-for="s in STATUSES" :key="s.key"
          class="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: `var(--status-${s})` }"></span>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {{ statusLabelShort[s] }}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-gray-900">{{ unitsByStatus[s] }}</span>
            <span class="text-xs font-medium text-gray-500">{{ crewByStatus[s] }} crew</span>
          </div>
        </div>
      </div>
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { connected, useYjs } from './composables/useYjs.js'
import { useToast } from './composables/useToast.js'
import Toast from './components/Toast.vue'

const route = useRoute()
const tabs = [
  { path: '/', name: 'Kanban Tryout' },
  { path: '/admin', name: 'Admin' },
  { path: '/hq', name: 'HQ' },
]

// On HQ view, only show the HQ nav link
const visibleTabs = computed(() => {
  if (route.path.startsWith('/hq')) return tabs.filter(t => t.path === '/hq')
  return tabs
})

const {
  totalUnits,
  unitsByStatus,
  totalCrew,
  crewByStatus,
  STATUSES,
} = useYjs()

const statusLabelShort = {
  'en-route': 'V PRIHODU',
  'on-scene': 'NERAZPOREJENI',
  'triaged': 'V POSREDOVANJU',
  'transport': 'ODHOD',
  'cleared': 'DRUGO',
}

const { add: addToast } = useToast()

const installable = ref(false)
let deferredPrompt = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    installable.value = true
  })
  window.addEventListener('appinstalled', () => {
    installable.value = false
    deferredPrompt = null
  })
  // fallback: show button after 5s even if beforeinstallprompt didn't fire
  setTimeout(() => {
    if (!installable.value && window.matchMedia('(display-mode: browser)').matches) {
      installable.value = true
    }
  }, 5000)
})

async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') installable.value = false
    deferredPrompt = null
  } else {
    addToast('Open browser menu → Install "Incident Tracker"', 'info', 6000)
  }
}
</script>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
