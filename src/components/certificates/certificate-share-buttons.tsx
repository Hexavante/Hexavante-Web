"use client";

import { useState } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  buildCertificateShareMessage,
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/certificate-share";

type Props = {
  publicUrl: string;
  studentName: string;
  courseTitle: string;
  code: string;
  compact?: boolean;
};

export function CertificateShareButtons({
  publicUrl,
  studentName,
  courseTitle,
  code,
  compact = false,
}: Props) {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  const message = buildCertificateShareMessage({ studentName, courseTitle, code });
  const linkedInUrl = buildLinkedInShareUrl(publicUrl);
  const whatsAppUrl = buildWhatsAppShareUrl(message, publicUrl);

  async function copyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast("Link copiado para a área de transferência.", "success");
    } catch {
      toast("Não foi possível copiar o link.", "error");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="gap-2"
        onClick={() => window.open(linkedInUrl, "_blank", "noopener,noreferrer")}
        aria-label="Compartilhar no LinkedIn"
      >
        <Share2 className="h-4 w-4" />
        LinkedIn
      </Button>

      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="gap-2"
        onClick={() => window.open(whatsAppUrl, "_blank", "noopener,noreferrer")}
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </Button>

      <Button
        type="button"
        variant="ghost"
        size={compact ? "sm" : "default"}
        className="gap-2"
        disabled={copying}
        onClick={copyLink}
        aria-label="Copiar link do certificado"
      >
        <Copy className="h-4 w-4" />
        Copiar link
      </Button>
    </div>
  );
}
