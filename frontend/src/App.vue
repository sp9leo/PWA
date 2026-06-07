<template>
  <div class="min-h-100dvh bg-gray-900 text-white">
    <header class="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold text-white no-underline">
          <span class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">IT</span>
          Incident Tracker
        </RouterLink>
        <nav class="flex items-center gap-1">
          <RouterLink v-for="tab in tabs" :key="tab.path" :to="tab.path"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === tab.path ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'">
            {{ tab.name }}
          </RouterLink>
        </nav>
        <div class="flex items-center gap-2 text-xs">
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
import { connected } from './composables/useYjs.js'
import Toast from './components/Toast.vue'

const tabs = [
  { path: '/', name: 'Dashboard' },
  { path: '/kanban', name: 'Kanban' },
  { path: '/list', name: 'List' },
]
</script>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
