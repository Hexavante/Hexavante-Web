import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TwoFactorManager } from "../settings/two-factor-manager";
const mocks=vi.hoisted(()=>({enable:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn(),push:vi.fn()})}));
vi.mock("@/app/actions/security",()=>({enableTwoFactorAction:mocks.enable,confirmTwoFactorAction:vi.fn(),disableTwoFactorAction:vi.fn()}));
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubGlobal("matchMedia",()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it("destrava a ativação do 2FA quando a conexão falha",async()=>{
 mocks.enable.mockRejectedValue(new Error("offline"));render(<TwoFactorManager initialEnabled={false}/>);
 fireEvent.click(screen.getByRole("button",{name:"Ativar 2FA"}));
 await screen.findByRole("alert");
 expect(screen.getByRole("button",{name:"Ativar 2FA"})).toBeEnabled();
});
