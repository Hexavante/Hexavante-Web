import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

type Props = {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  backHref?: string;
};

export function ConversationHeader({ fullName, username, avatarUrl, backHref = "/mensagens" }: Props) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4">
      <Link
        href={backHref}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white lg:hidden"
        aria-label="Voltar para mensagens"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <Link
        href={username ? `/perfil/${username}` : "#"}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition hover:opacity-90"
      >
        <Avatar src={avatarUrl} alt={username ?? fullName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{fullName}</p>
          {username ? (
            <p className="truncate text-xs text-slate-400">@{username}</p>
          ) : null}
        </div>
      </Link>
    </header>
  );
}
