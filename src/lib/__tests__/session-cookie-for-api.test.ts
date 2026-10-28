import { describe, expect, it } from "vitest";
import { sessionCookieForApi } from "../session-cookie-for-api";
describe("cookie de sessão enviado à API", () => {
 it("adapta localhost sem alterar outros cookies", () => expect(sessionCookieForApi("locale=pt; hexavante.session_token=teste")).toBe("locale=pt; __Secure-hexavante.session_token=teste"));
 it("preserva a sessão segura quando ambas existem", () => expect(sessionCookieForApi("hexavante.session_token=local; __Secure-hexavante.session_token=seguro")).toBe("hexavante.session_token=local; __Secure-hexavante.session_token=seguro"));
});
