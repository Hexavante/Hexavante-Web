import { auth } from "@/auth";
import { canModerate } from "@/lib/permissions";
import { getPlatformSettingsSnapshot } from "@/services/platform-settings.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.roles)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const roles = session.user.roles ?? [];
  const isSuperAdmin = roles.includes("SUPERADMIN");
  const settings = await getPlatformSettingsSnapshot();

  return NextResponse.json({
    ...settings,
    canManageMaintenance: isSuperAdmin,
    canImpersonate: isSuperAdmin,
    viewer: { id: session.user.id, roles },
  });
}
