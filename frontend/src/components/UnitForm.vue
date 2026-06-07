<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative w-full sm:max-w-md bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold">{{ editId ? 'Edit Unit' : 'Add Unit' }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label mb-1.5 block">Unit Name <span class="text-red-400">*</span></label>
            <input v-model="form.unit" class="input" :class="{ '!border-red-500': errors.unit }" placeholder="e.g. Engine 4"
              @input="errors.unit = ''" />
            <p v-if="errors.unit" class="text-xs text-red-400 mt-1">{{ errors.unit }}</p>
          </div>
          <div>
            <label class="label mb-1.5 block">Status</label>
            <select v-model="form.status" class="input">
              <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
          </div>
          <div>
            <label class="label mb-1.5 block">Location <span class="text-red-400">*</span></label>
            <input v-model="form.location" class="input" :class="{ '!border-red-500': errors.location }" placeholder="Address or area"
              @input="errors.location = ''" />
            <p v-if="errors.location" class="text-xs text-red-400 mt-1">{{ errors.location }}</p>
          </div>
          <div>
            <label class="label mb-1.5 block">Notes</label>
            <textarea v-model="form.notes" class="input" rows="3" placeholder="Optional notes"></textarea>
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
import { reactive, onMounted } from 'vue'
import { useYjs, addUnit, updateUnit } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  presetStatus: { type: String, default: 'en-route' },
  editId: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { units: allUnits, STATUSES } = useYjs()
const { add: addToast } = useToast()

const form = reactive({
  unit: '',
  status: props.presetStatus || 'en-route',
  location: '',
  notes: '',
})

const errors = reactive({ unit: '', location: '' })

onMounted(() => {
  if (props.editId) {
    const u = allUnits.value.find(x => x.id === props.editId)
    if (u) { form.unit = u.unit; form.status = u.status; form.location = u.location; form.notes = u.notes }
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
