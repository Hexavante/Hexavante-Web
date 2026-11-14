import { describe, expect, it } from "vitest";
import {
  extractLinks,
  findBacklinks,
  pendingLinkQuery,
  renameLinks,
  resolveLink,
  splitLinks,
} from "@/lib/notebook";

describe("links do caderno", () => {
  it("extrai títulos sem repetir e sem diferenciar maiúsculas", () => {
    expect(extractLinks("Ver [[Fórmulas]], [[fórmulas]] e [[ Funções ]]")).toEqual(["Fórmulas", "Funções"]);
  });

  it("ignora colchetes incompletos ou com quebra de linha", () => {
    expect(extractLinks("[[aberto e [[ok]] e [[com\nquebra]]")).toEqual(["ok"]);
  });

  it("renomeia só os links do título antigo", () => {
    expect(renameLinks("[[Classes]] e [[classes]] e [[Herança]]", "Classes", "Objetos")).toBe(
      "[[Objetos]] e [[Objetos]] e [[Herança]]",
    );
  });

  it("quebra o texto em trechos e links para o modo leitura", () => {
    expect(splitLinks("Revise [[A]] hoje")).toEqual([
      { type: "text", text: "Revise " },
      { type: "link", title: "A" },
      { type: "text", text: " hoje" },
    ]);
  });

  it("resolve títulos repetidos para a página mais recente", () => {
    const pages = [
      { id: "old", title: "Resumo", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "new", title: "resumo", updatedAt: "2026-06-01T00:00:00Z" },
    ];
    expect(resolveLink(pages, "RESUMO")?.id).toBe("new");
    expect(resolveLink(pages, "Inexistente")).toBeUndefined();
  });

  it("encontra quem menciona a nota, exceto ela mesma", () => {
    const pages = [
      { id: "a", content: "ver [[Alvo]]" },
      { id: "b", content: "nada" },
      { id: "alvo", content: "[[Alvo]] eu mesma" },
    ];
    expect(findBacklinks(pages, "alvo", "alvo").map((p) => p.id)).toEqual(["a"]);
  });

  it("detecta o [[ aberto no cursor para o autocompletar", () => {
    expect(pendingLinkQuery("texto [[Fun", 11)).toEqual({ query: "Fun", start: 8 });
    expect(pendingLinkQuery("texto [[Fun]] depois", 20)).toBeNull();
    expect(pendingLinkQuery("sem link", 8)).toBeNull();
  });
});
