<template>
  <form
    @submit.prevent="handleSubmit"
    autocomplete="on"
    :style="formStyle"
  >
    <!-- Title/Description Card -->
    <div :style="cardStyle">
      <h1 :style="titleStyle" class="font-bold">
        {{ schema.meta.title }}
      </h1>
      <p :style="descStyle">
        {{ schema.meta.description }}
      </p>
      <div v-if="author || fingerprint" style="margin-top: 1rem;">
        <div
          v-if="author"
          style="
            font-size: 16px;
            color: var(--muted-foreground);
            line-height: 1.7;
            margin-bottom: 0.25rem;
            word-break: break-word;
            white-space: normal;
            overflow-wrap: anywhere;
            max-width: 100%;
            cursor: pointer;
          "
          @click="onAuthorClick"
          :class="{ clickable: !!onAuthorClick }"
          :title="author"
        >
          <span style="font-weight: 700;">Author:</span> {{ author }}
        </div>
        <div
          v-if="fingerprint"
          style="
            font-size: 16px;
            color: var(--muted-foreground);
            line-height: 1.7;
            word-break: break-word;
            white-space: normal;
            overflow-wrap: anywhere;
            max-width: 100%;
            cursor: pointer;
            text-decoration-color: var(--muted-foreground);
          "
          @click="onFingerprintClick"
          :class="{ clickable: !!onFingerprintClick }"
          :title="fingerprint"
        >
          <span style="font-weight: 700;">Author fingerprint:</span> {{ fingerprint }}
        </div>
      </div>
    </div>

    <!-- Sections -->
    <div
      v-for="(section, i) in schema.sections"
      :key="i"
      :style="cardStyle"
      class="form-section-card"
    >
      <template v-for="(el, j) in section.elements" :key="el.key ?? j">
        <!-- Text elements -->
        <div
          v-if="el.type === 'text'"
          :style="getTextElementStyle(el.text, j, section.elements)"
          :dir="isRTL(el.text) ? 'rtl' : 'ltr'"
        >
          {{ el.text }}
        </div>

        <!-- Input -->
        <div
          v-else-if="el.type === 'input'"
          :style="{ marginTop: j > 0 ? GAP_BETWEEN_ELEMENTS + 'px' : undefined }"
        >
          <FloatingLabelInput
            :label="el.text"
            :value="form[el.key] || ''"
            @update:value="val => setFormValue(el.key, val)"
            type="text"
            :disabled="false"
            :isRTL="isRTL(el.text)"
            :accentColor="schema.meta.accentColor"
          />
        </div>

        <!-- Textarea -->
        <div
          v-else-if="el.type === 'textarea'"
          :style="{ marginTop: j > 0 ? GAP_BETWEEN_ELEMENTS + 'px' : undefined }"
        >
          <FloatingLabelInput
            :label="el.text"
            :value="form[el.key] || ''"
            @update:value="val => setFormValue(el.key, val)"
            type="textarea"
            textarea
            :disabled="false"
            :isRTL="isRTL(el.text)"
            :accentColor="schema.meta.accentColor"
            :textareaHeight="formatHeight(el.height)"
          />
        </div>

        <!-- Checkboxes -->
        <div
          v-else-if="el.type === 'checkboxes'"
          :style="{ marginTop: j > 0 ? GAP_BETWEEN_ELEMENTS + 'px' : undefined }"
        >
          <div class="form-checkbox-group">
            <label
              v-for="opt in el.options"
              :key="opt.value"
              :style="getCheckboxLabelStyle(opt.text, el, opt.value)"
              :dir="isRTL(opt.text) ? 'rtl' : 'ltr'"
              class="clickable-label"
              tabindex="0"
              @keydown.enter.prevent.stop="toggleCheckbox(el.key, opt.value, el)"
              @keydown.space.prevent.stop="toggleCheckbox(el.key, opt.value, el)"
              :aria-disabled="isInactive(el.key, el, opt.value) ? 'true' : 'false'"
            >
              <template v-if="isRTL(opt.text)">
                <span>{{ opt.text }}</span>
                <div class="control-wrapper">
                  <CustomCheckbox
                    :checked="isChecked(el.key, opt.value)"
                    @update:checked="checked => toggleCheckbox(el.key, opt.value, el, checked)"
                    :accentColor="schema.meta.accentColor"
                    :highlightForeground="schema.meta.highlightForeground"
                    :id="`${el.key}-${opt.value}`"
                    :inactive="isInactive(el.key, el, opt.value)"
                  />
                </div>
              </template>
              <template v-else>
                <div class="control-wrapper">
                  <CustomCheckbox
                    :checked="isChecked(el.key, opt.value)"
                    @update:checked="checked => toggleCheckbox(el.key, opt.value, el, checked)"
                    :accentColor="schema.meta.accentColor"
                    :highlightForeground="schema.meta.highlightForeground"
                    :id="`${el.key}-${opt.value}`"
                    :inactive="isInactive(el.key, el, opt.value)"
                  />
                </div>
                <span>{{ opt.text }}</span>
              </template>

              <!-- Overlay covering entire label -->
              <span
                class="click-overlay"
                :class="{ 'disabled-overlay': isInactive(el.key, el, opt.value) }"
                @click.stop.prevent="handleOverlayClick(el.key, opt.value, el)"
              />
            </label>
          </div>
        </div>


        <!-- Radio buttons -->
        <div
          v-else-if="el.type === 'radio'"
          :style="{ marginTop: j > 0 ? GAP_BETWEEN_ELEMENTS + 'px' : undefined }"
        >
          <div class="form-radio-group">
            <label
              v-for="opt in el.options"
              :key="opt.value"
              :style="getRadioLabelStyle(opt.text)"
              :dir="isRTL(opt.text) ? 'rtl' : 'ltr'"
              class="clickable-label"
              tabindex="0"
              @keydown.enter.prevent.stop="toggleRadio(el.key, opt.value, el)"
              @keydown.space.prevent.stop="toggleRadio(el.key, opt.value, el)"
            >
              <template v-if="isRTL(opt.text)">
                <span>{{ opt.text }}</span>
                <div class="control-wrapper">
                  <CustomRadio
                    :checked="form[el.key] === opt.value"
                    @update:checked="checked => toggleRadio(el.key, opt.value, el, checked)"
                    :accentColor="schema.meta.accentColor"
                    :highlightForeground="schema.meta.highlightForeground"
                    :allowUnselect="true"
                    :id="`${el.key}-${opt.value}`"
                    :disabled="false"
                  />
                </div>
              </template>
              <template v-else>
                <div class="control-wrapper">
                  <CustomRadio
                    :checked="form[el.key] === opt.value"
                    @update:checked="checked => toggleRadio(el.key, opt.value, el, checked)"
                    :accentColor="schema.meta.accentColor"
                    :highlightForeground="schema.meta.highlightForeground"
                    :allowUnselect="true"
                    :id="`${el.key}-${opt.value}`"
                    :disabled="false"
                  />
                  <!-- Remove click-overlay -->
                </div>
                <span>{{ opt.text }}</span>
              </template>
            </label>
          </div>
        </div>
      </template>
    </div>

    <!-- Submit Button -->
    <div :style="submitWrapperStyle">
      <ChronicleButton
        text="Submit"
        type="submit"
        width="100%"
        :hoverColor="schema.meta.accentColor || 'var(--theme-color)'"
        :hoverForeground="schema.meta.highlightForeground || 'var(--foreground)'"
        borderRadius="var(--general-rounding)"
      />
    </div>

    <!-- Footer -->
    <div :style="footerStyle">
      <div style="margin-bottom: 0.5rem;">
        This content was neither created nor endorsed by&nbsp;
        <a
          href="https://blueberry-loom.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Blueberry Loom
        </a>
      </div>
      <div style="margin-bottom: 0.5rem;">
        By using the Blueberry Loom you're accepting the&nbsp;
        <a
          href="https://blueberry-loom.netlify.app/terms-of-use/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Terms of Use
        </a>
      </div>
      <div style="margin-bottom: 0.5rem;">
        The source code of this web app is available on&nbsp;
        <a
          href="https://github.com/Northstrix/blueberry-loom"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          GitHub
        </a>
      </div>
      <div style="margin-bottom: 1.5rem;">
        Made by&nbsp;
        <a
          href="https://maxim-bortnikov.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Maxim Bortnikov
        </a>
        &nbsp;using&nbsp;
        <a
          href="https://nextjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Next.js
        </a>,
        <a
          href="https://nuxt.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Nuxt
        </a>,
        and&nbsp;
        <a
          href="https://www.perplexity.ai/"
          target="_blank"
          rel="noopener noreferrer"
          class="theme-link-footer"
        >
          Perplexity
        </a>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { reactive, ref, computed, onMounted } from "vue";
import FloatingLabelInput from "~/components/FloatingLabelInput.vue";
import CustomCheckbox from "~/components/CustomCheckbox.vue";
import CustomRadio from "~/components/CustomRadio.vue";
import ChronicleButton from "~/components/ChronicleButton.vue";

interface FormRendererProps {
  schema: any;
  onSubmit: (encoded: string) => void;
  cardPadding?: string;
  cardGap?: string;
  sectionTextSize?: string;
  elementTextSize?: string;
  author?: string;
  fingerprint?: string;
  onAuthorClick?: () => void;
  onFingerprintClick?: () => void;
}

const props = defineProps<FormRendererProps>();

const {
  schema,
  onSubmit,
  cardPadding = "2.25rem 2.2rem",
  cardGap = "2rem",
  sectionTextSize = "16px",
  elementTextSize = "15px",
  author,
  fingerprint,
  onAuthorClick,
  onFingerprintClick,
} = props;

const emit = defineEmits<{
  (e: "submit", encodedResult: string): void;
}>();

const GAP_BETWEEN_ELEMENTS = 22;
const GAP_AFTER_TOP_TEXT = 29;
const GAP_AFTER_TOP_TEXT_REDUCED = GAP_AFTER_TOP_TEXT - 20; // 9px

const form = reactive<Record<string, any>>({});

const fontSize = ref("14px");
function getResponsiveFontSize() {
  const w = window.innerWidth;
  if (w > 800) return "14px";
  if (w > 700) return "13.6px";
  if (w > 600) return "13px";
  if (w > 500) return "12px";
  if (w > 400) return "11.2px";
  if (w > 380) return "10.4px";
  if (w > 360) return "10.2px";
  if (w > 340) return "10px";
  return "7.5px";
}
onMounted(() => {
  function updateFont() {
    fontSize.value = getResponsiveFontSize();
  }
  updateFont();
  window.addEventListener("resize", updateFont);
});

const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
function isRTL(text?: string): boolean {
  return !!text && RTL_REGEX.test(text);
}

const titleRTL = computed(() => isRTL(schema?.meta?.title));
const descRTL = computed(() => isRTL(schema?.meta?.description));

function setFormValue(key: string, value: any) {
  form[key] = value;
}

function isChecked(key: string, value: string): boolean {
  return (form[key] || []).includes(value);
}

function toggleCheckbox(key: string, value: string, element: any, checked?: boolean) {
  if (!form[key]) form[key] = [];
  const vals = [...form[key]];
  const hasValue = vals.includes(value);
  const allowMultiple = element.allowMultiple ?? false;
  const maxSelected = element.maxSelected || 0;
  const atMax = allowMultiple && maxSelected > 0 && vals.length >= maxSelected;

  if (checked !== undefined) {
    if (checked && !hasValue && (!atMax || vals.length < maxSelected)) {
      vals.push(value);
    } else if (!checked && hasValue) {
      const idx = vals.indexOf(value);
      if (idx !== -1) vals.splice(idx, 1);
    }
  } else {
    if (hasValue) {
      const idx = vals.indexOf(value);
      if (idx !== -1) vals.splice(idx, 1);
    } else if (!atMax || vals.length < maxSelected) {
      vals.push(value);
    }
  }
  form[key] = vals;
}

// Returns true only if checkbox unchecked AND limit reached:
function isInactive(key: string, element: any, value: string): boolean {
  const vals = form[key] || [];
  if (!element.allowMultiple || element.maxSelected <= 0) return false;
  if (vals.includes(value)) return false;
  return vals.length >= element.maxSelected;
}

// For overlay cursor and pointer-events styling:
function isOverlayDisabled(key: string, element: any, value: string): boolean {
  const checked = (form[key] || []).includes(value);
  return !checked && isInactive(key, element, value);
}

function overlayStyle(key: string, element: any, value: string): CSSProperties {
  if (isOverlayDisabled(key, element, value)) {
    return {
      pointerEvents: "auto", // allow overlay to capture events, but prevent toggle via click handler
      cursor: "not-allowed",
    };
  }
  return {
    pointerEvents: "auto",
    cursor: "pointer",
  };
}

function handleOverlayClick(key: string, value: string, element: any) {
  if (isInactive(key, element, value)) return; // prevent clicks on inactive checkboxes
  toggleCheckbox(key, value, element);
}

function toggleRadio(key: string, value: string, element: any, checked?: boolean) {
  if (checked !== undefined) {
    if (checked) {
      form[key] = value;
    } else {
      form[key] = undefined;
    }
  } else {
    if (form[key] === value && (element.allowUnselect ?? true)) {
      form[key] = undefined;
    } else {
      form[key] = value;
    }
  }
}

function formatHeight(h: any) {
  if (h === undefined || h === null) return undefined;
  return typeof h === "number" ? `${h}px` : h;
}

// Encoding utility
const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));

function handleSubmit() {
  const result = schema.sections
    .map(
      (section) =>
        "[" +
        section.elements
          .map((el) => {
            if (el.type === "text") return "";
            if (el.type === "input" || el.type === "textarea") {
              const val = form[el.key];
              return "[" + encode(el.text) + ":" + (val && val !== "" ? encode(val) : "n") + "]";
            }
            if (el.type === "checkboxes") {
              const vals: string[] = form[el.key] || [];
              return (
                "[" +
                encode(el.key) +
                ":" +
                (vals.length ? vals.map((v) => encode(v)).join(",") : "n") +
                "]"
              );
            }
            if (el.type === "radio") {
              const val: string | undefined = form[el.key];
              return "[" + encode(el.key) + ":" + (val ? encode(val) : "n") + "]";
            }
            return "";
          })
          .join("") +
        "]"
    )
    .join("");

  emit("submit", result);
}

function getTextElementStyle(text: string, index: number, elements: any[]): CSSProperties {
  const isSingleTextSection = elements.length === 1 && elements[0].type === "text";
  const textRTL = isRTL(text);
  const isFirst = index === 0;
  const next = elements[index + 1];
  const prev = elements[index - 1];

  const isNextNonText = next !== undefined && next.type !== "text";
  const isPrevText = prev?.type === "text";
  const isPrevNonText = prev !== undefined && prev.type !== "text";

  const style: CSSProperties = {
    color: "var(--foreground)",
    fontSize: sectionTextSize,
    textAlign: textRTL ? "right" : "left",
    direction: textRTL ? ("rtl" as CSSProperties["direction"]) : ("ltr" as CSSProperties["direction"]),
  };

  if (isSingleTextSection) {
    style.fontWeight = "600";
    style.margin = "0";
    return style;
  }

  if (isFirst) {
    style.fontWeight = "600";
    style.marginTop = "0";
    style.marginBottom = isNextNonText ? `${GAP_AFTER_TOP_TEXT_REDUCED}px` : `${GAP_BETWEEN_ELEMENTS}px`;
    return style;
  }

  if (isPrevText || isPrevNonText) {
    style.fontWeight = "400";
    style.marginTop = `${GAP_BETWEEN_ELEMENTS}px`;
    style.marginBottom = "0";
    return style;
  }

  style.fontWeight = "400";
  style.margin = "0";
  return style;
}

// Uses isInactive for label styling (opacity and cursor)
function getCheckboxLabelStyle(text: string, el: any, value: string): CSSProperties {
  const textRTL = isRTL(text);
  const inactive = isInactive(el.key, el, value);
  return {
    fontSize: elementTextSize,
    userSelect: "none",
    opacity: inactive ? 0.6 : 1,
    cursor: inactive ? "not-allowed" : "pointer",
    display: "flex",
    flexDirection: textRTL ? "row-reverse" : "row",
    textAlign: textRTL ? ("right" as CSSProperties["textAlign"]) : ("left" as CSSProperties["textAlign"]),
    width: "100%",
    justifyContent: textRTL ? "flex-end" : "flex-start",
    gap: "8px",
    alignItems: "center",
  };
}

function getRadioLabelStyle(text: string): CSSProperties {
  const textRTL = isRTL(text);
  return {
    fontSize: elementTextSize,
    userSelect: "none",
    display: "flex",
    flexDirection: textRTL ? "row-reverse" : "row",
    textAlign: textRTL ? ("right" as CSSProperties["textAlign"]) : ("left" as CSSProperties["textAlign"]),
    width: "100%",
    justifyContent: textRTL ? "flex-end" : "flex-start",
    gap: "8px",
    cursor: "pointer",
    alignItems: "center",
  };
}

const formStyle: CSSProperties = {
  width: "100%",
  maxHeight: "unset",
  background: "none",
  border: "none",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  gap: cardGap,
  alignItems: "center",
};

const cardStyle: CSSProperties = {
  width: "100%",
  background: "var(--card-background)",
  borderRadius: "var(--general-rounding)",
  border: "1px solid var(--background-adjacent-color)",
  padding: cardPadding,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  transition: "border-color 0.3s, background 0.3s, color 0.3s",
};

const titleStyle = computed<CSSProperties>(() => ({
  fontSize: "2rem",
  color: "var(--foreground)",
  textAlign: titleRTL.value ? "right" : "left",
  direction: titleRTL.value ? ("rtl" as CSSProperties["direction"]) : ("ltr" as CSSProperties["direction"]),
  letterSpacing: "-0.01em",
  margin: 0,
  marginBottom: "0.5rem",
}));

const descStyle = computed<CSSProperties>(() => ({
  fontSize: "16px",
  color: "var(--muted-foreground)",
  lineHeight: 1.5,
  textAlign: descRTL.value ? "right" : "left",
  direction: descRTL.value ? ("rtl" as CSSProperties["direction"]) : ("ltr" as CSSProperties["direction"]),
  margin: 0,
}));

const submitWrapperStyle: CSSProperties = {
  width: "100%",
  margin: 0,
  display: "flex",
  flexDirection: "column",
};

const footerStyle = computed<CSSProperties>(() => ({
  width: "100%",
  marginBottom: cardGap,
  textAlign: "center",
  fontSize: fontSize.value,
  color: "var(--muted-foreground)",
}));
</script>

<style scoped>
.form-section-card {
  margin-bottom: 0; /* cards spaced by form gap */
}

.form-checkbox-group,
.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-link-footer {
  color: var(--theme-color) !important;
  text-decoration: underline;
  cursor: pointer;
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.clickable-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  position: relative;
  outline-offset: 2px; /* enables keyboard focus */
}

.clickable-label:focus-visible {
  outline: 2px solid var(--theme-color);
  outline-offset: 4px;
}

.control-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clickable-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  position: relative; /* Needed so overlay covers label */
  outline-offset: 2px; /* enables keyboard focus */
}

/* Overlay covers the entire label */
.click-overlay {
  position: absolute;
  top: 0; bottom: 0;
  left: 0; right: 0;
  background: transparent;
  z-index: 10;
  border-radius: inherit;
}

/* When disabled, pointer events active but cursor shows not-allowed */
.disabled-overlay {
  cursor: not-allowed !important;
  pointer-events: auto !important;
}
</style>
