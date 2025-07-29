<template>
  <div class="page-container">
    <PingPongLoader v-if="loading" />

    <div v-else>
      <template v-if="!submissionSuccess">
        <div v-if="schema" :key="formKey" :style="widthLimiterStyle">
          <FormRenderer
            :schema="schema"
            :author="author ?? undefined"
            :fingerprint="publicKeyFingerprint ?? undefined"
            @submit="submitResponse"
            :cardPadding="'2.25rem 2.2rem'"
            :cardGap="'2rem'"
            :sectionTextSize="'16px'"
            :elementTextSize="'15px'"
          />
        </div>
      </template>

      <template v-else>
        <div
          class="submission-success-container"
          :dir="inscriptionDir"
          :style="{
            maxWidth: maxWidth + 'px',
            margin: '40px auto',
            padding: '2.25rem 2.2rem',
            background: 'var(--card-background)',
            borderRadius: 'var(--general-rounding)',
            border: '1px solid var(--background-adjacent-color)',
            boxSizing: 'border-box',
            textAlign: inscriptionAlign,
            color: 'var(--foreground)',
            userSelect: 'none'
          }"
        >
          <h1
            :style="{
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '1.125rem',
              color: 'var(--foreground)',
              textAlign: inscriptionAlign,
              direction: inscriptionDir,
            }"
          >
            {{ successNotification }}
          </h1>

          <div
            tabindex="0"
            role="button"
            @click="handleNewSubmission"
            @keydown.enter.prevent="handleNewSubmission"
            @keydown.space.prevent="handleNewSubmission"
            :style="{
              fontSize: '1.1rem',
              color: 'var(--theme-color)',
              textDecoration: 'underline',
              cursor: 'pointer',
              userSelect: 'none',
              outline: 'none',
              display: 'inline-block',
              width: '100%',
              marginBottom: '0.5rem',
              textAlign: inscriptionAlign,
              direction: inscriptionDir,
            }"
          >
            {{ inscriptions["submit_another_response"] }}
          </div>

          <a 
            href="https://blueberry-loom.netlify.app/" 
            :dir="inscriptionDir"
            :style="{
              display: 'inline-block',
              fontSize: '1.1rem',
              color: 'var(--theme-color)',
              textDecoration: 'underline',
              cursor: 'pointer',
              userSelect: 'none',
              outline: 'none',
              marginBottom: '0.5rem',
              textAlign: inscriptionAlign,
              direction: inscriptionDir,
            }"
          >
            Go to Homepage
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import { useRoute } from "vue-router";
import PingPongLoader from "@/components/PingPongLoader.vue";
import FormRenderer from "@/components/FormRenderer.vue";
import { useFormTemplateData } from "~/hooks/useFormTemplateData";
import { showClosableErrorModal, showProcessingModal } from "@/components/Swal2Modals";
import Swal from "sweetalert2";
import {
  doc,
  updateDoc,
  increment,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "~/plugins/firebase.client";
import { padToMultipleAsUint8Array } from "@/hooks/usePadStringToMultiple";
import { silentlyEncryptDataWithTwoCiphersCBCnoPadding } from "../../../utils/twoCiphersSilentMode";
import { MlKem1024 } from "mlkem";

// Inscriptions (localized strings)
const inscriptions = {
  "invalid-key": "Decryption key is missing.",
  "missing-email": "Publisher email is missing.",
  "missing-id": "Form ID is missing.",
  "unknown-error": "Something went wrong",
  "submitting-your-response": "Submitting your response",
  "please_wait": "Please wait for a while...",
  "form_submitted_successfully": "Your response has been submitted successfully.",
  "submit_another_response": "Click here to submit another response",
};

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const email = ref<string | null>(null);
const id = ref<string | null>(null);
const key = ref<string | null>(null);
const schema = ref<any>(null);
const author = ref<string | null>(null);
const publicKeyFingerprint = ref<string | null>(null);
const publicKey = ref<Uint8Array | null>(null);
const submissionSuccess = ref(false);
const formKey = ref(0);

const route = useRoute();

// RTL detection helpers
function isRTL(text: string) {
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}
function getDir(text: string | undefined) {
  return isRTL(text || "") ? "rtl" : "ltr";
}
function getAlign(text: string | undefined) {
  return isRTL(text || "") ? "right" : "left";
}

const inscriptionDir = computed(() => getDir(inscriptions["submit_another_response"]));
const inscriptionAlign = computed(() => getAlign(inscriptions["submit_another_response"]));

// Window width reactive for max width calculation (SSR-safe)
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);
function onResize() {
  if (typeof window !== "undefined") {
    windowWidth.value = window.innerWidth;
  }
}
onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("resize", onResize);
  }
});
onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", onResize);
  }
});

const maxWidth = computed(() => {
  const w = windowWidth.value;
  if (w >= 900) return 740;
  if (w >= 800) return 715;
  if (w >= 720) return 654;
  if (w >= 680) return 612;
  if (w >= 640) return 580;
  if (w >= 600) return 524;
  if (w >= 512) return 460;
  if (w >= 464) return 418;
  if (w >= 400) return 380;
  if (w >= 360) return 360;
  return 740;
});

// PURE WIDTH LIMITER (no padding, background, border)
const widthLimiterStyle = computed(() => ({
  maxWidth: maxWidth.value + 'px',
  margin: '40px auto'
}));

// Device OS detection util (simple user agent parsing)
const deviceOS = ref<string>("unknown");
function detectDeviceOS() {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/windows phone/i.test(ua)) deviceOS.value = "Windows Phone";
  else if (/android/i.test(ua)) deviceOS.value = "Android";
  else if (/iPad|iPhone|iPod/.test(ua)) deviceOS.value = "iOS";
  else if (/Macintosh/i.test(ua)) deviceOS.value = "MacOS";
  else if (/Windows/i.test(ua)) deviceOS.value = "Windows";
  else if (/Linux/i.test(ua)) deviceOS.value = "Linux";
  else deviceOS.value = "unknown";
}

// Window size reactive
const windowSize = ref({ width: 1024, height: 768 });
function updateWindowSize() {
  if (typeof window !== "undefined") {
    windowSize.value.width = window.innerWidth;
    windowSize.value.height = window.innerHeight;
  }
}

// Orientation reactive tracking
const orientation = ref<"portrait" | "landscape">("portrait");
function updateOrientation() {
  if (typeof window !== "undefined") {
    orientation.value = window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
  }
}

// Leave detection: count how many times cursor left viewport (document.documentElement)
const leaveCount = ref(0);
function onLeaveCursor(ev: MouseEvent) {
  leaveCount.value++;
}

onMounted(() => {
  if (typeof window !== "undefined") {
    detectDeviceOS();
    updateWindowSize();
    updateOrientation();

    window.addEventListener("resize", updateWindowSize);
    window.addEventListener("orientationchange", updateOrientation);

    document.documentElement.addEventListener("mouseleave", onLeaveCursor);
  }
});
onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateWindowSize);
    window.removeEventListener("orientationchange", updateOrientation);

    document.documentElement.removeEventListener("mouseleave", onLeaveCursor);
  }
});

// Show error modal utility
async function showErrorPopup(message: string, isRtl = false) {
  console.error("❌ Error:", message);

  const isUnknown = message === inscriptions["unknown-error"] || message === "Something went wrong";

  const html = isUnknown
    ? `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${inscriptions["unknown-error"]}</p><p dir="${isRtl ? "rtl" : "ltr"}">Check the console</p>`
    : `<p dir="${isRtl ? "rtl" : "ltr"}">${message}</p>`;

  await showClosableErrorModal(() => "OK", html);
}

// Load form data on mount
onMounted(async () => {
  try {
    const rawEmail = route.params.email;
    const rawId = route.params.id;
    const rawKey = route.query.key;

    if (typeof rawEmail !== "string") throw new Error(inscriptions["missing-email"]);
    if (typeof rawId !== "string") throw new Error(inscriptions["missing-id"]);
    if (
      !rawKey ||
      (typeof rawKey !== "string" && (!Array.isArray(rawKey) || rawKey.every((k) => !k)))
    )
      throw new Error(inscriptions["invalid-key"]);

    email.value = rawEmail;
    id.value = rawId;
    key.value = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    const {
      formSchema,
      publicKeyFingerprint: pFingerprint,
      publicKey: pKey,
      author: formAuthor,
      fetchData,
      meta,
    } = useFormTemplateData({
      publisherEmail: email.value,
      formID: id.value,
      decryptionKey: key.value,
      showError: async (errMsg: string, _extra?: string, _errorObj?: unknown, _isCatch?: boolean) => {
        const message = errMsg || inscriptions["unknown-error"];
        const isRtl = isRTL(message);
        await showErrorPopup(message, isRtl);
      },
      setLoading: (v: boolean) => (loading.value = v),
    });

    await fetchData();

    schema.value = formSchema.value;
    publicKeyFingerprint.value = pFingerprint.value;
    publicKey.value = pKey.value;
    author.value = formAuthor.value;

    //console.log("Decoded Publisher Email:", email.value);
    //console.log("Decoded Public Key:", publicKey.value);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : String(e) || inscriptions["unknown-error"];
    error.value = message;
    await showErrorPopup(message, isRTL(message));
  } finally {
    loading.value = false;
  }
});

// Success message
const successNotification = computed(() => {
  if (schema.value?.meta?.successNotification && typeof schema.value.meta.successNotification === "string") {
    return schema.value.meta.successNotification;
  }
  return inscriptions["form_submitted_successfully"];
});

// Helper: Convert Uint8Array to base64 safely
function uint8ToBase64(arr: Uint8Array): string {
  const binary = Array.from(arr).map((byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

// Encapsulate secret with ML KEM
async function encapsulateSecret(pkR: Uint8Array) {
  try {
    const kem = new MlKem1024();
    const [ct, ssS] = await kem.encap(pkR);
    return { ct, ssS };
  } catch (error) {
    console.error("Failed to encapsulate secret:", error);
    return null;
  }
}

// Submit response function with metrics including leaveCount
async function submitResponse(encoded: string) {
  if (!publicKey.value || !author.value || !id.value) {
    await showErrorPopup("Missing encryption key, author, or form ID.");
    return;
  }

  const processingTitle =
    schema.value?.meta?.responseModal?.primary || inscriptions["submitting-your-response"];
  const processingSubtext =
    schema.value?.meta?.responseModal?.subtext || inscriptions["please_wait"];
  const processingMessage = `<p dir="${getDir(processingSubtext)}" style="text-align:center">${processingSubtext}</p>`;

  try {
    await showProcessingModal(processingTitle, processingMessage);

    const encapsulatedSecret1 = await encapsulateSecret(publicKey.value);
    const encapsulatedSecret2 = await encapsulateSecret(publicKey.value);
    if (!encapsulatedSecret1 || !encapsulatedSecret2) {
      throw new Error("Key encapsulation failed");
    }

    const concatenatedSsS = new Uint8Array(
      encapsulatedSecret1.ssS.length + encapsulatedSecret2.ssS.length
    );
    concatenatedSsS.set(encapsulatedSecret1.ssS, 0);
    concatenatedSsS.set(encapsulatedSecret2.ssS, encapsulatedSecret1.ssS.length);

    const paddedData = padToMultipleAsUint8Array(encoded);
    const encryptedResponse = await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
      paddedData,
      concatenatedSsS,
      125
    );

    const encryptedResponseB64 = uint8ToBase64(encryptedResponse);
    const ct1B64 = uint8ToBase64(encapsulatedSecret1.ct);
    const ct2B64 = uint8ToBase64(encapsulatedSecret2.ct);
    const formDocRef = doc(db, `data/${author.value}/forms/${id.value}`);
    await updateDoc(formDocRef, { responses: increment(1) });

    const responseDocRef = doc(collection(db, `data/${author.value}/receivedResponses/encrypted/${id.value}`));
    await setDoc(responseDocRef, {
      encryptedFormResponse: encryptedResponseB64,
      mlkemCiphertext1: ct1B64,
      mlkemCiphertext2: ct2B64,
      metrics: {
        deviceOS: deviceOS.value,
        windowWidth: windowSize.value.width,
        windowHeight: windowSize.value.height,
        orientation: orientation.value,
        leaveCount: leaveCount.value,
      },
      submittedAt: serverTimestamp(),
    });

    await Swal.close();

    submissionSuccess.value = true;
  } catch (error) {
    await Swal.close();
    const msg = error instanceof Error ? error.message : String(error);
    console.error(msg);
    await showErrorPopup(msg, isRTL(msg));
  }
}

// Reset form for new submission
function handleNewSubmission() {
  submissionSuccess.value = false;
  formKey.value++; // rerender form without refetch
}
</script>

<style scoped>
.page-container {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}
</style>
