"use client";

import { usePathname } from "next/navigation";
import type { NavSession } from "@/lib/nav-session";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const BARE_LAYOUT_PREFIXES = [
  "/login",
  "/register",
  "/manutencao",
  "/suspenso",
  "/recuperar-senha",
  "/redefinir-senha",
  "/hexa",
  "/ajuda",
  "/cursos",
  "/pagamento",
];

const BARE_LAYOUT_EXACT = ["/"];

type Props = {
  session: NavSession;
  /** Server Component slot — must be passed from a Server Layout, not imported here. */
  header: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ session, header, children }: Props) {
  const pathname = usePathname();
  const useBareLayout =
    BARE_LAYOUT_EXACT.includes(pathname) ||
    BARE_LAYOUT_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (useBareLayout) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar session={session} />
      <SidebarInset>
        {header}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
