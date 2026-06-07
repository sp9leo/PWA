<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <button @click="showForm = true" class="btn-primary">
        <span class="text-lg leading-none">+</span> Add Unit
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <div v-for="s in statuses" :key="s.key"
        class="card text-center cursor-pointer transition-all"
        :class="{ 'ring-2 ring-white/20': filterStatus === s.key }"
        @click="filterStatus = filterStatus === s.key ? '' : s.key"
        :style="{ borderLeftColor: `var(--status-${s.key})`, borderLeftWidth: '3px' }">
        <div class="text-2xl font-bold" :style="{ color: `var(--status-${s.key})` }">{{ counts[s.key] || 0 }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ s.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h2 class="text-sm font-semibold text-gray-300 mb-3">Status Distribution</h2>
        <div class="space-y-2">
          <div v-for="s in statuses" :key="s.key" class="flex items-center gap-3">
            <span class="text-xs text-gray-400 w-20">{{ s.label }}</span>
            <div class="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ease-out"
                :style="{ width: pct(s.key), backgroundColor: `var(--status-${s.key})` }"></div>
            </div>
            <span class="text-xs text-gray-400 w-8 text-right tabular-nums">{{ counts[s.key] || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-sm font-semibold text-gray-300 mb-3">Recent Units</h2>
        <div v-if="recent.length" class="space-y-1 max-h-64 overflow-y-auto">
          <div v-for="u in recent" :key="u.id"
            class="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            @click="editUnit(u.id)">
            <div class="min-w-0 flex-1">
              <span class="text-sm font-medium">{{ u.unit }}</span>
              <span class="ml-2 text-xs text-gray-500">{{ u.location }}</span>
            </div>
            <span class="badge shrink-0 ml-2" :class="`status-bg-${u.status} status-text-${u.status}`">{{ statusLabel(u.status) }}</span>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-8 text-gray-500">
          <span class="text-3xl mb-2">&#128260;</span>
          <p class="text-sm">No units yet — add one to get started</p>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <h2 class="text-sm font-semibold text-gray-300 mb-3">Recent Activity</h2>
      <div v-if="recentActivity.length" class="space-y-1 max-h-64 overflow-y-auto">
        <div v-for="a in recentActivity" :key="a.id"
          class="flex items-center gap-3 py-2 px-2 rounded-lg text-xs">
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: `var(--status-${a.toStatus})` }"></span>
          <span class="text-gray-300 font-medium">{{ a.unitName }}</span>
          <span class="text-gray-500">{{ a.fromStatus ? statusLabel(a.fromStatus) + ' →' : '' }}</span>
          <span class="badge" :class="`status-bg-${a.toStatus} status-text-${a.toStatus}`">{{ statusLabel(a.toStatus) }}</span>
          <span class="text-gray-600 ml-auto shrink-0">{{ timeAgo(a.timestamp) }}</span>
        </div>
      </div>
      <div v-else class="flex items-center justify-center py-6 text-gray-500 text-sm">
        No activity yet
      </div>
    </div>

    <UnitForm v-if="showForm" :editId="editingId" @close="closeForm" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useYjs } from '../composables/useYjs.js'
import UnitForm from '../components/UnitForm.vue'

const { units, activities, STATUSES } = useYjs()
const showForm = ref(false)
const editingId = ref('')
const filterStatus = ref('')

const statuses = [
  { key: 'en-route', label: 'En Route' },
  { key: 'on-scene', label: 'On Scene' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'transport', label: 'Transport' },
  { key: 'cleared', label: 'Cleared' },
]

const counts = computed(() => {
  const c = {}
  for (const s of STATUSES) c[s] = 0
  for (const u of units.value) c[u.status] = (c[u.status] || 0) + 1
  return c
})

const total = computed(() => units.value.length)

const pct = (s) => total.value ? `${((counts.value[s] || 0) / total.value * 100).toFixed(1)}%` : '0%'

const recent = computed(() =>
  [...units.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10)
)

const recentActivity = computed(() => activities.value.slice(0, 20))

const statusLabel = (s) => statuses.find(st => st.key === s)?.label || s

function editUnit(id) {
  editingId.value = id
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = ''
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>
