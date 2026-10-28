import { loadNotebookAction } from "@/app/actions/notebook";
import { CourseNotebook } from "@/components/notebook/course-notebook";
export default async function NotebookPage() {
  return <CourseNotebook initial={await loadNotebookAction()} />;
}
