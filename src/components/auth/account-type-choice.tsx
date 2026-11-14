"use client";

import { useActionState, useEffect, useState } from "react";
import { GraduationCap, Loader2, UserRound } from "lucide-react";
import { chooseAccountTypeAction, type AccountType, type AccountTypeResult } from "@/app/actions/account-type";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Choice } from "./register-wizard";

const initialState: AccountTypeResult = { success: false };

export function AccountTypeChoice({ firstName, next }: { firstName: string; next: string }) {
  const [accountType, setAccountType] = useState<AccountType>("STUDENT");
  const [state, formAction, pending] = useActionState(chooseAccountTypeAction, initialState);

  useEffect(() => {
    if (state.success && state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.success, state.redirectTo]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">Conta criada</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Bem-vindo, {firstName}!</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Como você vai usar a Hexavante? Dá para pedir para ser instrutor depois, se mudar de ideia.
        </p>
      </div>

      <input type="hidden" name="accountType" value={accountType} />
      <input type="hidden" name="next" value={next} />

      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Tipo de conta">
        <Choice
          active={accountType === "STUDENT"}
          icon={UserRound}
          title="Quero aprender"
          description="Estudar e acompanhar meu progresso"
          onClick={() => setAccountType("STUDENT")}
        />
        <Choice
          active={accountType === "INSTRUCTOR"}
          icon={GraduationCap}
          title="Quero ensinar"
          description="Publicar conteúdos e criar trilhas"
          onClick={() => setAccountType("INSTRUCTOR")}
        />
      </div>

      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <Button type="submit" className="h-11 w-full" disabled={pending || state.success}>
        {pending || state.success ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Continuar"}
      </Button>
    </form>
  );
}
