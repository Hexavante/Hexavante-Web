"use client";

type UploadResult = {
  url?: string;
  error?: string;
  width?: number;
  height?: number;
};

/**
 * Lê a resposta de upload com segurança: o servidor sempre responde JSON,
 * mas se algo inesperado voltar (HTML/texto de erro), gera mensagem amigável
 * em vez do clássico "Unexpected token ... is not valid JSON".
 */
export async function parseUploadResponse(response: Response): Promise<UploadResult> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as UploadResult;
    } catch {
      throw new Error("Resposta inválida do servidor. Tente novamente.");
    }
  }

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("Arquivo muito grande. O limite é de 5 MB.");
    }
    // Páginas de erro de infra (nginx/proxy) são HTML e nunca devem ir
    // para a tela do usuário.
    const looksLikeHtml = /^\s*<(!doctype|html)/i.test(text);
    throw new Error(
      looksLikeHtml || !text.trim()
        ? `Falha no upload (HTTP ${response.status}). Tente novamente.`
        : text.trim(),
    );
  }
  throw new Error("Resposta inválida do servidor. Tente novamente.");
}

export async function uploadImageFile(endpoint: string, file: File): Promise<UploadResult & { url: string }> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(endpoint, { method: "POST", body });
  const data = await parseUploadResponse(response);

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Falha no upload da imagem.");
  }
  return { ...data, url: data.url };
}
