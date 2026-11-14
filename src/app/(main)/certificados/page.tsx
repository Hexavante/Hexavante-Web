import { Award, FileBadge } from "lucide-react";
import { getUserCertificatesAction } from "@/app/actions/certificate";
import { CertificateList } from "@/components/certificates/certificate-list";
import { auth } from "@/auth";
import { AppLink } from "@/components/ui/app-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/certificados");

  const certificates = await getUserCertificatesAction();

  return (
    <PageShell>
      <div className=" ">
        <PageHeader
          badge="Conquistas"
          icon={Award}
          title="Meus certificados"
          description="Compartilhe suas conquistas com orgulho — cada certificado tem página pública e QR Code."
        />
        <AppLink href="/certificados/verificar" className="mb-8 inline-block">
          Verificar um certificado por código →
        </AppLink>
      </div>

      <div className=" ">
        {certificates.length === 0 ? (
          <EmptyState
            icon={FileBadge}
            title="Você ainda não possui certificados."
            description="Complete um curso para emitir o seu."
          />
        ) : (
          <CertificateList certificates={certificates} />
        )}
      </div>
    </PageShell>
  );
}
