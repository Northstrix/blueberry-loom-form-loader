"use client";
import Swal from "sweetalert2";

/**
 * Show a non-closable modal with custom HTML content.
 */
export async function showNonClosableModal(
  t: (key: string) => string,
  errorMessage: string
) {
  await Swal.fire({
    icon: "error",
    title: "Error",
    html: errorMessage,
    width: 600,
    padding: "3em",
    color: "var(--foreground)",
    background: "var(--card-background)",
    showConfirmButton: false,
    allowOutsideClick: false,
    customClass: {
      popup: "swal-custom-popup",
    },
  });
  // After modal dismissed, redirect current window
  window.location.href = "https://blueberry-loom.netlify.app/";
}

/**
 * Show a closable error modal with a custom button and optional callback.
 */
export async function showClosableErrorModal(
  t: (key: string) => string,
  errorMessage: string,
  onOk?: () => void
) {
  await Swal.fire({
    icon: "error",
    title: "Error",
    html: errorMessage,
    width: 600,
    padding: "3em",
    color: "var(--foreground)",
    background: "var(--card-background)",
    confirmButtonText: "OK",
    showConfirmButton: false,
    footer: `<a class="btn_grd"><span>${"OK"}</span></a>`,
    customClass: {
      popup: "swal-custom-popup",
      footer: "swal-custom-footer",
    },
    didOpen: () => {
      const button = Swal.getFooter()?.querySelector(".btn_grd");
      if (button) {
        button.addEventListener("click", () => {
          Swal.close();
          if (onOk) onOk();
          // Redirect current window after modal is closed
          window.location.href = "https://blueberry-loom.netlify.app/";
        });
      } else {
        console.error("Button element not found!");
      }
    },
    allowOutsideClick: true, // allow dismiss by outside click
  });
    window.location.href = "https://blueberry-loom.netlify.app/";
}

/**
 * Show a non-closable processing modal with a loading spinner.
 * @param title Modal title
 * @param message HTML message (string, e.g., `<p>...</p><p>...</p>`)
 */
export function showProcessingModal(
  title: string,
  message: string
) {
  Swal.fire({
    title: title,
    html: message,
    color: "var(--foreground)",
    background: "var(--card-background)",
    width: 720,
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: false,
    customClass: {
      popup: "swal-custom-popup",
    },
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

export function updateProcessingModal(
  title: string,
  message: string
) {
  Swal.update({
    title: title,
    html: message,
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: false,
    customClass: {
      popup: "swal-custom-popup", // Custom class for styling
    },
  });
  Swal.showLoading();
}

/**
 * Show a themed confirmation modal with custom buttons in the footer.
 *
 * - Uses SweetAlert2 but disables default buttons.
 * - Footer contains two buttons: Confirm (theme color) and Cancel (theme red).
 * - Button order is LTR/RTL aware (Cancel left for LTR, right for RTL).
 * - Button inscriptions are provided via translation.
 * - Returns a Promise<boolean>: true if confirmed, false if cancelled.
 * - Fully styled to match your app's theme.
 *
 * @param title Modal title (string)
 * @param message HTML message (string, e.g., `<p>...</p><p>...</p>`)
 * @param confirmText Confirm button text (string)
 * @param cancelText Cancel button text (string)
 * @param isRtl Whether to render RTL (boolean)
 * @returns Promise<boolean> true if confirmed, false if cancelled
 */
export function showConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  isRtl,
}: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isRtl: boolean;
}): Promise<boolean> {
  const confirmBtn = `<a class="btn_grd${isRtl ? ' rtl' : ''}" id="swal-confirm-btn" style="margin:0 0.33em; background-image:linear-gradient(135deg, var(--theme-red), var(--theme-red));"><span>${confirmText}</span></a>`;
  const cancelBtn = `<a class="btn_grd${isRtl ? ' rtl' : ''}" id="swal-cancel-btn" style="margin:0 0.33em;"><span>${cancelText}</span></a>`;

  const footerHtml = isRtl
    ? `${confirmBtn}${cancelBtn}`
    : `${cancelBtn}${confirmBtn}`;

  return new Promise<boolean>((resolve) => {
    let resolved = false; // Track if already resolved

    Swal.fire({
      title,
      html: message,
      icon: "warning",
      showConfirmButton: false,
      showCancelButton: false,
      background: "var(--card-background)",
      color: "var(--foreground)",
      customClass: {
        popup: "swal-custom-popup",
        footer: "swal-custom-footer",
      },
      focusCancel: !isRtl,
      focusConfirm: isRtl,
      footer: footerHtml,
      didOpen: () => {
        const confirmBtnEl = document.getElementById("swal-confirm-btn");
        const cancelBtnEl = document.getElementById("swal-cancel-btn");
        if (confirmBtnEl) {
          confirmBtnEl.addEventListener("click", () => {
            if (!resolved) {
              resolved = true;
              Swal.close();
              resolve(true);
            }
          });
        }
        if (cancelBtnEl) {
          cancelBtnEl.addEventListener("click", () => {
            if (!resolved) {
              resolved = true;
              Swal.close();
              resolve(false);
            }
          });
        }
      },
      willClose: () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      },
    });
  });
}

export function showClosableSuccessModal(
  t: (key: string) => string,
  successMessage: string,
  onOk?: () => void
) {
  Swal.fire({
    icon: "success",
    title: 'Success',
    html: successMessage,
    width: 600,
    padding: "3em",
    color: "var(--foreground)",
    background: "var(--card-background)",
    confirmButtonText: "OK",
    showConfirmButton: false,
    footer: `<a class="btn_grd"><span>${"OK"}</span></a>`,
    customClass: {
      popup: "swal-custom-popup",
      footer: "swal-custom-footer",
    },
    didOpen: () => {
      const button = Swal.getFooter()?.querySelector('.btn_grd');
      if (button) {
        button.addEventListener('click', () => {
          Swal.close();
          if (onOk) onOk();
        });
      } else {
        console.error("Button element not found!");
      }
    }
  });
}