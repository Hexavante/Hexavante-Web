import { getAuthBaseUrl } from "@/lib/auth-env";

export function getCertificatePublicPath(code: string): string {
  return `/certificados/c/${encodeURIComponent(code)}`;
}

export function getCertificatePublicUrl(code: string, baseUrl = getAuthBaseUrl()): string {
  const origin = baseUrl.replace(/\/$/, "");
  return `${origin}${getCertificatePublicPath(code)}`;
}

export function buildCertificateShareMessage(data: {
  studentName: string;
  courseTitle: string;
  code: string;
}): string {
  return `Concluí o curso "${data.courseTitle}" na Hexavante e recebi meu certificado! 🎓`;
}

export function buildLinkedInShareUrl(publicUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
}

export function buildWhatsAppShareUrl(message: string, publicUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${publicUrl}`)}`;
}
