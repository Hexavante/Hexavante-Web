import Image from "next/image";
import Link from "next/link";
import { Award, BadgeCheck, Calendar, ShieldCheck } from "lucide-react";
import { CertificateOwnerSignatures } from "@/components/certificates/certificate-owner-signatures";
import { CertificateShareButtons } from "@/components/certificates/certificate-share-buttons";
import { AppLink } from "@/components/ui/app-link";
import { Badge } from "@/components/ui/badge";
import { getCertificatePublicUrl } from "@/lib/certificate-share";
import { generateCertificateQrDataUrl } from "@/lib/certificate-qr";

export type PublicCertificateData = {
  code: string;
  issuedAt: Date;
  verifiedAt: Date | null;
  user: {
    fullName: string;
    username: string | null;
  };
  course: {
    title: string;
    slug: string;
    category: {
      name: string;
    };
  };
};

type Props = {
  certificate: PublicCertificateData;
  showOwnerActions?: boolean;
  certificateId?: string;
};

export async function CertificatePublicShowcase({
  certificate,
  showOwnerActions = false,
  certificateId,
}: Props) {
  const publicUrl = getCertificatePublicUrl(certificate.code);
  const qrDataUrl = await generateCertificateQrDataUrl(publicUrl, 180);

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.08] via-white/[0.04] to-sky-400/[0.06] shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/30 bg-black/40 p-1.5">
              <Image
                src="/brand/hexavante-logo.webp"
                alt="Hexavante"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Hexavante</p>
              <p className="text-sm text-slate-400">Certificado de conclusão</p>
            </div>
          </div>
          <Badge variant="emerald" className="gap-1.5 px-3 py-1.5">
            <ShieldCheck className="h-4 w-4" />
            Verificado
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Certificamos que
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            {certificate.user.fullName}
          </h1>
          <p className="mt-4 text-base text-slate-300">concluiu com sucesso o curso</p>
          <p className="mt-2 text-2xl font-bold text-amber-200">{certificate.course.title}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="teal">{certificate.course.category.name}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              <Calendar className="h-4 w-4 text-sky-300" />
              {new Date(certificate.issuedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Código de verificação
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-sky-200">{certificate.code}</p>
            {certificate.verifiedAt && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
                <BadgeCheck className="h-3.5 w-3.5" />
                Última verificação em{" "}
                {new Date(certificate.verifiedAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          <CertificateShareButtons
            publicUrl={publicUrl}
            studentName={certificate.user.fullName}
            courseTitle={certificate.course.title}
            code={certificate.code}
          />

          {showOwnerActions && certificateId && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <AppLink href="/certificados" muted>
                ← Meus certificados
              </AppLink>
              <Link
                href={`/api/certificates/${certificateId}/pdf`}
                className="font-semibold text-sky-300 hover:text-sky-200"
              >
                Baixar PDF
              </Link>
              <Link
                href={`/courses/${certificate.course.slug}`}
                className="font-semibold text-slate-300 hover:text-white"
              >
                Ver curso
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-white p-3 shadow-lg">
            <Image
              src={qrDataUrl}
              alt={`QR Code para verificar o certificado ${certificate.code}`}
              width={180}
              height={180}
              unoptimized
              className="h-[180px] w-[180px]"
            />
          </div>
          <p className="max-w-[12rem] text-center text-xs text-slate-400">
            Escaneie para abrir a página pública de verificação
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-200/90">
            <Award className="h-4 w-4" />
            Emitido pela plataforma Hexavante
          </div>
        </div>
      </div>

      <CertificateOwnerSignatures />
    </div>
  );
}
