import path from "node:path";

export type CertificateOwner = {
  name: string;
  title: string;
  signatureFile: string;
  signaturePublicPath: string;
};

export const HEXAVANTE_CERTIFICATE_OWNERS: CertificateOwner[] = [
  {
    name: "Nicolas das V'Souza",
    title: "Co-fundador, Hexavante",
    signatureFile: "nicolas-vsouza.png",
    signaturePublicPath: "/certificates/signatures/nicolas-vsouza.png",
  },
  {
    name: "Nicolas K. Mazzini",
    title: "Co-fundador, Hexavante",
    signatureFile: "nicolas-mazzini.png",
    signaturePublicPath: "/certificates/signatures/nicolas-mazzini.png",
  },
];

export function getCertificateOwnerSignaturePath(file: string): string {
  return path.join(process.cwd(), "public", "certificates", "signatures", file);
}
