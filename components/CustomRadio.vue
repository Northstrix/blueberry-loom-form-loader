<template>
  <button
    type="button"
    role="radio"
    :aria-checked="checked.toString()"
    :aria-disabled="disabled.toString()"
    :tabindex="0"
    :id="id"
    class="custom-radio"
    :style="btnStyle"
    @click="handleClick"
    :disabled="disabled"
  >
    <transition name="radio-dot">
      <div
        v-if="checked"
        class="radio-dot"
        :style="{ background: highlightForeground }"
      ></div>
    </transition>
    <!-- Remove overlay click—just have it transparent for visuals -->
    <span
      aria-hidden="true"
      class="radio-overlay"
      :style="{ cursor: disabled ? 'not-allowed' : 'pointer' }"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  checked: boolean;
  accentColor?: string;
  highlightForeground?: string;
  allowUnselect?: boolean;
  disabled?: boolean;
  id?: string;
}>();

const emit = defineEmits<{
  (event: "update:checked", checked: boolean): void;
}>();

const btnStyle = computed(() => ({
  width: "24px",
  height: "24px",
  background: props.checked
    ? props.accentColor || "var(--theme-color)"
    : "var(--background-adjacent-color)",
  border: "1.5px solid var(--lightened-background-adjacent-color)",
  transition: "background 0.2s, border 0.2s",
  cursor: props.disabled ? "not-allowed" : "pointer",
  position: "relative",
  borderRadius: "50%",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const highlightForeground = computed(
  () => props.highlightForeground || "var(--foreground)"
);

function handleClick(e: Event) {
  e.preventDefault();
  if (props.disabled) return;
  if (props.allowUnselect) {
    emit("update:checked", !props.checked);
  } else {
    if (!props.checked) {
      // only select if not already selected
      emit("update:checked", true);
    }
  }
}
</script>

<style scoped>
.custom-radio {
  outline: none;
  user-select: none;
  position: relative;
}
.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: background 0.2s, transform 0.17s;
  margin: auto;
}
.radio-dot-enter-active,
.radio-dot-leave-active {
  transition: opacity 0.21s, transform 0.2s;
}
.radio-dot-enter-from,
.radio-dot-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
.radio-dot-enter-to,
.radio-dot-leave-from {
  opacity: 1;
  transform: scale(1);
}
.radio-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none; /* allow the button click to happen and no pointer interference here */
}
</style>
