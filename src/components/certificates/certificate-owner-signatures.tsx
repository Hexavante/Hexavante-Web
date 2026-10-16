import Image from "next/image";
import { HEXAVANTE_CERTIFICATE_OWNERS } from "@/lib/certificate-owners";

export function CertificateOwnerSignatures() {
  return (
    <div className="border-t border-white/10 px-6 py-6 sm:px-8">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Fundadores, Hexavante
      </p>
      <div className="mt-5 grid gap-8 sm:grid-cols-2">
        {HEXAVANTE_CERTIFICATE_OWNERS.map((owner) => (
          <div key={owner.name} className="flex flex-col items-center text-center">
            <div className="flex h-[4.5rem] w-full max-w-[15rem] items-center justify-center rounded-xl border border-white/10 bg-white px-4 py-2 shadow-inner">
              <Image
                src={owner.signaturePublicPath}
                alt={`Assinatura de ${owner.name}`}
                width={220}
                height={72}
                className="h-12 w-auto max-w-full object-contain"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">{owner.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{owner.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
