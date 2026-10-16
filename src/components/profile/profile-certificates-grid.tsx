import { Award, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getCertificatePublicPath } from "@/lib/certificate-share";

export type ProfileCertificate = {
  id: string;
  code: string;
  issuedAt: Date;
  courseTitle: string;
  categoryName: string;
};

type Props = {
  certificates: ProfileCertificate[];
};

export function ProfileCertificatesGrid({ certificates }: Props) {
  if (certificates.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum certificado emitido ainda.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert) => {
        const publicPath = getCertificatePublicPath(cert.code);
        const issuedLabel = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(cert.issuedAt);

        return (
          <Link
            key={cert.id}
            href={publicPath}
            className="group flex flex-col rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-5 transition hover:border-[hsl(var(--sidebar-highlight)/0.32)] hover:bg-[hsl(var(--sidebar-highlight)/0.06)]"
          >
            <div className="flex items-start gap-3">
              <span className="hx-icon-box">
                <Award className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white group-hover:text-[hsl(var(--sidebar-foreground))]">
                  {cert.courseTitle}
                </p>
                <p className="mt-1 text-sm text-slate-400">{cert.categoryName}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-[hsl(var(--sidebar-highlight))]" />
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
              Emitido em {issuedLabel}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
