<template>
  <div class="max-w-md mx-auto">
    <div v-if="isUnitMode" class="text-xs text-center text-gray-500 mb-4 bg-gray-800 rounded-lg py-2 px-3">
      Unit mode — this device can only access the arriving view
    </div>
    <div v-if="!authenticated && pinCode" class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔐</div>
        <h1 class="text-xl font-bold">Arriving View</h1>
        <p class="text-sm text-gray-400 mt-1">Enter PIN to access</p>
      </div>
      <div class="flex gap-2 mb-4">
        <input v-for="i in 4" :key="i" ref="pinInputs"
          v-model="pinDigits[i - 1]"
          type="tel" maxlength="1"
          class="w-12 h-14 text-center text-xl font-bold input"
          @input="onPinInput(i - 1)"
          @keydown.backspace="onPinBackspace(i - 1)" />
      </div>
      <p v-if="pinError" class="text-xs text-red-400 mb-2">{{ pinError }}</p>
      <button @click="checkPin" class="btn-primary w-full">Unlock</button>
    </div>

    <div v-else-if="!activeUnitId" class="min-h-[60vh] flex flex-col justify-center">
      <div class="text-center mb-6">
        <div class="text-3xl mb-2">🚒</div>
        <h1 class="text-xl font-bold">Dispatch Unit</h1>
        <p class="text-sm text-gray-400 mt-1">Quick entry for arriving units</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="label mb-1.5 block">Unit Name <span class="text-red-400">*</span></label>
          <input v-model="form.unit" list="unit-suggestions" class="input"
            :class="{ '!border-red-500': errors.unit }" placeholder="e.g. Engine 4"
            @input="errors.unit = ''" />
          <datalist id="unit-suggestions">
            <option v-for="u in predefinedUnits" :key="u.id" :value="u.name" />
          </datalist>
          <p v-if="errors.unit" class="text-xs text-red-400 mt-1">{{ errors.unit }}</p>
        </div>

        <div>
          <label class="label mb-1.5 block">Unit Type</label>
          <select v-model="selectedType" @change="onTypeSelect" class="input">
            <option value="">— Select —</option>
            <option v-for="t in typeNames" :key="t" :value="t">{{ t }}</option>
            <option value="__custom__">Custom…</option>
          </select>
          <input v-if="showCustomType" ref="customTypeInput" v-model="form.type" class="input mt-2" placeholder="Enter custom type" />
        </div>

        <div>
          <label class="label mb-1.5 block">Leader Phone</label>
          <input v-model="form.leaderPhone" type="tel" class="input" placeholder="+386 ..." />
        </div>

        <div>
          <label class="label mb-1.5 block">Personnel</label>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button v-for="n in 7" :key="n" type="button"
              @click="form.personnelCount = n"
              class="w-9 h-9 rounded-lg text-sm font-bold transition-colors"
              :class="form.personnelCount === n ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
            >{{ n }}</button>
          </div>
        </div>

        <button @click="submit" class="btn-primary w-full py-3 text-base">
          <span class="text-lg leading-none">🚒</span> Dispatch Unit
        </button>
      </div>
    </div>

    <div v-else class="min-h-[60vh] flex flex-col justify-center items-center">
      <div class="text-center mb-4">
        <div class="text-4xl mb-2">✅</div>
        <h1 class="text-lg font-bold">Unit Dispatched</h1>
        <p class="text-sm text-gray-400 mt-1">Tracking live status</p>
      </div>

      <div class="w-full card !p-4" :style="{ borderTopColor: `var(--status-${trackedUnit?.status})`, borderTopWidth: '3px' }">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium text-base">{{ trackedUnit?.unit || '—' }}</div>
          <span class="badge" :class="`status-bg-${trackedUnit?.status} status-text-${trackedUnit?.status}`">
            {{ statusLabel(trackedUnit?.status) }}
          </span>
        </div>
        <div v-if="trackedUnit?.type" class="text-sm text-gray-500">🚒 {{ trackedUnit.type }}</div>
        <div v-if="trackedUnit?.location" class="text-sm text-gray-400 mt-1">{{ trackedUnit.location }}</div>
        <div class="text-xs text-gray-500 mt-2 space-y-0.5">
          <div v-if="trackedUnit?.leaderPhone">📞 {{ trackedUnit.leaderPhone }}</div>
          <div v-if="trackedUnit?.personnelCount">{{ trackedUnit.personnelCount }} pers</div>
          <div class="text-gray-600">{{ timeOnly }}</div>
        </div>
      </div>

      <button @click="reset" class="btn-ghost mt-6">Dispatch another unit</button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, nextTick } from 'vue'
import { useYjs, addUnit, pinCode, connected } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'

const { units, unitTypes, predefinedUnits, STATUSES, connected } = useYjs()
const { add: addToast } = useToast()

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const isUnitMode = route.query.mode === 'unit'
if (isUnitMode) sessionStorage.setItem('role', 'unit')

const authenticated = ref(sessionStorage.getItem('arriving_auth') === 'true')

const pinDigits = ref(['', '', '', ''])
const pinInputs = ref([])
const pinError = ref('')

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
function checkPin() {
  const entered = pinDigits.value.join('')
  if (entered === pinCode.value) {
    authenticated.value = true
    sessionStorage.setItem('arriving_auth', 'true')
  } else {
    pinError.value = 'Incorrect PIN'
    pinDigits.value = ['', '', '', '']
    nextTick(() => pinInputs.value[0]?.focus())
  }
}

const typeNames = computed(() => unitTypes.value.map(t => t.name))
const selectedType = ref('')
const showCustomType = ref(false)
const customTypeInput = ref(null)

function onTypeSelect() {
  if (selectedType.value === '__custom__') {
    showCustomType.value = true
    form.type = ''
    nextTick(() => customTypeInput.value?.focus())
  } else {
    showCustomType.value = false
    form.type = selectedType.value
  }
}

const form = reactive({
  unit: '',
  type: '',
  leaderPhone: '',
  personnelCount: 1,
})

const errors = reactive({ unit: '' })
let activeUnitId = ref('')

const trackedUnit = computed(() => units.value.find(u => u.id === activeUnitId.value))

const statusLabel = (s) => ({ 'en-route': 'En Route', 'on-scene': 'On Scene', 'triaged': 'Triaged', 'transport': 'Transport', 'cleared': 'Cleared' }[s] || s)

const timeOnly = computed(() => {
  if (!trackedUnit.value) return ''
  const d = new Date(trackedUnit.value.updatedAt || trackedUnit.value.createdAt)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

function submit() {
  if (!form.unit.trim()) { errors.unit = 'Unit name is required'; return }
  const id = addUnit({
    unit: form.unit.trim(),
    type: form.type,
    leader: '',
    leaderPhone: form.leaderPhone,
    personnelCount: form.personnelCount,
    location: '',
    notes: '',
    status: 'en-route',
  })
  activeUnitId.value = id
  addToast('Unit dispatched', 'success')
}

function reset() {
  activeUnitId.value = ''
  form.unit = ''
  form.type = ''
  form.leaderPhone = ''
  form.personnelCount = 1
  selectedType.value = ''
  showCustomType.value = false
}
</script>
