import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LightningGame } from "../lightning/lightning-game";
import { TwoFactorManager } from "../settings/two-factor-manager";
const mocks=vi.hoisted(()=>({submit:vi.fn(),enable:vi.fn()}));
vi.mock("@/app/actions/lightning",()=>({submitLightningAction:mocks.submit}));
vi.mock("@/services/lightning-challenge.service",()=>({LIGHTNING_TIME_LIMIT_SECONDS:60}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn(),push:vi.fn()})}));
vi.mock("@/app/actions/security",()=>({enableTwoFactorAction:mocks.enable,confirmTwoFactorAction:vi.fn(),disableTwoFactorAction:vi.fn()}));
const questions=[{id:"q1",statement:"Questão teste",imageUrl:null,subject:"Java",difficulty:1,alternatives:[{id:"a1",text:"Resposta A"},{id:"a2",text:"Resposta B"}]}];
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubGlobal("matchMedia",()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it("permite tentar novamente após falha de rede sem perder a resposta",async()=>{
 mocks.submit.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({success:false,error:"Tente mais tarde"});
 render(<LightningGame questions={questions}/>);
 fireEvent.click(screen.getByRole("button",{name:/Iniciar desafio/}));
 fireEvent.click(screen.getByRole("radio",{name:/Resposta A/}));
 fireEvent.click(screen.getByRole("button",{name:/Enviar \(1\/1\)/}));
 await screen.findByRole("button",{name:"Tentar enviar novamente"});
 expect(screen.getByRole("radio",{name:/Resposta A/})).toHaveAttribute("aria-checked","true");
 fireEvent.click(screen.getByRole("button",{name:"Tentar enviar novamente"}));
 await screen.findByText("Tente mais tarde");
 expect(mocks.submit).toHaveBeenCalledTimes(2);
});
it("tempo esgotado sem respostas não dispara uma sequência de envios",async()=>{
 vi.useFakeTimers();render(<LightningGame questions={questions} timeLimitSeconds={2}/>);
 fireEvent.click(screen.getByRole("button",{name:/Iniciar desafio/}));
 await act(async()=>{await vi.advanceTimersByTimeAsync(2500);});
 expect(screen.getByRole("button",{name:"Iniciar nova rodada"})).toBeInTheDocument();
 await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});
 expect(mocks.submit).not.toHaveBeenCalled();
});
it("destrava a ativação do 2FA quando a conexão falha",async()=>{
 mocks.enable.mockRejectedValue(new Error("offline"));render(<TwoFactorManager initialEnabled={false}/>);
 fireEvent.click(screen.getByRole("button",{name:"Ativar 2FA"}));
 await screen.findByRole("alert");
 expect(screen.getByRole("button",{name:"Ativar 2FA"})).toBeEnabled();
});
it("recalcula o relógio pelo tempo real após uma pausa da aba",async()=>{
 vi.useFakeTimers();mocks.submit.mockResolvedValue({success:false,error:"Sem conexão"});
 render(<LightningGame questions={questions} timeLimitSeconds={60}/>);
 fireEvent.click(screen.getByRole("button",{name:/Iniciar desafio/}));
 fireEvent.click(screen.getByRole("radio",{name:/Resposta A/}));
 vi.setSystemTime(Date.now()+65000);
 await act(async()=>{await vi.advanceTimersByTimeAsync(250);});
 expect(mocks.submit).toHaveBeenCalledWith([{questionId:"q1",alternativeId:"a1"}],60);
 expect(screen.getByRole("button",{name:"Tentar enviar novamente"})).toBeInTheDocument();
 await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});
 expect(mocks.submit).toHaveBeenCalledTimes(1);
});
