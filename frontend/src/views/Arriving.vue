<template>
  <div class="max-w-md mx-auto">
    <div v-if="isUnitMode" class="text-xs text-center text-gray-500 mb-4 bg-gray-800 rounded-lg py-2 px-3">
      Unit mode — this device can only access the arriving view
    </div>

    <!-- PIN LOGIN -->
    <div v-if="!authenticated" class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔐</div>
        <h1 class="text-xl font-bold">Unit Login</h1>
        <p class="text-sm text-gray-400 mt-1">Enter your unit PIN</p>
      </div>

      <div class="flex gap-2 mb-4">
        <input v-for="i in 4" :key="i" ref="pinInputs"
          v-model="pinDigits[i - 1]"
          type="tel" maxlength="1"
          class="w-12 h-14 text-center text-xl font-bold input"
          @input="onPinInput(i - 1)"
          @keydown.backspace="onPinBackspace(i - 1)"
          @keydown.enter="checkPin" />
      </div>
      <p v-if="pinError" class="text-xs text-red-400 mb-2">{{ pinError }}</p>
      <button @click="checkPin" class="btn-primary w-full">Continue</button>
    </div>

    <!-- ADMIN OVERRIDE — pick a unit -->
    <div v-else-if="overrideMode" class="min-h-[60vh] flex flex-col justify-center">
      <div class="text-center mb-6">
        <div class="text-3xl mb-2">🔑</div>
        <h1 class="text-lg font-bold">Admin Override</h1>
        <p class="text-sm text-gray-400 mt-1">Select a unit to dispatch</p>
      </div>
      <div class="space-y-2">
        <button v-for="u in predefinedUnits" :key="u.id"
          @click="selectPredefined(u)"
          class="w-full text-left card !p-3 transition-colors hover:bg-gray-700">
          <div class="font-medium">{{ u.name }}</div>
          <div v-if="u.type" class="text-xs text-gray-400">{{ u.type }}</div>
        </button>
        <div v-if="!predefinedUnits.length" class="text-xs text-gray-500 text-center py-4">No predefined units — create some in Admin first</div>
      </div>
      <button @click="backToPin" class="btn-ghost mt-4">Back to PIN login</button>
    </div>

    <!-- DISPATCH / TRACKING -->
    <div v-else class="min-h-[60vh] flex flex-col justify-center items-center">
      <div class="text-center mb-4">
        <div class="text-4xl mb-2" :class="trackedUnit ? 'text-green-400' : 'text-blue-400'">
          {{ trackedUnit ? '✅' : '🚒' }}
        </div>
        <h1 class="text-lg font-bold">{{ trackedUnit ? 'Unit Dispatched' : 'Dispatching…' }}</h1>
        <p class="text-sm text-gray-400 mt-1">
          {{ trackedUnit ? 'Tracking live status' : 'Creating unit…' }}
        </p>
      </div>

      <div v-if="trackedUnit" class="w-full card !p-4" :style="{ borderTopColor: `var(--status-${trackedUnit.status})`, borderTopWidth: '3px' }">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium text-base">{{ trackedUnit.unit }}</div>
          <span class="badge" :class="`status-bg-${trackedUnit.status} status-text-${trackedUnit.status}`">
            {{ statusLabel(trackedUnit.status) }}
          </span>
        </div>
        <div v-if="trackedUnit.type" class="text-sm text-gray-500">🚒 {{ trackedUnit.type }}</div>
        <div v-if="trackedUnit.location" class="text-sm text-gray-400 mt-1">{{ trackedUnit.location }}</div>
        <div v-if="trackedUnit.notes" class="text-xs text-gray-500 mt-1">{{ trackedUnit.notes }}</div>
        <div class="text-xs text-gray-500 mt-2 space-y-0.5">
          <div v-if="trackedUnit.leader || trackedUnit.leaderPhone">📞 {{ trackedUnit.leader || trackedUnit.leaderPhone }}</div>
          <div v-if="trackedUnit.personnelCount">{{ trackedUnit.personnelCount }} pers</div>
          <div class="text-gray-600">{{ timeOnly }}</div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="backToPin" class="btn-ghost">Dispatch another unit</button>
        <button v-if="overrideMode" @click="overrideMode = false; authenticated = false; backToPin()" class="btn-ghost text-gray-500">Exit admin override</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { useYjs, addUnit, pinCode } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'
import { useRoute } from 'vue-router'

const route = useRoute()
const isUnitMode = route.query.mode === 'unit'
if (isUnitMode) sessionStorage.setItem('role', 'unit')

const { units, predefinedUnits } = useYjs()
const { add: addToast } = useToast()

const authenticated = ref(false)
const overrideMode = ref(false)
const pinDigits = ref(['', '', '', ''])
const pinInputs = ref([])
const pinError = ref('')
const activeUnitId = ref('')

const trackedUnit = computed(() => units.value.find(u => u.id === activeUnitId.value))

function onPinInput(idx) {
  pinError.value = ''
  if (pinDigits.value[idx] && idx < 3) {
    nextTick(() => pinInputs.value[idx + 1]?.focus())
  }
}
function onPinBackspace(idx) {
  if (!pinDigits.value[idx] && idx > 0) {
    nextTick(() => pinInputs.value[idx - 1]?.focus())
  }
}

function findActiveUnit(predefinedName) {
  return units.value.find(u => u.unit === predefinedName && u.status !== 'cleared')
}

function dispatchUnit(predefined) {
  const existing = findActiveUnit(predefined.name)
  if (existing) {
    activeUnitId.value = existing.id
    addToast(`Following ${predefined.name}`, 'info')
    return
  }
  const id = addUnit({
    unit: predefined.name,
    type: predefined.type || '',
    location: '',
    notes: '',
    status: predefined.defaultStatus || 'en-route',
  })
  activeUnitId.value = id
  addToast(`${predefined.name} dispatched`, 'success')
}

function checkPin() {
  const entered = pinDigits.value.join('')
  pinError.value = ''

  if (!entered) { pinError.value = 'Enter a PIN'; return }

  // Per-unit PIN match
  const matched = predefinedUnits.value.find(u => u.pin === entered)
  if (matched) {
    authenticated.value = true
    dispatchUnit(matched)
    return
  }

  // Admin override — entering the global admin PIN
  if (pinCode.value && entered === pinCode.value) {
    authenticated.value = true
    overrideMode.value = true
    return
  }

  pinError.value = 'Unknown PIN'
  pinDigits.value = ['', '', '', '']
  nextTick(() => pinInputs.value[0]?.focus())
}

function selectPredefined(u) {
  dispatchUnit(u)
}

function backToPin() {
  activeUnitId.value = ''
  authenticated.value = false
  overrideMode.value = false
  pinDigits.value = ['', '', '', '']
  pinError.value = ''
}

const statusLabel = (s) => ({ 'en-route': 'En Route', 'on-scene': 'On Scene', 'triaged': 'Triaged', 'transport': 'Transport', 'cleared': 'Cleared' }[s] || s)

const timeOnly = computed(() => {
  if (!trackedUnit.value) return ''
  const d = new Date(trackedUnit.value.updatedAt || trackedUnit.value.createdAt)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})
</script>
