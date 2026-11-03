import { AppLink } from "@/components/ui/app-link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { loginAction } from "@/app/actions/auth";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { fetchOAuthProviders, oauthErrorMessages } from "@/lib/oauth";
import { Alert } from "@/components/ui/alert";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string; registered?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, error, registered } = await searchParams;
  const safeCallback = getSafeCallbackUrl(callbackUrl);
  const providers = await fetchOAuthProviders();

  const oauthError = error
    ? oauthErrorMessages[error] ?? "Não foi possível entrar com a conta social."
    : null;

  return (
    <AuthPageShell variant="login">
      {registered === "1" && <Alert variant="info">Sua conta foi criada. Entre com seu e-mail e senha para continuar.</Alert>}
      {oauthError && (
        <Alert variant="danger" className="mt-4">
          {oauthError}
        </Alert>
      )}

      <div>
        <AuthForm
          embedded
          title="HEXAVANTE"
          subtitle="Acesse sua conta e continue sua jornada."
          submitLabel="Entrar"
          action={loginAction}
          callbackUrl={safeCallback}
          formKind="login"
          fields={[
            { name: "email", label: "E-mail", type: "email", placeholder: "seu@email.com" },
            { name: "password", label: "Senha", type: "password", placeholder: "Sua senha" },
          ]}
          footer={
            <>
            <OAuthButtons callbackUrl={safeCallback} providers={providers} placement="after-form" />
            <p className="text-xs">
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
            </>
          }
        />
      </div>
    </AuthPageShell>
  );
}
