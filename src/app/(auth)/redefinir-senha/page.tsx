import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function RedefinirSenhaPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <AuthPageShell>
      <ResetPasswordForm token={token?.trim() ?? ""} />
    </AuthPageShell>
  );
}
