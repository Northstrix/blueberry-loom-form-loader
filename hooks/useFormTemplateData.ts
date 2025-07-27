import { ref } from 'vue'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '~/plugins/firebase.client'
import { whirlpool, sha512 } from 'hash-wasm'
import { decryptFieldValueWithTwoCiphersCBCnoPadding } from '../utils/twoCiphersSilentMode'
import { unpadMultipleAsString } from '../hooks/usePadStringToMultiple'
import { decodeFormTemplate } from '../utils/formTemplateCodec'
import { decodePercentEncoding, customBase64ToUtf8, customBase64ToUint8Array } from '../utils/decodeURL'

// Hardcoded inscriptions
const inscriptions = {
  "form-id-missing": "Form ID is missing.",
  "invalid-email": "Invalid email address.",
  "invalid-key": "Invalid decryption key.",
  "form_not_found": "Form not found.",
  "form_schema_decode_failed": "Failed to decode form schema.",
  "publisher_key_not_found": "Publisher key not found.",
  "publisher_key_invalid": "Publisher key is invalid.",
  "form_integrity_compromised": "Form integrity is compromised.",
  "form_padding_invalid": "Form padding is invalid.",
  "invalid-encoding-of-the-encrypted-form-template-retrieved-from-firebase": "Invalid encoding of the encrypted form template retrieved from Firebase.",
  "k": "Something went wrong",
}

export function useFormTemplateData({
  publisherEmail,
  formID,
  decryptionKey,
  showError,
  setLoading,
}: {
  publisherEmail: string;
  formID: string;
  decryptionKey: string;
  showError: (key: string, extra?: string, errorObj?: any, isCatch?: boolean) => void;
  setLoading: (v: boolean) => void;
}) {
  const formSchema = ref<any | null>(null)
  const publicKeyFingerprint = ref<string | null>(null)
  const publicKey = ref<Uint8Array | null>(null)
  const author = ref<string | null>(null)
  const meta = ref<{ [k: string]: string | undefined }>({})

  async function fetchData() {
    setLoading(true)
    formSchema.value = null
    publicKeyFingerprint.value = null
    publicKey.value = null
    author.value = null
    meta.value = {}

    try {
      if (!formID || typeof formID !== 'string' || !formID.trim()) {
        throw new Error(inscriptions["form-id-missing"])
      }

      let decodedEmail: string
      try {
        const sanitizedEmail = decodePercentEncoding(publisherEmail)
        decodedEmail = customBase64ToUtf8(sanitizedEmail)
        author.value = decodedEmail
      } catch (e) {
        throw new Error(inscriptions["invalid-email"])
      }

      let decodedKey: Uint8Array
      try {
        const sanitizedKey = decodePercentEncoding(decryptionKey)
        decodedKey = customBase64ToUint8Array(sanitizedKey)
      } catch (e) {
        throw new Error(inscriptions["invalid-key"])
      }

      // Fetch form doc
      const formDocRef = doc(db, `data/${decodedEmail}/forms/${formID}`)
      const formSnap = await getDoc(formDocRef)
      if (!formSnap.exists()) {
        throw new Error(inscriptions["form_not_found"])
      }
      const formData = formSnap.data()
      const encrypted = formData.encryptedFormTemplate ?? null

      // Increment visits atomically
      await updateDoc(formDocRef, { visits: increment(1) })

      if (!(encrypted && decodedKey)) {
        throw new Error(inscriptions["form_not_found"])
      }

      let decodedTemplateBytes: Uint8Array
      try {
        decodedTemplateBytes = customBase64ToUint8Array(encrypted)
      } catch (e) {
        throw new Error(
          inscriptions[
            "invalid-encoding-of-the-encrypted-form-template-retrieved-from-firebase"
          ]
        )
      }

      const [decryptedFormTemplateBytes, formTemplateIntegrity] =
        await decryptFieldValueWithTwoCiphersCBCnoPadding(
          decodedTemplateBytes,
          decodedKey,
          125
        )
      if (!formTemplateIntegrity) {
        throw new Error(inscriptions["form_integrity_compromised"])
      }
      const [unpadded, isPaddingValid] = unpadMultipleAsString(
        decryptedFormTemplateBytes,
        "~"
      )
      if (!isPaddingValid) {
        throw new Error(inscriptions["form_padding_invalid"])
      }

      formSchema.value = decodeFormTemplate(unpadded)

      // Parse meta fields
      const metaMatch = unpadded.match(/^META\(([^)]*)\)/)
      let metaObj: { [k: string]: string | undefined } = {}
      if (metaMatch) {
        const metaParts = metaMatch[1].split(":")
        const decodeBase64Unicode = (str: string): string => {
          try {
            return decodeURIComponent(escape(atob(str)))
          } catch {
            return str
          }
        }
        metaObj = {
          title: metaParts[0] ? decodeBase64Unicode(metaParts[0]) : "",
          description: metaParts[1] ? decodeBase64Unicode(metaParts[1]) : "",
          submissionTitle: metaParts[2] ? decodeBase64Unicode(metaParts[2]) : "",
          submissionInscription: metaParts[3]
            ? decodeBase64Unicode(metaParts[3])
            : "",
          submissionSuccess: metaParts[4] ? decodeBase64Unicode(metaParts[4]) : "",
          accentColor: metaParts[5] ? decodeBase64Unicode(metaParts[5]) : undefined,
          textColor: metaParts[6] ? decodeBase64Unicode(metaParts[6]) : undefined,
        }
      }
      meta.value = metaObj

      // Fetch publisher's public key fingerprint
      const keyRef = doc(db, `data/${decodedEmail}/public`, "mlkem-public-key")
      const keyDoc = await getDoc(keyRef)
      const keyData = keyDoc.data()

      if (!keyData || !("publicKey" in keyData)) {
        throw new Error(inscriptions["publisher_key_not_found"])
      }

      const publicKeyStr = keyData.publicKey
      let publicKeyBytes: Uint8Array
      try {
        const binaryString = atob(publicKeyStr)
        publicKeyBytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          publicKeyBytes[i] = binaryString.charCodeAt(i)
        }
      } catch {
        throw new Error(inscriptions["publisher_key_invalid"])
      }

      if (publicKeyBytes.length !== 1568) {
        throw new Error(inscriptions["publisher_key_invalid"])
      }

      const sha512Hash = await sha512(publicKeyStr)

      const hexStringToArray = (hexString: string): Uint8Array => {
        const matches = hexString.match(/.{1,2}/g)
        if (!matches) throw new Error("Invalid hexadecimal string")
        return new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
      }
      const sha512Bytes = hexStringToArray(sha512Hash)
      const whirlpoolHash = await whirlpool(sha512Bytes)
      const whirlpoolBytes = hexStringToArray(whirlpoolHash)

      const hex = Array.from(whirlpoolBytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join("")
      const blocks = []
      for (let i = 0; i < hex.length; i += 4) {
        blocks.push(hex.slice(i, i + 4))
      }
      publicKeyFingerprint.value = blocks.join("-")
      publicKey.value = publicKeyBytes
    } catch (e) {
      // Propagate error to caller for handling
      throw e instanceof Error ? e : new Error(String(e))
    } finally {
      setLoading(false)
    }
  }

  return {
    formSchema,
    publicKeyFingerprint,
    publicKey,
    author,
    meta,
    fetchData,
  }
}
