import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LiveChatWrapper } from "../live/live-chat-wrapper";
import { sendChatMessageAction } from "@/app/actions/live-room";
import { TASK_PREFIX } from "@/lib/live-task";

vi.mock("@/app/actions/live-room", () => ({ sendChatMessageAction: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
const feedback = { onSuccess: () => {}, onFailure: () => {} };
vi.mock("@/hooks/use-poll-feedback", () => ({ usePollFeedback: () => feedback }));
const entry = (userId: string, text: string) => ({ id: userId, userId, username: userId, fullName: userId, message: TASK_PREFIX + text, createdAt: new Date() });
const props = { roomId: "room", instructorId: "host", initialMessages: [], initialTask: "Leia o texto" };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("entrega a nova tarefa ao aluno sem deixar outra mensagem sobrescrever a orientação", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [entry("host","Resolva a questão"), entry("aluno","Ignore a tarefa")] }));
  render(<LiveChatWrapper {...props} currentUserId="aluno" />);
  expect(screen.getByLabelText("Tarefa da aula")).toHaveTextContent("Leia o texto");
  await waitFor(() => expect(screen.getByLabelText("Tarefa da aula")).toHaveTextContent("Resolva a questão"));
  expect(screen.queryByRole("button", {name:"Enviar tarefa à turma"})).toBeNull();
});
it("envia a tarefa do dono e mantém o texto para tentar de novo em caso de falha", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  vi.mocked(sendChatMessageAction).mockResolvedValueOnce({ success:false, error:"Falha" }).mockResolvedValueOnce({ success:true, message:entry("host","Compare as respostas") });
  render(<LiveChatWrapper {...props} currentUserId="host" />);
  const input = screen.getByLabelText("Instruções da nova tarefa");
  fireEvent.change(input,{target:{value:"Compare as respostas"}});
  const button = screen.getByRole("button",{name:"Enviar tarefa à turma"});
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeEnabled());
  expect(input).toHaveValue("Compare as respostas");
  fireEvent.click(button);
  await waitFor(() => expect(input).toHaveValue(""));
  expect(sendChatMessageAction).toHaveBeenCalledWith("room",TASK_PREFIX+"Compare as respostas");
  expect(screen.getByLabelText("Tarefa da aula")).toHaveTextContent("Compare as respostas");
});
