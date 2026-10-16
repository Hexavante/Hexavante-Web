"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleCoursePublishAction,
  toggleExamPublishAction,
  type ActionResult,
} from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type CourseProps = {
  kind: "course";
  id: string;
  isPublished: boolean;
};

type ExamProps = {
  kind: "exam";
  id: string;
  isPublished: boolean;
};

type Props = CourseProps | ExamProps;

export function ContentPublishToggle(props: Props) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast(result.message ?? "Atualizado.", "success");
        router.refresh();
      } else if (result.error) {
        toast(result.error, "error");
      }
    });
  }

  const label = props.isPublished ? "Despublicar" : "Publicar";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="min-h-9"
      onClick={() =>
        run(() =>
          props.kind === "course"
            ? toggleCoursePublishAction(props.id)
            : toggleExamPublishAction(props.id),
        )
      }
    >
      {pending ? "..." : label}
    </Button>
  );
}
