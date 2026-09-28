import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-white">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="mb-6 text-6xl">🔍</div>
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-3 text-sm text-slate-400">
          O endereço que você procura não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            Voltar ao início
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
