"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateUserWithRetry } from "@/lib/retry-update";
import { ContentPolicyError } from "@/lib/profanity-filter";
import { updateProfileSchema } from "@/lib/validations/profile";
import { enforceCleanContent } from "@/services/content-policy.service";
import type { ZodError } from "zod";

export type ProfileActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  avatarUrl?: string;
  fullName?: string;
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

// Avatares/banners viram ARQUIVOS (nunca base64 no banco — base64 de 80KB+
// estourou o cookie multiconta e deu 502 no nginx). URLs absolutas para
// funcionarem nos 4 clientes (web, mobile, desktop, API).
function extForMime(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/gif": return "gif";
    case "image/webp": return "webp";
    default: return null;
  }
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://app.hexavante.com.br").replace(/\/$/, "");
}

async function saveProfileFile(
  kind: "avatars" | "banners",
  userId: string,
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<string | null> {
  const ext = extForMime(mimeType);
  if (!ext) return null;
  const name = `${userId}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(bytes));
  return `${appBaseUrl()}/uploads/${kind}/${name}`;
}

async function deleteProfileFile(url: string | null | undefined, kind: "avatars" | "banners"): Promise<void> {
  try {
    if (!url) return;
    const base = appBaseUrl();
    const rel = url.startsWith(base)
      ? url.slice(base.length)
      : url.startsWith("/uploads/")
        ? url
        : null;
    const prefix = `/uploads/${kind}/`;
    if (!rel || !rel.startsWith(prefix)) return;
    const filename = rel.slice(prefix.length);
    if (!filename || filename.includes("/") || filename.includes("..")) return;
    await unlink(path.join(process.cwd(), "public", "uploads", kind, filename));
  } catch {
    // Arquivo já removido ou externo — segue o jogo
  }
}

function resolveImageMimeType(file: File): string | null {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  return extension ? (byExtension[extension] ?? null) : null;
}

function mapZodErrors(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function updateProfileAction(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const raw = {
    fullName: formData.get("fullName"),
    bio: formData.get("bio") ?? "",
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    profileVisibility: formData.get("profileVisibility"),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Corrija os campos destacados.",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  try {
    await enforceCleanContent({
      userId: session.user.id,
      text: parsed.data.fullName,
      fieldLabel: "nome",
      context: "PROFILE",
    });
    if (parsed.data.bio) {
      await enforceCleanContent({
        userId: session.user.id,
        text: parsed.data.bio,
        fieldLabel: "bio",
        context: "PROFILE",
      });
    }
  } catch (error) {
    if (error instanceof ContentPolicyError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  await updateUserWithRetry(
    { id: session.user.id },
    {
      fullName: parsed.data.fullName,
      bio: parsed.data.bio || null,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      state: parsed.data.state?.toUpperCase() || null,
      profileVisibility: parsed.data.profileVisibility,
    },
  );

  revalidatePath("/", "layout");
  revalidatePath("/perfil");
  revalidatePath(`/perfil/${session.user.username}`);
  revalidatePath("/configuracoes/perfil");
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/social");
  revalidatePath("/mensagens");

  return { success: true, fullName: parsed.data.fullName };
}

export async function updateProfilePhotoAction(formData: FormData): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione uma imagem válida." };
  }

  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    return { success: false, error: "Use uma imagem PNG, JPG, GIF ou WebP." };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { success: false, error: "A imagem deve ter no máximo 5MB." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const avatarUrl = await saveProfileFile("avatars", session.user.id, bytes, mimeType);
    if (!avatarUrl) {
      return { success: false, error: "Use uma imagem PNG, JPG, GIF ou WebP." };
    }

    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });
    await updateUserWithRetry(
      { id: session.user.id },
      { avatarUrl },
    );
    await deleteProfileFile(previous?.avatarUrl, "avatars");

    revalidatePath("/perfil");
    revalidatePath(`/perfil/${session.user.username}`);
    revalidatePath("/configuracoes/perfil");
    revalidatePath("/");
    return { success: true, avatarUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isFsError =
      message.includes("EACCES") || message.includes("ENOSPC") || message.includes("EPERM");
    return {
      success: false,
      error: isFsError
        ? "Não foi possível salvar a imagem. Tente novamente."
        : message || "Erro ao atualizar foto de perfil.",
    };
  }
}

const MAX_BANNER_SIZE = 8 * 1024 * 1024;

export async function updateProfileBannerAction(formData: FormData): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione uma imagem válida." };
  }

  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    return { success: false, error: "Use uma imagem PNG, JPG, GIF ou WebP." };
  }

  if (file.size > MAX_BANNER_SIZE) {
    return { success: false, error: "A imagem deve ter no máximo 8MB." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const bannerUrl = await saveProfileFile("banners", session.user.id, bytes, mimeType);
    if (!bannerUrl) {
      return { success: false, error: "Use uma imagem PNG, JPG, GIF ou WebP." };
    }

    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bannerUrl: true },
    });
    await updateUserWithRetry(
      { id: session.user.id },
      { bannerUrl },
    );
    await deleteProfileFile(previous?.bannerUrl, "banners");

    revalidatePath("/perfil");
    revalidatePath(`/perfil/${session.user.username}`);
    revalidatePath("/configuracoes/perfil");
    revalidatePath("/");
    return { success: true, avatarUrl: bannerUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      success: false,
      error: message || "Erro ao atualizar banner.",
    };
  }
}

export async function removeProfileBannerAction(): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    await updateUserWithRetry(
      { id: session.user.id },
      { bannerUrl: null },
    );

    revalidatePath("/perfil");
    revalidatePath(`/perfil/${session.user.username}`);
    revalidatePath("/configuracoes/perfil");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao remover banner." };
  }
}
