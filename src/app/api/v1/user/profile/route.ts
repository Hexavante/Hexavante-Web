import { NextResponse } from "next/server";
import { type z } from "zod";
import { ApiError, withApiErrorHandling } from "@/lib/api-error";
import { requireBearerAuth } from "@/lib/api-auth";
import { serializeUserProfile } from "@/lib/api-serialize";
import { ContentPolicyError } from "@/lib/profanity-filter";
import { updateProfileSchema } from "@/lib/validations/profile";
import { prisma } from "@/lib/prisma";
import { enforceCleanContent } from "@/services/content-policy.service";
import { getUserProfile } from "@/services/student.service";

function mapZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export const GET = withApiErrorHandling(async (req) => {
  const userId = await requireBearerAuth(req);
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new ApiError(404, "Usuário não encontrado");
  }

  return NextResponse.json({ profile: serializeUserProfile(profile) });
});

export const PUT = withApiErrorHandling(async (req) => {
  const userId = await requireBearerAuth(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Corpo da requisição inválido");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Corrija os campos destacados.",
        fieldErrors: mapZodErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  try {
    await enforceCleanContent({
      userId,
      text: parsed.data.fullName,
      fieldLabel: "nome",
      context: "PROFILE",
    });
    if (parsed.data.bio) {
      await enforceCleanContent({
        userId,
        text: parsed.data.bio,
        fieldLabel: "bio",
        context: "PROFILE",
      });
    }
  } catch (error) {
    if (error instanceof ContentPolicyError) {
      throw new ApiError(422, error.message);
    }
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: parsed.data.fullName,
      bio: parsed.data.bio || null,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      state: parsed.data.state?.toUpperCase() || null,
      profileVisibility: parsed.data.profileVisibility,
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      bio: true,
      phone: true,
      city: true,
      state: true,
      profileVisibility: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({
    success: true,
    profile: serializeUserProfile(updated),
  });
});
