import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm } from "../auth/auth-form";
import { SearchBar } from "../layout/search-bar";
import { CourseFilters } from "../courses/course-filters";
import { TutorialFilters } from "../tutorials/tutorial-filters";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("mantém os dados após falha no login", async () => {
  const action = vi.fn().mockResolvedValue({ success: false, error: "Credenciais inválidas" });
  const { container } = render(<AuthForm title="Entrar" subtitle="" submitLabel="Entrar" formKind="login" action={action} fields={[{name:"email", label:"E-mail", type:"email"},{name:"password",label:"Senha",type:"password"}]} />);
  fireEvent.change(screen.getByLabelText("E-mail"), {target:{value:"teste@example.com"}});
  fireEvent.change(screen.getByLabelText("Senha", {exact:true}), {target:{value:"senha-de-teste"}});
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByText("Credenciais inválidas");
  expect(screen.getByLabelText("E-mail")).toHaveValue("teste@example.com");
  expect(screen.getByLabelText("Senha", {exact:true})).toHaveValue("senha-de-teste");
});
it("resposta atrasada não reabre sugestões fechadas", async () => {
  let resolve!: (value: unknown) => void;
  const fetchMock = vi.fn(() => new Promise(r => {resolve=r;}));
  vi.stubGlobal("fetch",fetchMock);
  render(<SearchBar />);
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:"Java"}});
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  fireEvent.keyDown(screen.getByRole("searchbox"), {key:"Escape"});
  resolve({ok:true,json:async()=>({results:[{title:"Java inicial",href:"/courses/java",type:"curso"}]})});
  await waitFor(() => expect(screen.queryByText("Buscando...")).not.toBeInTheDocument());
  fireEvent.focus(screen.getByRole("searchbox"));
  await screen.findByText("Java inicial");
  fireEvent.keyDown(screen.getByRole("searchbox"), {key:"Escape"});
  expect(screen.queryByText("Java inicial")).not.toBeInTheDocument();
});
it("oferece uma saída que remove todos os filtros", () => {
  render(<><CourseFilters categories={[]} current={{q:"Java", level:"BEGINNER"}}/><TutorialFilters categories={[]} current={{category:"enem"}}/></>);
  expect(screen.getAllByRole("link",{name:"Limpar filtros"}).map(link=>link.getAttribute("href"))).toEqual(["/courses","/tutorials"]);
});
