import { AppLink } from "@/components/ui/app-link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
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
    <AuthPageShell>
      <OAuthButtons callbackUrl={safeCallback} providers={providers} />

      <div className="mt-6">
        <AuthForm
          embedded
          title="Criar conta"
          subtitle="Junte-se à plataforma Hexavante"
          submitLabel="Cadastrar"
          action={registerAction}
          callbackUrl={safeCallback}
          formKind="register"
          fields={[
            { name: "username", label: "Nome de usuário", placeholder: "seu_usuario" },
            { name: "fullName", label: "Nome completo", placeholder: "Seu nome" },
            { name: "email", label: "E-mail", type: "email", placeholder: "voce@email.com" },
            { name: "password", label: "Senha", type: "password", placeholder: "Mínimo 8 caracteres" },
            { name: "confirmPassword", label: "Confirmar senha", type: "password", placeholder: "Repita a senha" },
            { name: "birthDate", label: "Data de nascimento", type: "date" },
            { name: "phone", label: "Telefone (opcional)", required: false, placeholder: "(11) 99999-9999" },
            { name: "city", label: "Cidade (opcional)", required: false, half: true, placeholder: "São Paulo" },
            { name: "state", label: "Estado (opcional)", required: false, half: true, placeholder: "SP" },
            { name: "terms", label: "Termos", checkbox: true },
          ]}
          footer={
            <p>
              Já tem conta?{" "}
              <AppLink
                href={
                  safeCallback === "/"
                    ? "/login"
                    : `/login?callbackUrl=${encodeURIComponent(safeCallback)}`
                }
              >
                Entrar
              </AppLink>
            </p>
          }
        />
      </div>
    </AuthPageShell>
  );
}
