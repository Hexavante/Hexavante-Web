import { describe, expect, it } from "vitest";
import { parseUploadResponse } from "@/lib/upload-client";

function htmlResponse(status: number, body: string) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });
}

const nginx413Html =
  "<html><head><title>413 Request Entity Too Large</title></head>" +
  "<body><center><h1>413 Request Entity Too Large</h1></center>" +
  "<hr><center>nginx/1.22.1</center></body></html>";

describe("parseUploadResponse", () => {
  it("traduz 413 do nginx em mensagem amigável (não joga o HTML na tela)", async () => {
    await expect(parseUploadResponse(htmlResponse(413, nginx413Html))).rejects.toThrow(
      "Arquivo muito grande",
    );
  });

  it("genérica para páginas HTML de erro de infra (502, etc.)", async () => {
    await expect(
      parseUploadResponse(htmlResponse(502, "<html><body>Bad Gateway</body></html>")),
    ).rejects.toThrow("Falha no upload (HTTP 502)");
  });

  it("repassa mensagem de erro JSON do servidor sem tocar", async () => {
    const response = new Response(
      JSON.stringify({ error: "Arquivo muito grande. Máximo 5 MB." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
    const data = await parseUploadResponse(response);
    expect(data.error).toBe("Arquivo muito grande. Máximo 5 MB.");
  });
});
