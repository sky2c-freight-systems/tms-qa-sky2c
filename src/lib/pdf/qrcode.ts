import QRCode from "qrcode";

/**
 * Generates a QR code as a `data:image/png;base64,...` URL, suitable for
 * dropping straight into a template's `<img src>` — this fills the box the
 * legacy Bill of Lading left as an empty placeholder.
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 160,
  });
}
