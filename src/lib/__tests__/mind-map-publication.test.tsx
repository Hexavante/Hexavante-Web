import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { lessonContent, splitMindMap } from "../mind-map";
import { MindMapField } from "@/components/courses/mind-map-field";
import { MindMap } from "@/components/courses/visual-learning-viewer";
import { canPublishTutorialVideo } from "../video";

describe("mapa mental", () => {
  it("leva os ramos da prévia até a leitura e permite removê-los", () => {
    const editor = render(<form><input name="description" value="Estude Java." readOnly /><MindMapField /></form>);
    fireEvent.change(screen.getByRole("textbox", {name: /Mapa mental/}), {target: {value: "Tipos: números e texto\nClasses"}});
    const form = new FormData(editor.container.querySelector("form")!);
    const saved = splitMindMap(lessonContent(form));
    expect(saved.description).toBe("Estude Java.");
    editor.unmount();
    render(<MindMap title="Java" topics={saved.topics} />);
    fireEvent.click(screen.getByText("Tipos"));
    expect(screen.getByText("números e texto").closest("details")).toHaveAttribute("open");
    form.set("mindMap", "");
    expect(lessonContent(form)).toBe("Estude Java.");
  });
  it("preserva descrições antigas", () => {
    expect(splitMindMap("Aula\n## Um título antigo")).toEqual({description:"Aula\n## Um título antigo", topics:[]});
  });
});
it("valida links que o player suporta para publicação", () => {
  for (const url of ["", "texto", "https://youtube.com/", "https://site.example/aula", "javascript:alert(1)"]) expect(canPublishTutorialVideo(url)).toBe(false);
  for (const url of ["https://youtu.be/aqz-KE-bpKQ", "https://vimeo.com/1234567","/uploads/aula.webm","https://cdn.example/aula.mp4?token=abc"]) expect(canPublishTutorialVideo(url)).toBe(true);
});
