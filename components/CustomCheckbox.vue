<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked.toString()"
    :aria-disabled="disabled.toString()"
    :tabindex="0"
    :id="id"
    :disabled="disabled"
    @click="handleClick"
    class="custom-checkbox"
    :style="btnStyle"
  >
    <svg
      v-if="checked"
      key="checkmark"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      :stroke="highlightForeground"
      stroke-width="3"
      fill="none"
      class="checkmark"
      ref="checkmarkRef"
      aria-hidden="true"
      style="display: block; pointer-events: none;"
    >
      <path
        ref="pathRef"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 13l4 4L19 7"
        class="checkmark-path"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";

const props = defineProps<{
  checked: boolean;
  accentColor?: string;
  highlightForeground?: string;
  id?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:checked", checked: boolean): void;
}>();

const btnStyle = computed(() => ({
  width: "24px",
  height: "24px",
  background: props.disabled
    ? "var(--card-background)"
    : props.checked
    ? props.accentColor || "var(--theme-color)"
    : "var(--background-adjacent-color)",
  border: "1.5px solid var(--lightened-background-adjacent-color)",
  transition: "background 0.2s, border 0.2s",
  cursor: props.disabled ? "not-allowed" : "pointer",
  position: "relative",
  borderRadius: "6px",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const highlightForeground = computed(
  () => props.highlightForeground || "var(--foreground)"
);

const pathRef = ref<SVGPathElement | null>(null);
const checkmarkRef = ref<SVGSVGElement | null>(null);

function handleClick(e: Event) {
  e.preventDefault();
  if (props.disabled) return;
  emit("update:checked", !props.checked);
}

watch(
  () => props.checked,
  async (newChecked) => {
    if (newChecked) {
      await nextTick();

      if (!pathRef.value) return;
      const length = pathRef.value.getTotalLength();

      pathRef.value.style.transition = "none";
      pathRef.value.style.strokeDasharray = String(length);
      pathRef.value.style.strokeDashoffset = String(length);

      // Trigger a layout so styles are flushed
      void pathRef.value.getBoundingClientRect();

      // Animate to draw the path
      pathRef.value.style.transition =
        "stroke-dashoffset 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s";
      pathRef.value.style.strokeDashoffset = "0";
      pathRef.value.style.opacity = "1";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.custom-checkbox {
  outline: none;
  user-select: none;
}

/* Initial hidden and animated "drawing" setup for path */
.checkmark-path {
  stroke-dasharray: 0;
  stroke-dashoffset: 0;
  opacity: 0;
}
</style>
