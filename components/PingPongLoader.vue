<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

// Utility: join class names conditionally
function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Props
interface Props {
  message?: string;
  duration?: number;
  repeatCount?: number;
}
const props = defineProps<Props>();

// Defaults
const defaultDuration = 60; // ms
const defaultRepeatCount = -1; // infinite repeats

// Animation frames and ball positions
const frames = [
  [7, 0, 8, 6, 13, 20],
  [7, 13, 20, 16, 27, 21],
  [20, 27, 21, 34, 24, 28],
  [21, 34, 28, 41, 32, 35],
  [28, 41, 35, 48, 40, 42],
  [28, 41, 35, 48, 42, 46],
  [28, 41, 35, 48, 42, 38],
  [28, 41, 35, 48, 30, 21],
  [28, 41, 48, 21, 22, 14],
  [28, 41, 21, 14, 16, 27],
  [28, 21, 14, 10, 20, 27],
  [21, 14, 4, 13, 20, 27],
  [21, 14, 12, 6, 13, 20],
  [21, 14, 6, 13, 20, 11],
  [21, 14, 6, 13, 20, 10],
  [6, 13, 20, 9, 7, 21],
];
const ballPositions = [
  14, 14, 14, 27, 34, 34, 34, 34, 34, 34, 34, 28, 28, 28, 28, 14,
];

const dotCount = 49;

const currentFrameIndex = ref(0);
const repeats = ref(0);
const intervalId = ref<number | null>(null);

const dots = computed(() => Array.from({ length: dotCount }, (_, i) => i));

function applyFrameToDots(frameIndex: number) {
  const frame = frames[frameIndex];
  const ball = ballPositions[frameIndex];
  for (let i = 0; i < dotCount; i++) {
    const dot = document.getElementById(`pingpong-dot-${i}`);
    if (!dot) continue;
    dot.classList.remove("active-ball", "active-handle");
    if (i === ball) {
      dot.classList.add("active-ball");
    } else if (frame.includes(i)) {
      dot.classList.add("active-handle");
    }
  }
}

function startAnimation() {
  if (intervalId.value !== null) clearInterval(intervalId.value);

  currentFrameIndex.value = 0;
  repeats.value = 0;

  intervalId.value = window.setInterval(() => {
    applyFrameToDots(currentFrameIndex.value);

    const repeatCountValue = props.repeatCount ?? defaultRepeatCount;

    if (currentFrameIndex.value + 1 >= frames.length) {
      if (repeatCountValue !== -1 && repeats.value + 1 >= repeatCountValue) {
        clearInterval(intervalId.value!);
        intervalId.value = null;
        return;
      }
      repeats.value++;
    }

    currentFrameIndex.value = (currentFrameIndex.value + 1) % frames.length;
  }, props.duration ?? defaultDuration);
}

function stopAnimation() {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
}

onMounted(() => {
  startAnimation();
});

onBeforeUnmount(() => {
  stopAnimation();
});
</script>

<template>
  <div class="pingpong-loader-viewport">
    <div class="pingpong-loader-wrapper" aria-label="Loading" role="status">
      <div class="pingpong-grid" aria-hidden="true">
        <div
          v-for="dot in dots"
          :key="dot"
          :id="`pingpong-dot-${dot}`"
          class="pingpong-dot"
        />
      </div>
      <div class="pingpong-message">{{ props.message || "Loading Form..." }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Full viewport container centers the loader */
.pingpong-loader-viewport {
  position: fixed;
  inset: 0; /* shorthand for top:0, right:0, bottom:0, left:0 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background);
  z-index: 9999;
}

/* Loader main wrapper */
.pingpong-loader-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--lightened-background-adjacent-color);
  border-radius: var(--general-rounding);
  box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.09);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 220px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  outline: none;
}

/* Dot grid */
.pingpong-grid {
  display: grid;
  grid-template-columns: repeat(7, 6px);
  grid-template-rows: repeat(7, 6px);
  gap: 2px;
  width: fit-content;
  height: fit-content;
}

/* Base dot style */
.pingpong-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background-color: var(--background-adjacent-color);
  transition: background-color 0.2s ease;
}

/* Active ball styled with theme color */
.active-ball {
  background-color: var(--theme-color) !important;
}

/* Active handle dots styled with foreground color */
.active-handle {
  background-color: var(--foreground) !important;
}

/* Loading message style */
.pingpong-message {
  margin-top: 26px;
  font-weight: 600;
  font-size: 1.08rem;
  color: var(--foreground);
  user-select: none;
  text-align: center;
}
</style>
