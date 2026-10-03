/**
 * `TutorialVideoModal` — modal que substituiu o tour passo-a-passo.
 *
 * Regressões cobertas:
 *  - renderiza os dois botões (Pular / Assistir e ganhar 100 moedas);
 *  - "Pular" chama completeOnboardingTourAction e fecha, SEM resgatar moedas;
 *  - `onEnded` do vídeo dispara o claim da recompensa (e só ele);
 *  - sem fonte de vídeo → fallback "Vídeo em breve", Pular segue útil e
 *    "Assistir" fica desabilitado (recompensa exige assistir até o fim).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TutorialVideoModal } from "@/components/onboarding/tutorial-video-modal";

const { claimMock, completeMock } = vi.hoisted(() => ({
  claimMock: vi.fn(),
  completeMock: vi.fn(),
}));

vi.mock("@/app/actions/onboarding", () => ({
  claimTutorialVideoRewardAction: claimMock,
  completeOnboardingTourAction: completeMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  claimMock.mockResolvedValue({ success: true, amount: 100 });
  completeMock.mockResolvedValue({ success: true });
  // jsdom não implementa play()
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
});

describe("TutorialVideoModal", () => {
  it("renderiza o diálogo com os dois botões", () => {
    render(<TutorialVideoModal show />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pular tutorial/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /assistir e ganhar 100 moedas/i }),
    ).toBeInTheDocument();
  });

  it("não renderiza nada quando show=false", () => {
    render(<TutorialVideoModal show={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("'Pular tutorial' completa o onboarding e fecha, sem resgatar moedas", async () => {
    render(<TutorialVideoModal show />);

    fireEvent.click(screen.getByRole("button", { name: /pular tutorial/i }));

    await waitFor(() => expect(completeMock).toHaveBeenCalledTimes(1));
    expect(claimMock).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("o fim do vídeo dispara o claim da recompensa e completa o onboarding", async () => {
    render(<TutorialVideoModal show />);

    fireEvent(screen.getByTestId("tutorial-video"), new Event("ended"));

    await waitFor(() => expect(claimMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(completeMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/\+100 moedas/i)).toBeInTheDocument();
  });

  it("sem fonte de vídeo mostra o fallback e desabilita 'Assistir'", async () => {
    vi.stubEnv("NEXT_PUBLIC_TUTORIAL_VIDEO_URL", "");
    vi.resetModules();
    const fresh = await import("@/components/onboarding/tutorial-video-modal");

    render(<fresh.TutorialVideoModal show />);

    expect(screen.getByText(/vídeo em breve/i)).toBeInTheDocument();
    expect(screen.queryByTestId("tutorial-video")).not.toBeInTheDocument();

    const assistButton = screen.getByRole("button", { name: /assistir e ganhar 100 moedas/i });
    expect(assistButton).toBeDisabled();

    // sem vídeo não há "assistir": nunca resgata moedas
    fireEvent.click(assistButton);
    expect(claimMock).not.toHaveBeenCalled();

    // o Pular continua funcional
    fireEvent.click(screen.getByRole("button", { name: /pular tutorial/i }));
    await waitFor(() => expect(completeMock).toHaveBeenCalledTimes(1));

    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("erro do <video> (arquivo inexistente) também cai no fallback", async () => {
    render(<TutorialVideoModal show />);

    fireEvent.error(screen.getByTestId("tutorial-video"));

    expect(await screen.findByText(/vídeo em breve/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /assistir e ganhar 100 moedas/i }),
    ).toBeDisabled();
  });
});
