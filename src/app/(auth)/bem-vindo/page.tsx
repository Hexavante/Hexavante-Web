import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AccountTypeChoice } from "@/components/auth/account-type-choice";
import { isAccountTypePending } from "@/app/actions/account-type";
import { getApiSession } from "@/lib/auth-session";
import { getSafeCallbackUrl } from "@/lib/auth-routes";

type Props = { searchParams: Promise<{ next?: string }> };

/** 1º login com Google/Discord: a pessoa escolhe se vai aprender ou ensinar. */
export default async function BemVindoPage({ searchParams }: Props) {
  const next = getSafeCallbackUrl((await searchParams).next);
  const session = await getApiSession();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(next)}`);
  // Conta antiga ou escolha já feita: nada a perguntar.
  if (!(await isAccountTypePending())) redirect(next);

  const firstName = session.user.name.split(" ")[0] || session.user.name;
  return (
    <AuthPageShell variant="register">
      <AccountTypeChoice firstName={firstName} next={next} />
    </AuthPageShell>
  );
}
