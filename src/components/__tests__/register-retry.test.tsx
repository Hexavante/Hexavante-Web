import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RegisterWizard } from "../auth/register-wizard";

it("preserva o cadastro e volta ao campo de perfil rejeitado", async () => {
  const action = vi.fn().mockResolvedValue({
    success: false, error: "Corrija os campos destacados.", fieldErrors: { username: "Nome de usuário já utilizado" },
  });
  const { container } = render(<RegisterWizard action={action} callbackUrl="/app" />);
  const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), {target:{value}});
  fill("Nome de usuário", "aluno_teste");
  fill("Nome completo", "Aluno Teste");
  fill("E-mail", "teste@example.com");
  fill("Data de nascimento", "2000-01-01");
  fireEvent.click(screen.getByRole("button", {name:/Continuar|Próxim/}));
  fireEvent.click(screen.getByRole("button", {name:/Continuar|Próxim/}));
  fill("Crie uma senha", "exemplo123");
  fill("Confirme sua senha", "exemplo123");
  fireEvent.click(screen.getByRole("button", {name:"Mostrar senha"}));
  expect(screen.getByLabelText("Crie uma senha")).toHaveAttribute("type","text");
  expect(screen.getByLabelText("Confirme sua senha")).toHaveAttribute("type","password");
  fireEvent.click(screen.getByRole("button", {name:"Ocultar senha"}));
  fireEvent.click(screen.getByRole("button", {name:"Mostrar confirmação da senha"}));
  expect(screen.getByLabelText("Confirme sua senha")).toHaveAttribute("type","text");
  expect(action).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.submit(container.querySelector("form")!);
  await screen.findByText(/já utilizado/);
  expect(screen.getByLabelText("Nome de usuário")).toHaveValue("aluno_teste");
  expect(screen.getByText("Seu perfil")).toBeInTheDocument();
  expect(screen.getByLabelText("E-mail")).toHaveValue("teste@example.com");
});
