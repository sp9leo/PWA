<template>
  <div
    class="group card-hover !p-3 touch-manipulation cursor-grab active:cursor-grabbing relative transition-all duration-200"
    :data-id="unit.id"
  >
    <!-- Top Row: Unit Name & Status Badge / Contextual Controls -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="font-semibold text-sm text-white truncate">
          {{ unit.unit }}
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 min-h-[28px]">
        <!-- Formatted Pill Status Badge -->
        <span
          class="badge text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/10"
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
            class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors text-xs shrink-0"
          >
            &#9998;
          </button>
          <span
            title="Drag to reposition"
            class="text-gray-400 text-xs select-none touch-none px-1 cursor-grab active:cursor-grabbing flex items-center justify-center h-7"
          >
            &#9776;
          </span>
        </div>
      </div>
    </div>

    <!-- Middle Section: Location & Dispatch Notes -->
    <div class="text-sm text-gray-200 mt-1.5 font-medium truncate">
      {{ unit.location }}
    </div>

    <div
      v-if="unit.notes"
      class="text-xs text-gray-300 bg-white/5 rounded p-1.5 mt-2 border border-white/5 line-clamp-2"
    >
      {{ unit.notes }}
    </div>

    <!-- Bottom Row: Upgraded Metadata (Larger Size) & Timestamp -->
    <div
      class="flex justify-between items-end mt-3 pt-2.5 border-t border-white/5"
    >
      <!-- Bumped from text-[11px] to text-sm for clearer emphasis on real-time data -->
      <div class="text-sm text-gray-300 space-y-1 font-normal">
        <!-- Leader Info -->
        <div
          v-if="unit.leader"
          class="text-gray-200 font-medium flex items-center gap-1.5"
        >
          <svg
            class="w-4 h-4 text-gray-400"
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
          <span>
            {{ unit.leader
            }}<span
              v-if="unit.leaderPhone"
              class="text-gray-400 text-xs font-normal"
            >
              &middot; {{ unit.leaderPhone }}</span
            >
          </span>
        </div>

        <!-- Unit Type with SVG Emergency Vehicle Icon -->
        <div v-if="unit.type" class="flex items-center gap-2 text-gray-300">
          
          <div
            class="font-semibold text-l bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider text-white"
          >
          <img
              src="/fire-truck.svg"
              alt=""
              class="w-7 h-6 object-contain opacity-100 select-none pointer-events-none brightness-100"
            />
            {{ unit.type }}
          </div>

          <!-- Personnel Count -->
          <div v-if="unit.personnelCount" class="font-semibold text-l bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider text-white">
            <img
              src="/firefighter-3.svg"
              alt=""
              class="w-7 h-6 object-contain opacity-100 select-none pointer-events-none brightness-100"
            />
            
            {{ unit.personnelCount }}
          </div>
        </div>
      </div>

      <!-- Keep timestamp balanced but cleanly formatted -->
      <div
        class="text-xs text-gray-400 font-mono tracking-wider tabular-nums pb-0.5"
      >
        {{ timeOnly }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  unit: {
    type: Object,
    required: true
  }
});

defineEmits(["edit"]);

const labels = {
  "en-route": "En Route",
  "on-scene": "On Scene",
  triaged: "Triaged",
  transport: "Transport",
  cleared: "Cleared"
};

const label = computed(() => labels[props.unit.status] || props.unit.status);

const timeOnly = computed(() => {
  const d = new Date(props.unit.updatedAt || props.unit.createdAt);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
});
</script>
