"use client";

import { useActionState } from "react";
import { updateLiveRoomAction, type ActionResult } from "@/app/actions/live-room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocalDateTimeField } from "@/components/ui/local-datetime-field";

type Room = {
  id: string;
  title: string;
  description?: string | null;
  courseId?: string | null;
  videoUrl?: string | null;
  videoProvider?: string | null;
  scheduledAt: Date;
  maxParticipants?: number | null;
};

type Props = {
  room: Room;
  courses: { id: string; title: string }[];
};

const initialState: ActionResult = { success: false };

export function EditLiveRoomForm({ room, courses }: Props) {
  const [state, formAction, pending] = useActionState(
    updateLiveRoomAction.bind(null, room.id),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={room.title} required />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={room.description ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="courseId">Curso</Label>
        <NativeSelect id="courseId" name="courseId" defaultValue={room.courseId ?? ""}>
          <option value="">Nenhum</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="videoUrl">URL do vídeo</Label>
          <Input id="videoUrl" name="videoUrl" defaultValue={room.videoUrl ?? ""} />
        </div>
        <div>
          <Label htmlFor="videoProvider">Provedor</Label>
          <NativeSelect
            id="videoProvider"
            name="videoProvider"
            defaultValue={room.videoProvider ?? "youtube"}
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="other">Outro</option>
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="scheduledAt">Data e hora</Label>
          <LocalDateTimeField
            id="scheduledAt"
            name="scheduledAt"
            initialIso={new Date(room.scheduledAt).toISOString()}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxParticipants">Limite de participantes</Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min={1}
            max={1000}
            defaultValue={room.maxParticipants ? String(room.maxParticipants) : ""}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400">Sala atualizada!</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
