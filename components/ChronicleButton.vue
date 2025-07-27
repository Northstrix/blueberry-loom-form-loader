<template>
  <button
    class="chronicleButton"
    :class="{ outlined }"
    type="button"
    :style="buttonStyle"
    @click="onClick"
  >
    <span>
      <em :style="{ fontSize, lineHeight }">{{ text }}</em>
    </span>
    <span>
      <em :style="{ fontSize, lineHeight }">{{ text }}</em>
    </span>
  </button>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue"

interface ChronicleButtonProps {
  text: string
  onClick?: () => void
  hoverColor?: string
  width?: string
  outlined?: boolean
  outlinePaddingAdjustment?: string
  borderRadius?: string
  outlinedButtonBackgroundOnHover?: string
  customBackground?: string
  customForeground?: string
  hoverForeground?: string
  fontSize?: string
  lineHeight?: string
}

const props = defineProps<ChronicleButtonProps>()

const {
  text,
  onClick,
  hoverColor = "var(--theme-color)",
  width = "160px",
  outlined = false,
  outlinePaddingAdjustment = "2px",
  borderRadius = "var(--general-rounding, 8px)",
  outlinedButtonBackgroundOnHover = "transparent",
  customBackground = "var(--foreground)",
  customForeground = "var(--background)",
  hoverForeground = "var(--foreground)",
  fontSize = "1.025rem",
  lineHeight = "1",
} = props

const buttonStyle = computed(() => ({
  "--chronicle-button-background": customBackground,
  "--chronicle-button-foreground": customForeground,
  "--chronicle-button-hover-background": hoverColor,
  "--chronicle-button-hover-foreground": hoverForeground,
  "--outline-padding-adjustment": outlinePaddingAdjustment,
  "--chronicle-button-border-radius": borderRadius,
  "--outlined-button-background-on-hover": outlinedButtonBackgroundOnHover,
  width,
  borderRadius,
}))
</script>

<style scoped>
.chronicleButton {
  --chronicle-button-default-hover-color: var(--theme-color);
  --chronicle-button-border-radius: var(--general-rounding, 8px);
  border-radius: var(--chronicle-button-border-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  line-height: 1;
  padding: 1rem 1.232rem;
  cursor: pointer;
  border: none;
  font-weight: 700;
  background: var(--chronicle-button-background);
  color: var(--chronicle-button-foreground);
  transition: background 0.4s linear, color 0.4s linear;
  will-change: background, color;
  position: relative;
}
.chronicleButton:hover {
  background: var(--chronicle-button-hover-background);
  color: var(--chronicle-button-hover-foreground);
}
.chronicleButton span {
  position: relative;
  display: block;
  perspective: 108px;
}
.chronicleButton span:nth-of-type(2) {
  position: absolute;
}
.chronicleButton em {
  font-style: normal;
  display: inline-block;
  font-size: 1.025rem;
  line-height: 1;
  color: inherit;
  will-change: transform, opacity, color, transition;
  transition:
    transform 0.55s cubic-bezier(0.645, 0.045, 0.355, 1),
    opacity 0.35s linear 0.2s,
    color 0.4s linear;
}
.chronicleButton span:nth-of-type(1) em {
  transform-origin: top;
}
.chronicleButton span:nth-of-type(2) em {
  opacity: 0;
  transform: rotateX(-90deg) scaleX(0.9) translate3d(0, 10px, 0);
  transform-origin: bottom;
}
.chronicleButton:hover span:nth-of-type(1) em {
  opacity: 0;
  transform: rotateX(90deg) scaleX(0.9) translate3d(0, -10px, 0);
}
.chronicleButton:hover span:nth-of-type(2) em {
  opacity: 1;
  transform: rotateX(0deg) scaleX(1) translateZ(0);
  transition:
    transform 0.75s cubic-bezier(0.645, 0.045, 0.355, 1),
    opacity 0.35s linear 0.3s,
    color 0.4s linear;
}
.chronicleButton.outlined {
  background: transparent;
  border: 1px solid var(--chronicle-button-background);
  padding: calc(1rem - var(--outline-padding-adjustment)) 0;
  color: var(--chronicle-button-background);
  transition:
    border 0.4s linear,
    color 0.4s linear,
    background-color 0.4s linear;
  will-change: border, color;
}
.chronicleButton.outlined:hover {
  background: var(--outlined-button-background-on-hover, transparent);
  border-color: var(--chronicle-button-hover-background);
  color: var(--chronicle-button-hover-background);
}
.chronicleButton.outlined span:nth-of-type(1) em,
.chronicleButton.outlined span:nth-of-type(2) em {
  transition: color 0.4s linear;
  transform: translateY(1px);
}
.chronicleButton.outlined:hover span:nth-of-type(1) em,
.chronicleButton.outlined:hover span:nth-of-type(2) em {
  color: var(--chronicle-button-hover-background);
}
</style>
