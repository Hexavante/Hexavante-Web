import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { getMyDevices, revokeDeviceAction } from "../security";
vi.mock("next/headers",()=>({cookies:async()=>({getAll:()=>[{name:"hexavante.session_token",value:"test-token"}]})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
vi.mock("@/lib/auth-session",()=>({getApiUrl:()=>"https://api.example.test"}));
vi.mock("@/lib/account-switcher",()=>({}));
vi.mock("@/lib/client-device",()=>({getClientDevice:async()=>({deviceUa:"Browser",deviceIp:"127.0.0.1"})}));
beforeEach(()=>vi.stubGlobal("fetch",vi.fn()));
afterEach(()=>vi.unstubAllGlobals());
it("distingue indisponibilidade de uma lista vazia",async()=>{
 vi.mocked(fetch).mockResolvedValue({ok:false} as Response);
 expect((await getMyDevices()).error).toBeTruthy();
});
it("adapta a sessão e não lista dispositivos revogados",async()=>{
 vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({devices:[{id:"a",revoked:false},{id:"b",revoked:true}]})} as Response);
 expect((await getMyDevices()).devices.map(d=>d.id)).toEqual(["a"]);
 expect(fetch).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({headers:{cookie:"__Secure-hexavante.session_token=test-token"}}));
});
it("envia JSON com o navegador real ao desconectar",async()=>{
 vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({currentRevoked:false})} as Response);
 expect(await revokeDeviceAction("device-1")).toEqual({ok:true});
 expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/devices/device-1"),expect.objectContaining({method:"DELETE",body:JSON.stringify({deviceUa:"Browser",deviceIp:"127.0.0.1"})}));
});
