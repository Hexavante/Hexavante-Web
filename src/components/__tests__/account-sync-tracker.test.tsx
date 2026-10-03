/**
 * `AccountSyncTracker` — client component montado no root layout quando a
 * sessão atual ainda não está na lista multiconta `hx_accounts` (login OAuth).
 *
 * Verifica que a sincronização acontece uma única vez (guard contra o
 * double-invoke do StrictMode) e que uma falha da Server Action nunca derruba
 * a página.
 */
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AccountSyncTracker } from "@/components/auth/account-sync-tracker";

const { syncMock } = vi.hoisted(() => ({
  syncMock: vi.fn(),
}));

vi.mock("@/app/actions/security", () => ({
  syncCurrentAccountAction: syncMock,
}));

beforeEach(() => {
  syncMock.mockReset();
  syncMock.mockResolvedValue({ ok: true });
});

describe("AccountSyncTracker", () => {
  it("sincroniza uma única vez, mesmo em StrictMode, e não renderiza nada", () => {
    const { container } = render(
      <StrictMode>
        <AccountSyncTracker />
      </StrictMode>,
    );

    expect(syncMock).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("não propaga erro quando a Server Action rejeita", async () => {
    syncMock.mockRejectedValue(new Error("Server Action indisponível"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<AccountSyncTracker />);

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[account-sync]"), expect.any(Error)),
    );
    errorSpy.mockRestore();
  });
});
