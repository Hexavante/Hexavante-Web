import { Clock3, ClipboardList, Crown, Target, Trophy } from "lucide-react";
import { ExamThumbnail } from "@/components/exams/exam-thumbnail";
import { Badge } from "@/components/ui/badge";
import { CardFooter, CardHeader, CardTitle, InteractiveCard } from "@/components/ui/card";
import { EXAM_TYPE_LABELS } from "@/lib/validations/exam";

type ExamCardProps = {
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  examType: string;
  questionCount: number;
  timeLimit?: number | null;
  userAttemptCount?: number;
  isPremiumOnly?: boolean;
};

const examBadgeVariant: Record<string, "blue" | "violet" | "teal"> = {
  ENEM: "blue",
  VESTIBULAR: "violet",
  TECNOLOGIA: "teal",
};

export function ExamCard({
  slug,
  title,
  description,
  coverImage,
  examType,
  questionCount,
  timeLimit,
  userAttemptCount,
  isPremiumOnly,
}: ExamCardProps) {
  return (
    <InteractiveCard
      href={`/simulados/${slug}`}
      className="overflow-hidden hover:border-teal-400/35"
      ariaLabel={`Ver simulado: ${title}. ${questionCount} questões${timeLimit ? `, ${timeLimit} minutos` : ""}`}
    >
      <ExamThumbnail
        url={coverImage}
        title={title}
        className="h-36 w-full transition group-hover:opacity-95"
      />
      <div className="p-5">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant={examBadgeVariant[examType] ?? "default"}>
              <Target className="h-3.5 w-3.5" />
              {EXAM_TYPE_LABELS[examType] ?? examType}
            </Badge>
            {isPremiumOnly && (
              <Badge variant="violet">
                <Crown className="h-3.5 w-3.5" />
                Premium
              </Badge>
            )}
            {questionCount >= 100 && (
              <Badge variant="amber">
                <Trophy className="h-3.5 w-3.5" />
                Conquista especial
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardTitle className="transition-colors group-hover:text-teal-200">{title}</CardTitle>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{description}</p>
        )}

        <CardFooter className="text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-teal-300" />
            {questionCount} questões
          </span>
          {timeLimit && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-sky-300" />
              {timeLimit} min
            </span>
          )}
          {userAttemptCount != null && userAttemptCount > 0 && (
            <span>
              {userAttemptCount} tentativa{userAttemptCount > 1 ? "s" : ""}
            </span>
          )}
        </CardFooter>
      </div>
    </InteractiveCard>
  );
}
