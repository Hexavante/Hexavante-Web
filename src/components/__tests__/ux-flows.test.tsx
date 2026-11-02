import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VideoUploadInput } from "../tutorials/video-upload-input";
import { SearchBar } from "../layout/search-bar";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("permite digitar e corrigir o endereço completo do vídeo", () => {
  const { container } = render(<VideoUploadInput />);
  const field = screen.getByLabelText("URL do vídeo");
  fireEvent.change(field, { target: { value: "h" } });
  expect(screen.getByLabelText("URL do vídeo")).toBe(field);
  fireEvent.change(field, { target: { value: "https://vimeo.com/123456" } });
  expect(container.querySelector('input[name="videoUrl"]')).toHaveValue("https://vimeo.com/123456");
  fireEvent.click(screen.getByRole("button", { name: "Limpar URL do vídeo" }));
  expect(field).toHaveValue("");
});
it("Enter pesquisa o texto atual e Escape fecha as sugestões", () => {
  const { container } = render(<SearchBar />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Java básico" } });
  expect(screen.getByText("Buscando...")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
  expect(screen.queryByText("Buscando...")).not.toBeInTheDocument();
  fireEvent.submit(container.querySelector("form")!);
  expect(push).toHaveBeenCalledWith("/courses?q=Java%20b%C3%A1sico");
});
