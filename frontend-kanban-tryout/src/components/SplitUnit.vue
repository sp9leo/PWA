<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"></div>
      <div class="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <h2 class="text-lg font-bold">Split Unit</h2>
            <p class="text-sm font-semibold text-gray-600 truncate">{{ unit?.unit }}</p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-900 text-xl leading-none">&times;</button>
        </div>

        <div v-if="!unit" class="text-sm text-gray-600">This unit no longer exists.</div>

        <div v-else class="space-y-4">
          <!-- Vehicle picker -->
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <label class="label block">Vehicles to move</label>
              <span class="text-sm font-semibold text-gray-600">{{ selected.length }} / {{ vehicles.length }} selected</span>
            </div>
            <div class="space-y-1.5">
              <label v-for="(v, i) in vehicles" :key="i"
                class="flex items-center gap-3 border rounded-lg p-2 cursor-pointer transition-colors"
                :class="selected.includes(i) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-white'">
                <input type="checkbox" :checked="selected.includes(i)" @change="toggleVehicle(i)"
                  class="accent-blue-500 w-4 h-4 shrink-0 cursor-pointer" />
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-sm text-gray-900 truncate">
                    {{ v.type || 'No type' }}
                    <span v-if="v.callSign" class="font-medium text-gray-600">· {{ v.callSign }}</span>
                  </div>
                  <div class="text-sm text-gray-600">{{ v.crew }} {{ v.crew === 1 ? 'crew member' : 'crew' }}</div>
                </div>
              </label>
            </div>
            <p v-if="allSelected" class="text-sm font-medium text-amber-700 mt-1.5">
              Leave at least one vehicle in {{ unit.unit }}.
            </p>
          </div>

          <template v-if="selected.length && !allSelected">
            <!-- How to split -->
            <div>
              <label class="label mb-1.5 block">Create</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" @click="mode = 'together'"
                  class="rounded-lg border px-3 py-2 text-sm font-semibold text-left transition-colors"
                  :class="mode === 'together' ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'">
                  One new unit
                </button>
                <button type="button" @click="mode = 'separate'"
                  class="rounded-lg border px-3 py-2 text-sm font-semibold text-left transition-colors"
                  :class="mode === 'separate' ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'">
                  One unit per vehicle
                </button>
              </div>
            </div>

            <!-- Names -->
            <div v-if="mode === 'together'">
              <label class="label mb-1.5 block">New unit name <span class="text-red-600">*</span></label>
              <input v-model="name" class="input" :class="{ '!border-red-500': errors.name }"
                placeholder="e.g. Enota 1 · GVC-2" @input="nameEdited = true" />
              <p v-if="errors.name" class="text-sm font-medium text-red-600 mt-1">{{ errors.name }}</p>
            </div>
            <div v-else>
              <label class="label mb-1.5 block">New unit names <span class="text-red-600">*</span></label>
              <div class="space-y-2">
                <div v-for="i in sortedSelected" :key="i" class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-gray-600 w-24 shrink-0 truncate"
                    :title="vehicleLabel(vehicles[i])">{{ vehicleLabel(vehicles[i]) }}</span>
                  <input v-model="separateNames[i]" class="input-sm" :class="{ '!border-red-500': errors.name }" />
                </div>
              </div>
              <p v-if="errors.name" class="text-sm font-medium text-red-600 mt-1">{{ errors.name }}</p>
            </div>

            <!-- Shared fields for the new unit(s) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5 block">Status</label>
                <select v-model="status" class="input">
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5 block">Location <span class="text-red-600">*</span></label>
                <select v-model="selectedLocation" @change="onLocationSelect" class="input"
                  :class="{ '!border-red-500': errors.location }">
                  <option value="">— Select —</option>
                  <option v-for="s in sectors" :key="s.id" :value="s.name">{{ s.name }}</option>
                  <option value="__custom__">Custom…</option>
                </select>
              </div>
            </div>
            <input v-if="showCustomLocation" ref="customLocationInput" v-model="location" class="input"
              :class="{ '!border-red-500': errors.location }" placeholder="Enter address or area" />
            <p v-if="errors.location" class="text-sm font-medium text-red-600 -mt-2">{{ errors.location }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5 block">Leader</label>
                <input v-model="leader" class="input" placeholder="Name" />
              </div>
              <div>
                <label class="label mb-1.5 block">Phone</label>
                <input v-model="leaderPhone" type="tel" class="input" placeholder="+386 ..." />
              </div>
            </div>

            <div>
              <label class="label mb-1.5 block">Notes</label>
              <textarea v-model="notes" class="input" rows="2" placeholder="Optional notes"></textarea>
            </div>

            <p v-if="mode === 'separate' && selected.length > 1" class="text-sm text-gray-600">
              All new units start with the same status and location — edit each one afterwards if they differ.
            </p>
          </template>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="$emit('close')" class="btn-ghost flex-1">Cancel</button>
          <button @click="submit" :disabled="!canSubmit"
            class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ mode === 'separate' && selected.length > 1 ? `Split into ${selected.length} units` : 'Split Unit' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useYjs, addUnit, updateUnit } from '../composables/useYjs.js'
import { normalizeVehicles } from '../composables/vehicles.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  unitId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const { units, sectors, STATUSES } = useYjs()
const { add: addToast } = useToast()

const unit = computed(() => units.value.find(u => u.id === props.unitId) || null)
const vehicles = computed(() => normalizeVehicles(unit.value))

const selected = ref([])
const mode = ref('together')

const sortedSelected = computed(() => [...selected.value].sort((a, b) => a - b))
const allSelected = computed(() => vehicles.value.length > 0 && selected.value.length === vehicles.value.length)
const canSubmit = computed(() =>
  !!unit.value && selected.value.length > 0 && !allSelected.value
)

function toggleVehicle(i) {
  const pos = selected.value.indexOf(i)
  if (pos === -1) selected.value.push(i)
  else selected.value.splice(pos, 1)
}

function vehicleLabel(v) {
  return v.callSign || v.type || 'Vehicle'
}

/* ---------- New names ---------- */
const autoName = computed(() => {
  if (!unit.value) return ''
  const picked = sortedSelected.value.map(i => vehicles.value[i])
  if (!picked.length) return unit.value.unit
  const suffix = picked.length === 1 ? vehicleLabel(picked[0]) : `${picked.length} vehicles`
  return `${unit.value.unit} · ${suffix}`
})

const name = ref('')
const nameEdited = ref(false)
watch(autoName, value => {
  if (!nameEdited.value) name.value = value
}, { immediate: true })

const separateNames = reactive({})
watch(selected, () => {
  for (const i of selected.value) {
    if (!separateNames[i] && unit.value) {
      separateNames[i] = `${unit.value.unit} · ${vehicleLabel(vehicles.value[i])}`
    }
  }
}, { deep: true })

/* ---------- Shared fields ---------- */
const status = ref('en-route')
const leader = ref('')
const leaderPhone = ref('')
const notes = ref('')
const location = ref('')
const selectedLocation = ref('')
const showCustomLocation = ref(false)
const customLocationInput = ref(null)

function onLocationSelect() {
  if (selectedLocation.value === '__custom__') {
    showCustomLocation.value = true
    location.value = ''
    nextTick(() => customLocationInput.value?.focus())
  } else {
    showCustomLocation.value = false
    location.value = selectedLocation.value
  }
}

onMounted(() => {
  const u = unit.value
  if (!u) return
  status.value = u.status || 'en-route'
  leader.value = u.leader || ''
  leaderPhone.value = u.leaderPhone || ''
  notes.value = u.notes || ''
  location.value = u.location || ''
  if (location.value && sectors.value.some(s => s.name === location.value)) {
    selectedLocation.value = location.value
  } else if (location.value) {
    selectedLocation.value = '__custom__'
    showCustomLocation.value = true
  }
})

const statusLabel = (s) => ({
  'en-route': 'V PRIHODU',
  'on-scene': 'NERAZPOREJENI',
  'triaged': 'V POSREDOVANJU',
  'transport': 'ODHOD',
  'cleared': 'DRUGO',
}[s] || s)

/* ---------- Submit ---------- */
const errors = reactive({ name: '', location: '' })

function validate() {
  errors.name = ''
  errors.location = ''
  let ok = true

  if (!selected.value.length) { errors.name = 'Select at least one vehicle to move'; ok = false }
  else if (allSelected.value) { errors.name = `Leave at least one vehicle in ${unit.value?.unit || 'the unit'}`; ok = false }

  if (mode.value === 'together' && !name.value.trim()) {
    errors.name = 'Unit name is required'
    ok = false
  }
  if (mode.value === 'separate') {
    for (const i of selected.value) {
      if (!String(separateNames[i] || '').trim()) {
        errors.name = 'Every new unit needs a name'
        ok = false
        break
      }
    }
  }

  if (!location.value.trim()) { errors.location = 'Location is required'; ok = false }

  return ok
}

function submit() {
  if (!validate()) return

  const original = vehicles.value.slice()
  const picked = new Set(selected.value)
  const remaining = original.filter((_, i) => !picked.has(i))
  const moved = original.filter((_, i) => picked.has(i))
  const shared = {
    status: status.value,
    location: location.value.trim(),
    leader: leader.value,
    leaderPhone: leaderPhone.value,
    notes: notes.value,
  }

  updateUnit(props.unitId, { vehicles: remaining })

  if (mode.value === 'together') {
    addUnit({ unit: name.value.trim(), ...shared, vehicles: moved })
    addToast('Vehicles split into a new unit', 'success')
  } else {
    for (const i of sortedSelected.value) {
      addUnit({ unit: separateNames[i].trim(), ...shared, vehicles: [original[i]] })
    }
    addToast(`Split into ${selected.value.length} units`, 'success')
  }

  emit('close')
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (min-width: 640px) {
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
</style>
