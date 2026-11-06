<template>
  <div
    class="group card-hover !p-3 touch-manipulation cursor-grab active:cursor-grabbing relative transition-all duration-200"
    :style="{ borderLeftColor: `var(--status-${unit.status})`, borderLeftWidth: '4px' }"
    :data-id="unit.id"
  >
    <!-- Top Row: Unit Name & Status Badge / Contextual Controls -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="font-bold text-base text-gray-900 leading-tight truncate">
          {{ unit.unit }}
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Formatted Pill Status Badge -->
        <span
          class="badge uppercase"
          :class="`status-bg-${unit.status} status-text-${unit.status}`"
        >
          {{ label }}
        </span>

        <!-- Contextual Controls: Only visible on desktop hover, always accessible on touch -->
        <div
          class="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150"
        >
          <button
            @click="$emit('edit', unit.id)"
            title="Edit Unit"
            class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors text-sm shrink-0"
          >
            &#9998;
          </button>
          <button
            v-if="hasMultipleVehicles"
            @click="$emit('split', unit.id)"
            title="Split Unit"
            class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors text-sm shrink-0"
          >
            &#9986;
          </button>
          <span
            title="Drag to reposition"
            class="text-gray-500 text-base select-none touch-none px-1 cursor-grab active:cursor-grabbing flex items-center justify-center h-8"
          >
            &#9776;
          </span>
        </div>
      </div>
    </div>

    <!-- Middle Section: Location & Dispatch Notes -->
    <div class="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mt-1.5">
      <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="truncate">{{ unit.location }}</span>
    </div>

    <div
      v-if="unit.notes"
      class="text-sm font-medium text-gray-800 bg-amber-50 rounded-lg p-2 mt-2 border border-amber-200 line-clamp-2"
    >
      {{ unit.notes }}
    </div>

    <!-- Bottom Row: Metadata & Timestamp -->
    <div
      class="flex justify-between items-end gap-2 mt-3 pt-2.5 border-t border-gray-200"
    >
      <div class="text-sm text-gray-700 space-y-1.5 font-normal min-w-0">
        <!-- Leader Info -->
        <div
          v-if="unit.leader"
          class="text-gray-900 font-semibold flex items-center gap-1.5"
        >
          <svg
            class="w-4 h-4 text-gray-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span class="truncate">
            {{ unit.leader
            }}<span
              v-if="unit.leaderPhone"
              class="text-gray-700 text-sm font-medium"
            >
              &middot; {{ unit.leaderPhone }}</span
            >
          </span>
        </div>

        <!-- Vehicle types & total personnel -->
        <div v-if="typeGroups.length || crewTotal" class="flex flex-wrap items-center gap-2">
          <div v-for="g in typeGroups" :key="g.type"
            class="font-bold text-sm bg-white px-2 py-0.5 rounded-lg border border-gray-300 text-gray-900 flex items-center gap-1"
          >
            <img
              src="/fire-truck.svg"
              alt=""
              class="w-7 h-6 object-contain select-none pointer-events-none"
            />
            <span class="uppercase tracking-wide">{{ g.count > 1 ? `${g.count}× ` : '' }}{{ g.type }}</span>
          </div>

          <!-- Total personnel across all vehicles -->
          <div v-if="crewTotal"
            class="font-bold text-sm bg-white px-2 py-0.5 rounded-lg border border-gray-300 text-gray-900 flex items-center gap-1"
          >
            <img
              src="/firefighter-3.svg"
              alt=""
              class="w-7 h-6 object-contain select-none pointer-events-none"
            />
            <span>{{ crewTotal }}</span>
          </div>
        </div>
      </div>

      <!-- Keep timestamp balanced but cleanly formatted -->
      <div
        class="text-sm font-semibold text-gray-700 font-mono tracking-wider tabular-nums pb-0.5 shrink-0"
      >
        {{ timeOnly }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { totalCrew, vehicleTypeGroups } from "../composables/vehicles.js";

const props = defineProps({
  unit: {
    type: Object,
    required: true
  }
});

defineEmits(["edit", "split"]);

const labels = {
  "en-route": "V PRIHODU",
  "on-scene": "NERAZPOREJENI",
  triaged: "V POSREDOVANJU",
  transport: "ODHOD",
  cleared: "DRUGO"
};

const label = computed(() => labels[props.unit.status] || props.unit.status);

const typeGroups = computed(() => vehicleTypeGroups(props.unit));
const crewTotal = computed(() => totalCrew(props.unit));
const hasMultipleVehicles = computed(() => (props.unit.vehicles?.length || 0) > 1);

const timeOnly = computed(() => {
  const d = new Date(props.unit.updatedAt || props.unit.createdAt);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
});
</script>
