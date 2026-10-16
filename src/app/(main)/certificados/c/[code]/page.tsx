import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCertificateByCode } from "@/app/actions/certificate";
import { CertificatePublicShowcase } from "@/components/certificates/certificate-public-showcase";
import { AppLink } from "@/components/ui/app-link";
import { PageShell } from "@/components/ui/page-shell";
import { verifyCertificateCode } from "@/lib/certificate";
import { getCertificatePublicUrl } from "@/lib/certificate-share";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  if (!verifyCertificateCode(code)) {
    return { title: "Certificado não encontrado" };
  }

  const certificate = await getPublicCertificateByCode(code);
  if (!certificate) {
    return { title: "Certificado não encontrado" };
  }

  const title = `${certificate.user.fullName} — ${certificate.course.title}`;
  const description = `Certificado de conclusão verificado na Hexavante. Código ${certificate.code}.`;
  const url = getCertificatePublicUrl(code);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Hexavante",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicCertificatePage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  if (!verifyCertificateCode(code)) {
    notFound();
  }

  const certificate = await getPublicCertificateByCode(code);
  if (!certificate) notFound();

  return (
    <PageShell size="md">
      <AppLink href="/certificados/verificar" muted className="mb-6 inline-flex items-center gap-1">
        ← Verificar outro certificado
      </AppLink>

      <CertificatePublicShowcase certificate={certificate} />
    </PageShell>
  );
}
