import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { TutorialWatch } from "@/components/tutorials/tutorial-watch";
import { getTutorial, incrementTutorialViews } from "@/services/tutorial.service";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TutorialDetailPage({ params }: Props) {
  const { slug } = await params;
  const tutorial = await getTutorial(slug, true);
  if (!tutorial) notFound();

  await incrementTutorialViews(tutorial.id);

  return (
    <PageShell>
      <TutorialWatch tutorial={tutorial} />
    </PageShell>
  );
}
