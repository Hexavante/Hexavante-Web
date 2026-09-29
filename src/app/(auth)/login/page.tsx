import { AppLink } from "@/components/ui/app-link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { loginAction } from "@/app/actions/auth";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { fetchOAuthProviders, oauthErrorMessages } from "@/lib/oauth";
import { Alert } from "@/components/ui/alert";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;
  const safeCallback = getSafeCallbackUrl(callbackUrl);
  const providers = await fetchOAuthProviders();

  const oauthError = error
    ? oauthErrorMessages[error] ?? "Não foi possível entrar com a conta social."
    : null;

  return (
    <AuthPageShell>
      <OAuthButtons callbackUrl={safeCallback} providers={providers} />

      {oauthError && (
        <Alert variant="danger" className="mt-4">
          {oauthError}
        </Alert>
      )}

      <div className="mt-6">
        <AuthForm
          embedded
          title="ENTRAR"
          subtitle="Acesse sua conta Hexavante"
          submitLabel="Entrar"
          action={loginAction}
          callbackUrl={safeCallback}
          formKind="login"
          fields={[
            { name: "email", label: "E-mail", type: "email" },
            { name: "password", label: "Senha", type: "password" },
          ]}
          footer={
            <p>
              Não tem conta?{" "}
              <AppLink
                href={
                  safeCallback === "/"
                    ? "/register"
                    : `/register?callbackUrl=${encodeURIComponent(safeCallback)}`
                }
              >
                Cadastre-se
              </AppLink>
            </p>
          }
        />
      </div>
    </AuthPageShell>
  );
}
