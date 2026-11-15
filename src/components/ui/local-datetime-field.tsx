"use client";

import { useState } from "react";
import { ClientOnly } from "@/components/ui/client-only";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  /** Nome do campo enviado ao servidor (vai em ISO, com fuso). */
  name: string;
  /** Data inicial em ISO. Sem ela, começa daqui a 1 hora. */
  initialIso?: string;
  required?: boolean;
};

/** "2026-11-14T20:30" no horário do navegador, formato do <input type="datetime-local">. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Campo de data e hora que respeita o fuso de quem digita.
 *
 * O <input type="datetime-local"> manda a hora "crua", sem fuso, e o servidor
 * (em UTC) entendia 20:00 como 20:00 UTC, ou seja, 17:00 em Brasília. Aqui a
 * pessoa vê e digita no horário dela, e o servidor recebe o instante exato.
 */
export function LocalDateTimeField(props: Props) {
  // Só no navegador: o servidor não sabe o fuso de quem está vendo a página.
  return (
    <ClientOnly fallback={<Input id={props.id} type="datetime-local" disabled />}>
      <LocalDateTimeInput {...props} />
    </ClientOnly>
  );
}

function LocalDateTimeInput({ id, name, initialIso, required }: Props) {
  const [local, setLocal] = useState(() =>
    toLocalInputValue(initialIso ? new Date(initialIso) : new Date(Date.now() + 60 * 60 * 1000)),
  );

  const parsed = local ? new Date(local) : null;
  const iso = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "";

  return (
    <>
      <Input
        id={id}
        type="datetime-local"
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        required={required}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}
