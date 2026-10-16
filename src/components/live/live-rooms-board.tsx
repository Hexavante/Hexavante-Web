import { Radio, CalendarClock, History } from "lucide-react";
import { LiveRoomCard } from "@/components/live/live-room-card";
import type { LiveRoomListFilter } from "@/services/live-room.service";

type Room = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date;
  instructor: { fullName: string | null; username: string | null };
  course: { title: string } | null;
  _count: { participants: number };
};

type Props = {
  rooms: Room[];
  filter: LiveRoomListFilter;
};

function sortRooms(rooms: Room[]): Room[] {
  const rank: Record<string, number> = { LIVE: 0, SCHEDULED: 1, ENDED: 2, CANCELLED: 3 };
  return [...rooms].sort((a, b) => {
    const byStatus = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    if (byStatus !== 0) return byStatus;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });
}

function RoomGrid({ rooms }: { rooms: Room[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <LiveRoomCard
          key={room.id}
          id={room.id}
          title={room.title}
          description={room.description}
          status={room.status}
          scheduledAt={room.scheduledAt}
          instructorName={room.instructor.fullName || room.instructor.username}
          courseTitle={room.course?.title}
          participantCount={room._count.participants}
        />
      ))}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  rooms,
  featured,
}: {
  icon: typeof Radio;
  title: string;
  description: string;
  rooms: Room[];
  featured?: boolean;
}) {
  if (rooms.length === 0) return null;

  return (
    <section className={featured ? "mb-10" : "mb-8"}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
            featured
              ? "border-red-400/30 bg-red-500/10 text-red-300"
              : "hx-icon-box"
          }`}
        >
          <Icon className={`h-5 w-5 ${featured ? "hx-live-pulse" : ""}`} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <RoomGrid rooms={rooms} />
    </section>
  );
}

export function LiveRoomsBoard({ rooms, filter }: Props) {
  const sorted = sortRooms(rooms);

  if (filter !== "all") {
    return <RoomGrid rooms={sorted} />;
  }

  const live = sorted.filter((room) => room.status === "LIVE");
  const scheduled = sorted.filter((room) => room.status === "SCHEDULED");
  const ended = sorted.filter(
    (room) => room.status === "ENDED" || room.status === "CANCELLED",
  );

  return (
    <>
      <Section
        icon={Radio}
        title="Ao vivo agora"
        description="Entre nas transmissões que estão acontecendo neste momento."
        rooms={live}
        featured
      />
      <Section
        icon={CalendarClock}
        title="Próximas aulas"
        description="Salas agendadas — volte no horário ou ative lembretes."
        rooms={scheduled}
      />
      <Section
        icon={History}
        title="Encerradas"
        description="Transmissões finalizadas — assista gravações quando disponíveis."
        rooms={ended}
      />
    </>
  );
}

export function LiveRoomsStats({ rooms }: { rooms: Room[] }) {
  const live = rooms.filter((r) => r.status === "LIVE").length;
  const scheduled = rooms.filter((r) => r.status === "SCHEDULED").length;
  const totalParticipants = rooms.reduce((sum, r) => sum + r._count.participants, 0);

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="hx-surface-panel rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ao vivo</p>
        <p className="mt-1 text-2xl font-black text-white">{live}</p>
      </div>
      <div className="hx-surface-panel rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agendadas</p>
        <p className="mt-1 text-2xl font-black text-white">{scheduled}</p>
      </div>
      <div className="hx-surface-panel rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Participantes</p>
        <p className="mt-1 text-2xl font-black text-white">{totalParticipants}</p>
      </div>
    </div>
  );
}
