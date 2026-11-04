import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AuthForm } from "../auth/auth-form";

it("mostra e oculta a senha de login sem apagar o texto ou enviar o formulário", () => {
  const action = vi.fn();
  render(<AuthForm formKind="login" embedded title="Entrar" subtitle="" submitLabel="Entrar"
    fields={[{name:"password", label:"Senha", type:"password"}]} action={action} />);
  const input = screen.getByLabelText("Senha");
  fireEvent.change(input, {target:{value:"exemplo123"}});
  fireEvent.click(screen.getByRole("button", {name:"Mostrar senha"}));
  expect(input).toHaveAttribute("type","text");
  fireEvent.click(screen.getByRole("button", {name:"Ocultar senha"}));
  expect(input).toHaveAttribute("type","password");
  expect(input).toHaveValue("exemplo123");
  expect(action).not.toHaveBeenCalled();
});
