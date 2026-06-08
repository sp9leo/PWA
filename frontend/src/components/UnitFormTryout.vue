<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative w-full sm:max-w-lg bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold">{{ editId ? 'Edit Unit' : 'Add Unit' }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div class="sm:grid sm:grid-cols-2 sm:gap-x-3 sm:gap-y-0">
          <div class="space-y-4 sm:col-span-2">
            <div>
              <label class="label mb-1.5 block">Unit Name <span class="text-red-400">*</span></label>
              <input v-model="form.unit" list="unit-suggestions" class="input" :class="{ '!border-red-500': errors.unit }"
                placeholder="e.g. Engine 4" @input="onUnitInput" />
              <datalist id="unit-suggestions">
                <option v-for="u in predefinedUnits" :key="u.id" :value="u.name" />
              </datalist>
              <p v-if="errors.unit" class="text-xs text-red-400 mt-1">{{ errors.unit }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label mb-1.5 block">Status</label>
              <select v-model="form.status" class="input">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
              </select>
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
          </div>

          <div class="space-y-4">
            <div>
              <label class="label mb-1.5 block">Unit Type</label>
              <select v-model="selectedType" @change="onTypeSelect" class="input">
                <option value="">— Select —</option>
                <option v-for="t in typeNames" :key="t" :value="t">{{ t }}</option>
                <option value="__custom__">Custom…</option>
              </select>
              <input v-if="showCustomType" ref="customTypeInput" v-model="form.type" class="input mt-2" placeholder="Enter custom type" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5 block">Leader</label>
                <input v-model="form.leader" class="input" placeholder="Name" />
              </div>
              <div>
                <label class="label mb-1.5 block">Phone</label>
                <input v-model="form.leaderPhone" type="tel" class="input" placeholder="+386 ..." />
              </div>
            </div>
          </div>

          <div class="space-y-4 sm:col-span-2">
            <div>
              <label class="label mb-1.5 block">Location <span class="text-red-400">*</span></label>
              <select v-model="selectedLocation" @change="onLocationSelect" class="input"
                :class="{ '!border-red-500': errors.location }">
                <option value="">— Select —</option>
                <option v-for="s in sectors" :key="s.id" :value="s.name">{{ s.name }}</option>
                <option value="__custom__">Custom…</option>
              </select>
              <input v-if="showCustomLocation" ref="customLocationInput" v-model="form.location" class="input mt-2"
                :class="{ '!border-red-500': errors.location }" placeholder="Enter address or area"
                @input="errors.location = ''" />
              <p v-if="errors.location" class="text-xs text-red-400 mt-1">{{ errors.location }}</p>
            </div>
            <div>
              <label class="label mb-1.5 block">Notes</label>
              <textarea v-model="form.notes" class="input" rows="2" placeholder="Optional notes"></textarea>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="$emit('close')" class="btn-ghost flex-1">Cancel</button>
          <button @click="submit" class="btn-primary flex-1">{{ editId ? 'Save' : 'Add Unit' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useYjs, addUnit, updateUnit } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  presetStatus: { type: String, default: 'en-route' },
  editId: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { units: allUnits, STATUSES, predefinedUnits, sectors, unitTypes } = useYjs()

function onUnitInput() {
  const match = predefinedUnits.value.find(u => u.name === form.unit)
  if (match) form.status = match.defaultStatus
}
const { add: addToast } = useToast()

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

const selectedLocation = ref('')
const showCustomLocation = ref(false)
const customLocationInput = ref(null)

function onLocationSelect() {
  if (selectedLocation.value === '__custom__') {
    showCustomLocation.value = true
    form.location = ''
    nextTick(() => customLocationInput.value?.focus())
  } else {
    showCustomLocation.value = false
    form.location = selectedLocation.value
  }
}

const form = reactive({
  unit: '',
  status: props.presetStatus || 'en-route',
  type: '',
  leader: '',
  leaderPhone: '',
  personnelCount: 1,
  location: '',
  notes: '',
})

const errors = reactive({ unit: '', location: '' })

onMounted(() => {
  if (props.editId) {
    const u = allUnits.value.find(x => x.id === props.editId)
    if (u) {
      form.unit = u.unit; form.status = u.status; form.type = u.type || ''; form.leader = u.leader || ''; form.leaderPhone = u.leaderPhone || ''; form.personnelCount = u.personnelCount || 1; form.location = u.location; form.notes = u.notes
      if (u.type) {
        if (typeNames.value.includes(u.type)) {
          selectedType.value = u.type
        } else {
          selectedType.value = '__custom__'
          showCustomType.value = true
        }
      }
      if (u.location) {
        const sectorNames = sectors.value.map(s => s.name)
        if (sectorNames.includes(u.location)) {
          selectedLocation.value = u.location
        } else {
          selectedLocation.value = '__custom__'
          showCustomLocation.value = true
        }
      }
    }
  }
})

const statusLabel = (s) => ({ 'en-route': 'En Route', 'on-scene': 'On Scene', 'triaged': 'Triaged', 'transport': 'Transport', 'cleared': 'Cleared' }[s] || s)

function validate() {
  let ok = true
  if (!form.unit.trim()) { errors.unit = 'Unit name is required'; ok = false }
  if (!form.location.trim()) { errors.location = 'Location is required'; ok = false }
  return ok
}

function submit() {
  if (!validate()) return
  if (props.editId) {
    updateUnit(props.editId, { ...form })
    addToast('Unit updated', 'success')
  } else {
    addUnit({ ...form })
    addToast('Unit added', 'success')
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
