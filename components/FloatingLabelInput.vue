<template>
  <div
    :class="[
      'mobile-form-group',
      rtlInput ? 'rtl' : '',
      focused ? 'active' : '',
      hasValue ? 'has-value' : '',
      textarea ? 'textarea' : ''
    ]"
    :style="componentStyle"
  >
    <textarea
      v-if="textarea"
      class="mobile-form-input"
      :required="required"
      v-model="internalValue"
      @focus="handleFocus"
      @blur="handleBlur"
      :autocomplete="autoComplete"
      :disabled="disabled"
      :dir="rtlInput ? 'rtl' : 'ltr'"
      spellcheck="false"
      :style="{ height: textareaHeight || '152px' }"
    />
    <input
      v-else
      class="mobile-form-input"
      :type="type"
      :required="required"
      v-model="internalValue"
      @focus="handleFocus"
      @blur="handleBlur"
      :autocomplete="autoComplete"
      :disabled="disabled"
      :dir="rtlInput ? 'rtl' : 'ltr'"
      spellcheck="false"
    />
    <label
      :class="['mobile-form-label', textarea ? 'label-textarea' : '']"
      :dir="labelDir"
    >
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineProps, defineEmits } from "vue";

interface Props {
  label: string;
  value: string | null | undefined;
  onValueChange?: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  textarea?: boolean;
  isRTL?: boolean;
  accentColor?: string;
  textareaHeight?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "update:value", val: string): void }>();

function detectRTL(text: string) {
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}

function detectLabelDir(text: string): "rtl" | "ltr" {
  return detectRTL(text) ? "rtl" : "ltr";
}

const {
  label,
  value,
  type = "text",
  autoComplete = "off",
  required = false,
  disabled = false,
  textarea = false,
  isRTL,
  accentColor,
  textareaHeight,
  onValueChange,
} = props;

// Ensure internalValue is always string to avoid undefined issues
const internalValue = ref(value ?? "");
const focused = ref(false);
const rtlInput = ref(isRTL ?? false);

watch(
  () => value,
  (newVal) => {
    if (typeof newVal === "string") {
      internalValue.value = newVal;
      rtlInput.value = newVal ? detectRTL(newVal) : isRTL ?? false;
    } else {
      internalValue.value = "";
      rtlInput.value = isRTL ?? false;
    }
  },
  { immediate: true }
);

watch(
  () => label,
  () => {
    if (!internalValue.value) rtlInput.value = isRTL ?? false;
  }
);

const hasValue = computed(() => internalValue.value.length > 0);
const labelDir = computed(() => detectLabelDir(label));

function handleFocus() {
  focused.value = true;
}
function handleBlur() {
  focused.value = false;
}

watch(internalValue, (newVal) => {
  emit("update:value", newVal);
  onValueChange?.(newVal);
});

const componentStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (accentColor) styles["--accent-color"] = accentColor;
  if (textarea && textareaHeight)
    styles["--floating-input-layout-text-area-height"] = textareaHeight;
  return styles;
});
</script>

<style scoped>
/* [Use your existing styles here; for brevity, omitted in this snippet] */
.mobile-form-group {
  position: relative;
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 22px;
}
.mobile-form-group:last-child {
  margin-bottom: 0;
}
.mobile-form-input {
  width: 100%;
  height: 49px;
  padding: 17px;
  font-size: 1.025rem;
  font-weight: 400;
  color: var(--foreground);
  background: var(--mobile-form-input-bg, transparent);
  border: 1.5px solid var(--input-outline);
  border-radius: var(--general-rounding);
  outline: none;
  box-sizing: border-box;
  text-align: left;
  transition: border-color 0.3s, color 0.3s, background 0.3s;
  resize: none;
  line-height: 1.4;
}
.mobile-form-group.rtl .mobile-form-input {
  direction: rtl;
  text-align: right;
}
.mobile-form-group.textarea .mobile-form-input {
  height: var(--floating-input-layout-text-area-height, 152px);
  overflow-y: auto;
}
.mobile-form-label {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  font-size: 1.025rem;
  font-weight: 400;
  pointer-events: none;
  background: var(--project-inquiry-mobile-bg, var(--card-background));
  padding: 0 7px;
  transition: color 0.3s, background 0.3s, font-size 0.3s, top 0.3s,
    left 0.3s, right 0.3s, transform 0.3s;
  z-index: 2;
  max-width: calc(100% - 26px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mobile-form-group.rtl .mobile-form-label {
  right: 12px;
  left: auto;
  text-align: right;
}
.mobile-form-group:not(.active):not(.has-value) .mobile-form-label {
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.025rem;
  color: var(--muted-foreground);
  background: var(--project-inquiry-mobile-bg, var(--card-background));
  padding: 0 7px;
}
.mobile-form-group.active .mobile-form-label,
.mobile-form-group .mobile-form-input:focus + .mobile-form-label {
  top: 0;
  left: 12px;
  right: auto;
  font-size: 12px;
  color: var(--accent-color, var(--theme-color));
  background: var(--project-inquiry-mobile-bg, var(--card-background));
  padding: 0 6px;
  z-index: 2;
}
.mobile-form-group.rtl.active .mobile-form-label,
.mobile-form-group.rtl .mobile-form-input:focus + .mobile-form-label {
  right: 12px;
  left: auto;
}
.mobile-form-group.has-value:not(.active) .mobile-form-label {
  top: 0;
  left: 12px;
  right: auto;
  font-size: 12px;
  color: var(--muted-foreground);
  background: var(--project-inquiry-mobile-bg, var(--card-background));
  padding: 0 6px;
  z-index: 2;
}
.mobile-form-group.rtl.has-value:not(.active) .mobile-form-label {
  right: 12px;
  left: auto;
}
.mobile-form-input {
  border: 1.5px solid var(--input-outline);
}
.mobile-form-input:focus {
  border: 1.5px solid var(--foreground);
}
.mobile-form-group.has-value:not(.active) .mobile-form-input {
  border: 1.5px solid var(--input-outline);
}
.mobile-form-input:disabled {
  opacity: 0.5;
  pointer-events: none;
}
.mobile-form-group.textarea .mobile-form-label {
  left: 12px;
  right: auto;
  padding: 0 7px;
}
.mobile-form-group.textarea.rtl .mobile-form-label {
  right: 12px;
  left: auto;
}
.mobile-form-group.textarea:not(.active):not(.has-value) .mobile-form-label {
  top: 12px;
  left: 12px;
  right: auto;
  transform: none;
  font-size: 1.025rem;
  color: var(--muted-foreground);
  background: var(--project-inquiry-mobile-bg, var(--card-background));
  padding: 0 7px;
  text-align: left;
}
.mobile-form-group.textarea:not(.active):not(.has-value).rtl .mobile-form-label {
  right: 12px;
  left: auto;
  text-align: right;
}
</style>
