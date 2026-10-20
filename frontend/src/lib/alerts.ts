import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type AlertLanguage = "en" | "lo";

export function showErrorAlert(
  message: string,
  lang: AlertLanguage,
  title?: string,
): Promise<void> {
  const lao = lang === "lo";
  return Swal.fire({
    icon: "error",
    title: title ?? (lao ? "ດຳເນີນການບໍ່ສຳເລັດ" : "Something went wrong"),
    text: message,
    confirmButtonText: lao ? "ຕົກລົງ" : "Got it",
    confirmButtonColor: "#f4510b",
    buttonsStyling: true,
    heightAuto: false,
    showClass: { popup: "swal2-show" },
    hideClass: { popup: "swal2-hide" },
    customClass: {
      popup: "pasopkan-alert-popup",
      title: "pasopkan-alert-title",
      htmlContainer: "pasopkan-alert-message",
      confirmButton: "pasopkan-alert-confirm",
    },
  }).then(() => undefined);
}
