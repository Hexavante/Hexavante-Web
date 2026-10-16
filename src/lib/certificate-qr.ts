import QRCode from "qrcode";

export async function generateCertificateQrDataUrl(
  url: string,
  size = 200,
): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateCertificateQrPng(url: string, size = 256): Promise<Buffer> {
  const dataUrl = await generateCertificateQrDataUrl(url, size);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}
