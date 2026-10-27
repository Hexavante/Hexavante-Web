import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { RegisterWizard } from "@/components/auth/register-wizard";
import { registerAction } from "@/app/actions/auth";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { fetchOAuthProviders } from "@/lib/oauth";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const safeCallback = getSafeCallbackUrl(callbackUrl);
  const providers = await fetchOAuthProviders();

  return (
    <AuthPageShell variant="register">
      <RegisterWizard
        action={registerAction}
        callbackUrl={safeCallback}
        socialOptions={
          <OAuthButtons
            callbackUrl={safeCallback}
            providers={providers}
            placement="after-form"
          />
        }
      />
    </AuthPageShell>
  );
}
