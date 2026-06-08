<template>
  <div class="min-h-100dvh bg-gray-900 text-white">
    <header class="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold text-white no-underline">
          <span class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">IT</span>
          Incident Tracker
        </RouterLink>
        <nav v-if="!isUnitMode" class="flex items-center gap-1">
          <RouterLink v-for="tab in tabs" :key="tab.path" :to="tab.path"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === tab.path ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'">
            {{ tab.name }}
          </RouterLink>
        </nav>
        <div class="flex items-center gap-2 text-xs">
          <button v-if="installable" @click="install" class="btn-primary btn-sm">+ Install</button>
          <span class="w-2 h-2 rounded-full" :class="connected ? 'bg-green-500' : 'bg-red-500'"></span>
          <span class="text-gray-400 hidden sm:inline">{{ connected ? 'Live' : 'Offline' }}</span>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-6">
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
import { connected } from './composables/useYjs.js'
import { useToast } from './composables/useToast.js'
import Toast from './components/Toast.vue'

const route = useRoute()
const isUnitMode = computed(() => route.path === '/arriving' && route.query.mode === 'unit')
const tabs = [
  { path: '/', name: 'Dashboard' },
  { path: '/kanban', name: 'Kanban' },
  { path: '/kanban-tryout', name: 'Tryout' },
  { path: '/list', name: 'List' },
  { path: '/admin', name: 'Admin' },
]

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
