import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { addMaterialAction } = vi.hoisted(() => ({
  addMaterialAction: vi.fn(),
}));
vi.mock("@/app/actions/course", () => ({ addMaterialAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

import { MaterialForm } from "../courses/material-form";

// O jsdom guarda os arquivos do input em um FileList interno que só o
// `new FormData(form)` enxerga; a propriedade pública `input.files` recebe a
// lista que o teste injeta, mas o FormData nativo ignora e manda um
// placeholder vazio. Esta subclasse devolve o arquivo real do input e
// acompanha os `delete` do componente (o entry do placeholder some da
// instância nativa, mas a leitura via get precisa refletir isso).
const NativeFormData = globalThis.FormData;
class FormDataComArquivo extends NativeFormData {
  private form?: HTMLFormElement;
  private removidos = new Set<string>();
  constructor(form?: HTMLFormElement) {
    super(form);
    this.form = form;
  }
  get(name: string): FormDataEntryValue | null {
    if (this.removidos.has(name)) return null;
    if (name === "file" && this.form) {
      const input = this.form.querySelector<HTMLInputElement>('input[name="file"]');
      const file = input?.files?.[0];
      if (file) return file;
    }
    return super.get(name);
  }
  delete(name: string): void {
    this.removidos.add(name);
    super.delete(name);
  }
  set(name: string, value: string | Blob, fileName?: string): void {
    this.removidos.delete(name);
    if (fileName === undefined) super.set(name, value);
    else super.set(name, value, fileName);
  }
}

const uploadedUrl =
  "/uploads/courses/materials/00000000-0000-4000-8000-000000000000.pdf";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { configurable: true, value: files });
  fireEvent.change(input);
}

beforeEach(() => vi.stubGlobal("FormData", FormDataComArquivo));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("envia um link quando o modo url esta ativo", async () => {
  addMaterialAction.mockResolvedValue({ success: true });
  render(<MaterialForm courseId="course-1" moduleId="module-1" />);
  fireEvent.click(screen.getByRole("button", { name: "Usar link" }));
  fireEvent.change(screen.getByLabelText("Título do material"), {
    target: { value: "Apostila da aula" },
  });
  fireEvent.change(screen.getByLabelText("URL do PDF"), {
    target: { value: "https://example.com/apostila.pdf" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar material" }));

  await waitFor(() => expect(addMaterialAction).toHaveBeenCalledTimes(1));
  const [courseId, moduleId, , data] = addMaterialAction.mock.calls[0];
  expect(courseId).toBe("course-1");
  expect(moduleId).toBe("module-1");
  expect(data.get("fileUrl")).toBe("https://example.com/apostila.pdf");
  expect(data.get("fileType")).toBe("pdf");
  expect(data.get("file")).toBeNull();
});

it("envia o pdf e usa a url devolvida pelo servidor", async () => {
  addMaterialAction.mockResolvedValue({ success: true });
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ url: uploadedUrl }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaterialForm courseId="course-1" moduleId="module-1" />);
  const input = screen.getByLabelText(/Arquivo PDF/) as HTMLInputElement;
  setInputFiles(input, [
    new File(["%PDF-1.4"], "apostila.pdf", { type: "application/pdf" }),
  ]);
  fireEvent.change(screen.getByLabelText("Título do material"), {
    target: { value: "Apostila da aula" },
  });
  fireEvent.submit(input.closest("form")!);

  await waitFor(() => expect(addMaterialAction).toHaveBeenCalledTimes(1));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/upload/course-material");
  expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData);
  const data = addMaterialAction.mock.calls[0][3];
  expect(data.get("fileUrl")).toBe(uploadedUrl);
  expect(data.get("fileType")).toBe("pdf");
  expect(data.get("file")).toBeNull();
  expect(await screen.findByText(/Material PDF adicionado ao m/)).toBeInTheDocument();
});

it("recusa arquivo que nao e pdf e pdf acima de 5 MB sem tocar o servidor", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<MaterialForm courseId="course-1" moduleId="module-1" />);
  const input = screen.getByLabelText(/Arquivo PDF/) as HTMLInputElement;
  const form = input.closest("form")!;
  fireEvent.change(screen.getByLabelText("Título do material"), {
    target: { value: "Apostila da aula" },
  });

  setInputFiles(input, [new File(["conteudo"], "nota.txt", { type: "text/plain" })]);
  fireEvent.submit(form);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/\.pdf/);

  setInputFiles(input, [
    new File([new Uint8Array(6 * 1024 * 1024)], "grande.pdf", {
      type: "application/pdf",
    }),
  ]);
  fireEvent.submit(form);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(/5 MB/),
  );

  expect(fetchMock).not.toHaveBeenCalled();
  expect(addMaterialAction).not.toHaveBeenCalled();
});
