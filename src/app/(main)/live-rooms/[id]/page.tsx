import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CircleAlert,
  Pencil,
  PlayCircle,
  Radio,
  Square,
  Users,
  Video,
} from "lucide-react";
import { auth } from "@/auth";
import { endLiveRoomAction, startLiveRoomAction } from "@/app/actions/live-room";
import { LiveChatWrapper } from "@/components/live/live-chat-wrapper";
import { LiveRoomCountdown } from "@/components/live/live-room-countdown";
import { LinkButton, Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVideoEmbedUrl } from "@/lib/video";
import { LIVE_ROOM_STATUS_LABELS } from "@/lib/validations/live-room";
import { readLiveTask } from "@/lib/live-task";
import { getLatestLiveTask, getLiveChatMessages, getLiveRoom, joinLiveRoom } from "@/services/live-room.service";

export default async function LiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=/live-rooms/${id}`);

  const room = await getLiveRoom(id);
  if (!room) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card padding="lg">
          <CircleAlert className="h-8 w-8 text-amber-200" />
          <h1 className="mt-4 text-3xl font-black text-white">Sala não encontrada</h1>
          <p className="mt-3 text-slate-300">Esta sala ao vivo não existe ou foi removida.</p>
          <LinkButton href="/live-rooms" className="mt-6">
            <ArrowLeft className="h-4 w-4" />
            Voltar para salas ao vivo
          </LinkButton>
        </Card>
      </div>
    );
  }

  const isParticipant = room.participants.some((p) => p.userId === session.user!.id && !p.leftAt);

  if (!isParticipant && room.status === "LIVE") {
    try {
      await joinLiveRoom(id, session.user.id);
    } catch (error) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card padding="lg" className="border-red-400/20 bg-red-500/10">
            <CircleAlert className="h-8 w-8 text-red-200" />
            <h1 className="mt-4 text-3xl font-black text-white">Não foi possível entrar</h1>
            <p className="mt-3 text-red-100">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
            <LinkButton href="/live-rooms" className="mt-6">
              <ArrowLeft className="h-4 w-4" />
              Voltar para salas ao vivo
            </LinkButton>
          </Card>
        </div>
      );
    }
  }

  const [messages, latestTask] = await Promise.all([getLiveChatMessages(id), getLatestLiveTask(id, room.instructorId)]);
  const embedUrl = room.videoUrl ? getVideoEmbedUrl(room.videoUrl, room.videoProvider) : null;

  const isLive = room.status === "LIVE";
  const isScheduled = room.status === "SCHEDULED";
  const isEnded = room.status === "ENDED" || room.status === "CANCELLED";
  const isInstructor = room.instructorId === session.user.id;
  const activeParticipants = room.participants.filter((p) => !p.leftAt);
  const scheduledAt = new Date(room.scheduledAt);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/live-rooms"
            className="hx-accent-link inline-flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Salas ao vivo
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white">{room.title}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isLive
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : isScheduled
                    ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                    : "border-white/10 bg-white/[0.05] text-slate-300"
              }`}
            >
              {isLive ? (
                <Radio className="h-3.5 w-3.5" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" />
              )}
              {LIVE_ROOM_STATUS_LABELS[room.status] || room.status}
            </span>
            {isScheduled && (
              <LiveRoomCountdown
                scheduledAt={room.scheduledAt.toISOString()}
                status={room.status}
              />
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {room.instructor.fullName || room.instructor.username}
            {room.course ? ` · ${room.course.title}` : ""}
          </p>
        </div>

        {isInstructor && (
          <div className="flex flex-wrap gap-3">
            {isScheduled && (
              <>
                <LinkButton href={`/instructor/live-rooms/${id}/edit`} variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Editar sala
                </LinkButton>
                <form action={startLiveRoomAction.bind(null, id)}>
                  <Button type="submit">
                    <PlayCircle className="h-4 w-4" />
                    Iniciar transmissão
                  </Button>
                </form>
              </>
            )}
            {isLive && (
              <form action={endLiveRoomAction.bind(null, id)}>
                <Button type="submit" variant="danger">
                  <Square className="h-4 w-4" />
                  Encerrar transmissão
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {isScheduled && (
        <Card padding="md" className="mb-6 border-[hsl(var(--sidebar-highlight)/0.25)] bg-[hsl(var(--sidebar-highlight)/0.08)]">
          <p className="text-sm text-[hsl(var(--sidebar-foreground)/0.9)]">
            Esta aula está agendada para{" "}
            <strong>
              {scheduledAt.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}
            </strong>
            . O chat será liberado quando o instrutor iniciar a transmissão.
          </p>
        </Card>
      )}

      {isEnded && (
        <Card padding="md" className="mb-6">
          <p className="text-sm text-slate-300">
            Esta transmissão foi encerrada
            {room.endedAt
              ? ` em ${new Date(room.endedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
              : ""}
            .
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--sidebar-border))] bg-black shadow-2xl shadow-black/30">
            <div className="aspect-video">
              {embedUrl && (isLive || isEnded) ? (
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={room.title}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-slate-950 px-6 text-center">
                  <Video className="h-12 w-12 text-slate-600" />
                  <p className="mt-4 text-lg font-bold text-white">
                    {isLive
                      ? "Vídeo não configurado"
                      : isScheduled
                        ? "Aguardando início"
                        : "Aula encerrada"}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    {isScheduled
                      ? scheduledAt.toLocaleString("pt-BR", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : isLive
                        ? "Adicione uma URL do YouTube ou Vimeo para exibir a transmissão."
                        : "O vídeo não está mais disponível nesta sala."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card padding="sm">
              <div className="flex items-center gap-2 text-slate-400">
                <CalendarClock className="hx-accent-soft h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Horário</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {scheduledAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às{" "}
                {scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="hx-accent-soft h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Participantes</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {activeParticipants.length}
                {room.maxParticipants ? ` / ${room.maxParticipants}` : ""} online
              </p>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="hx-accent-soft h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Curso</span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-white">
                {room.course?.title ?? "Sala independente"}
              </p>
            </Card>
          </div>

          {room.description && (
            <Card padding="md">
              <h2 className="font-bold text-white">Sobre esta aula</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{room.description}</p>
            </Card>
          )}
        </div>

        <div className="h-[calc(100vh-8rem)] min-h-[520px] lg:sticky lg:top-24">
          <LiveChatWrapper
            roomId={id}
            currentUserId={session.user.id}
            instructorId={room.instructorId}
            initialTask={latestTask ? readLiveTask(latestTask, room.instructorId) : null}
            initialMessages={messages.map((msg) => ({
              id: msg.id,
              userId: msg.userId,
              username: msg.user.username,
              fullName: msg.user.fullName,
              message: msg.message,
              createdAt: new Date(msg.createdAt),
            }))}
            disabled={!isLive}
          />
        </div>
      </div>
    </div>
  );
}
