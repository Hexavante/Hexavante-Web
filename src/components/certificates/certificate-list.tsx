import { Award, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CertificateDownloadButton } from "@/components/certificates/certificate-download-button";
import { CertificateShareButtons } from "@/components/certificates/certificate-share-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getCertificatePublicPath, getCertificatePublicUrl } from "@/lib/certificate-share";

type CertificateItem = {
  id: string;
  code: string;
  issuedAt: Date;
  verifiedAt: Date | null;
  user: { fullName: string };
  course: { title: string; category: { name: string } };
};

type Props = {
  certificates: CertificateItem[];
};

export function CertificateList({ certificates }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert) => {
        const publicUrl = getCertificatePublicUrl(cert.code);
        const publicPath = getCertificatePublicPath(cert.code);

        return (
          <Card
            key={cert.id}
            padding="lg"
            className="flex flex-col transition hover:border-amber-400/30 hover:bg-white/[0.06]"
          >
            <CardHeader>
              <span className="hx-icon-box border-amber-400/20 bg-amber-400/10 text-amber-200">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>{cert.course.title}</CardTitle>
                <p className="text-sm text-slate-400">{cert.course.category.name}</p>
              </div>
            </CardHeader>

            <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Emitido para</span>
                <span className="text-right font-semibold text-white">{cert.user.fullName}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Código</span>
                <span className="text-right font-semibold text-sky-200">{cert.code}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Data</span>
                <span>{new Date(cert.issuedAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            <Link
              href={publicPath}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hx-accent-link"
            >
              <ExternalLink className="h-4 w-4" />
              Ver página pública
            </Link>

            <CertificateShareButtons
              publicUrl={publicUrl}
              studentName={cert.user.fullName}
              courseTitle={cert.course.title}
              code={cert.code}
              compact
            />

            <CertificateDownloadButton certificateId={cert.id} code={cert.code} />

            {cert.verifiedAt && (
              <div className="mt-3">
                <Badge variant="emerald" className="w-full justify-center py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Verificado em {new Date(cert.verifiedAt).toLocaleDateString("pt-BR")}
                </Badge>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
