import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site-url";

/**
 * A home institucional pertence exclusivamente ao Hexavante-landing.
 * O Web não mantém uma segunda landing: a raiz aponta para o site público.
 */
export default function RootPage() {
  redirect(siteUrl());
}
