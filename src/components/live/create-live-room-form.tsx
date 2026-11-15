"use client";

import { useActionState } from "react";
import { CalendarClock, Link2, Radio, Users } from "lucide-react";
import { createLiveRoomAction, type ActionResult } from "@/app/actions/live-room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppLink } from "@/components/ui/app-link";
import { LocalDateTimeField } from "@/components/ui/local-datetime-field";

type Props = {
  courses: { id: string; title: string }[];
};

const initialState: ActionResult = { success: false };

export function CreateLiveRoomForm({ courses }: Props) {
  const [state, formAction, pending] = useActionState(createLiveRoomAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex items-center gap-2">
          <Radio className="h-5 w-5 text-teal-300" />
          <h2 className="font-bold text-white">Informações da aula</h2>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="title">Título da sala</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Aula de matemática - funções"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Resumo do conteúdo, objetivo da aula ou materiais necessários."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="courseId">Curso relacionado</Label>
            <NativeSelect id="courseId" name="courseId" defaultValue="">
              <option value="">Nenhum (sala independente)</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </NativeSelect>
            <p className="mt-1 text-xs text-slate-500">
              Apenas cursos aprovados que você ministra.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-sky-300" />
            <h2 className="font-bold text-white">Vídeo</h2>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="videoUrl">URL do vídeo</Label>
              <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/watch?v=..." />
              <p className="mt-1 text-xs text-slate-500">
                Pode deixar em branco agora e colar o link da transmissão quando ela começar.
              </p>
            </div>

            <div>
              <Label htmlFor="videoProvider">Provedor</Label>
              <NativeSelect id="videoProvider" name="videoProvider" defaultValue="youtube">
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="other">Outro</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-300" />
            <h2 className="font-bold text-white">Agenda e capacidade</h2>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="scheduledAt">Data e hora da transmissão</Label>
              <LocalDateTimeField id="scheduledAt" name="scheduledAt" required />
              <p className="mt-1 text-xs text-slate-500">No seu horário local.</p>
            </div>

            <div>
              <Label htmlFor="maxParticipants" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-300" />
                Limite de participantes
              </Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={1}
                max={1000}
                placeholder="Vazio para sem limite"
              />
            </div>
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <AppLink
          href="/instructor/live-rooms"
          muted
          className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2"
        >
          Cancelar
        </AppLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar sala ao vivo"}
        </Button>
      </div>
    </form>
  );
}
