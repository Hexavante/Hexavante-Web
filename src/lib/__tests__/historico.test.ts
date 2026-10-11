import { describe, expect, it } from "vitest";
import {
  buildCoursesHistoryRedirect,
  buildHistoricoLoginCallback,
  buildSimuladosHistoryRedirect,
  parseAtividadeTipo,
  parseCursoOrdenacao,
  parseCursoStatus,
  parseHistoricoAba,
  parsePageNumber,
  parsePeriodo,
  parseSimuladoOrdenacao,
  parseSimuladoTipo,
  pickQuery,
  resolvePeriodoSince,
} from "@/lib/historico";

describe("lib/historico", () => {
  describe("parseHistoricoAba", () => {
    it("aceita as quatro abas válidas", () => {
      expect(parseHistoricoAba("overview")).toBe("overview");
      expect(parseHistoricoAba("cursos")).toBe("cursos");
      expect(parseHistoricoAba("simulados")).toBe("simulados");
      expect(parseHistoricoAba("atividades")).toBe("atividades");
    });

    it("normaliza valor inválido/ausente para overview", () => {
      expect(parseHistoricoAba(undefined)).toBe("overview");
      expect(parseHistoricoAba(null)).toBe("overview");
      expect(parseHistoricoAba("")).toBe("overview");
      expect(parseHistoricoAba("historico")).toBe("overview");
    });
  });

  describe("parsePageNumber", () => {
    it("normaliza páginas inválidas para 1", () => {
      expect(parsePageNumber(undefined)).toBe(1);
      expect(parsePageNumber("0")).toBe(1);
      expect(parsePageNumber("-3")).toBe(1);
      expect(parsePageNumber("abc")).toBe(1);
    });

    it("aceita páginas válidas", () => {
      expect(parsePageNumber("1")).toBe(1);
      expect(parsePageNumber("4")).toBe(4);
    });
  });

  describe("pickQuery", () => {
    it("devolve o primeiro valor não-vazio", () => {
      expect(pickQuery(undefined, "  ", "mat")).toBe("mat");
      expect(pickQuery("a", "b")).toBe("a");
      expect(pickQuery(undefined, null)).toBeUndefined();
    });
  });

  describe("parsePeriodo / resolvePeriodoSince", () => {
    it("aceita janelas válidas e normaliza o resto para all", () => {
      expect(parsePeriodo("7d")).toBe("7d");
      expect(parsePeriodo("30d")).toBe("30d");
      expect(parsePeriodo("90d")).toBe("90d");
      expect(parsePeriodo("12m")).toBe("12m");
      expect(parsePeriodo(undefined)).toBe("all");
      expect(parsePeriodo("sempre")).toBe("all");
    });

    it("resolve a data de corte a partir de uma referência fixa", () => {
      const now = new Date("2026-10-10T12:00:00Z");
      expect(resolvePeriodoSince("all", now)).toBeUndefined();
      expect(resolvePeriodoSince("7d", now)).toEqual(new Date("2026-10-03T12:00:00Z"));
      expect(resolvePeriodoSince("30d", now)).toEqual(new Date("2026-09-10T12:00:00Z"));
      expect(resolvePeriodoSince("90d", now)).toEqual(new Date("2026-07-12T12:00:00Z"));
      expect(resolvePeriodoSince("12m", now)).toEqual(new Date("2025-10-10T12:00:00Z"));
    });
  });

  describe("parsers de filtro/ordenação", () => {
    it("normaliza status de cursos", () => {
      expect(parseCursoStatus("completed")).toBe("completed");
      expect(parseCursoStatus("inProgress")).toBe("inProgress");
      expect(parseCursoStatus("done")).toBe("all");
      expect(parseCursoStatus(undefined)).toBe("all");
    });

    it("normaliza ordenações", () => {
      expect(parseCursoOrdenacao("titulo")).toBe("titulo");
      expect(parseCursoOrdenacao("invalida")).toBe("recentes");
      expect(parseSimuladoOrdenacao("nota_desc")).toBe("nota_desc");
      expect(parseSimuladoOrdenacao("invalida")).toBe("recentes");
    });

    it("valida tipo de simulado e tipo de atividade", () => {
      expect(parseSimuladoTipo("ENEM")).toBe("ENEM");
      expect(parseSimuladoTipo("FUVEST")).toBeUndefined();
      expect(parseSimuladoTipo(undefined)).toBeUndefined();
      expect(parseAtividadeTipo("xp")).toBe("xp");
      expect(parseAtividadeTipo("moedas")).toBe("all");
    });
  });

  describe("redirects das rotas legadas", () => {
    it("redireciona /courses/history para aba cursos preservando page", () => {
      expect(buildCoursesHistoryRedirect({})).toBe("/historico?aba=cursos");
      expect(buildCoursesHistoryRedirect({ page: "3" })).toBe("/historico?aba=cursos&page=3");
      expect(buildCoursesHistoryRedirect({ page: "invalida" })).toBe("/historico?aba=cursos");
      expect(buildCoursesHistoryRedirect({ page: "1" })).toBe("/historico?aba=cursos");
    });

    it("normaliza page fora de faixa em /courses/history", () => {
      expect(buildCoursesHistoryRedirect({ page: "0" })).toBe("/historico?aba=cursos");
      expect(buildCoursesHistoryRedirect({ page: "-2" })).toBe("/historico?aba=cursos");
      expect(buildCoursesHistoryRedirect({ page: "" })).toBe("/historico?aba=cursos");
      expect(buildCoursesHistoryRedirect({ page: "2" })).toBe("/historico?aba=cursos&page=2");
    });

    it("redireciona /simulados/historico para aba simulados preservando tipo/page", () => {
      expect(buildSimuladosHistoryRedirect({})).toBe("/historico?aba=simulados");
      expect(buildSimuladosHistoryRedirect({ tipo: "ENEM", page: "2" })).toBe(
        "/historico?aba=simulados&tipo=ENEM&page=2",
      );
      expect(buildSimuladosHistoryRedirect({ tipo: "INVALIDO", page: "2" })).toBe(
        "/historico?aba=simulados&page=2",
      );
      expect(buildSimuladosHistoryRedirect({ examType: "TECNOLOGIA" })).toBe(
        "/historico?aba=simulados&tipo=TECNOLOGIA",
      );
    });

    it("aceita o alias examType e normaliza page em /simulados/historico", () => {
      expect(buildSimuladosHistoryRedirect({ examType: "VESTIBULAR", page: "4" })).toBe(
        "/historico?aba=simulados&tipo=VESTIBULAR&page=4",
      );
      expect(buildSimuladosHistoryRedirect({ tipo: "ENEM", page: "0" })).toBe(
        "/historico?aba=simulados&tipo=ENEM",
      );
      expect(buildSimuladosHistoryRedirect({ tipo: "ENEM", page: "abc" })).toBe(
        "/historico?aba=simulados&tipo=ENEM",
      );
      expect(buildSimuladosHistoryRedirect({ examType: "FUVEST", page: "2" })).toBe(
        "/historico?aba=simulados&page=2",
      );
    });
  });

  describe("buildHistoricoLoginCallback", () => {
    it("preserva os filtros atuais no callbackUrl", () => {
      expect(
        buildHistoricoLoginCallback({ aba: "simulados", tipo: "ENEM", page: "2" }),
      ).toBe("/login?callbackUrl=%2Fhistorico%3Faba%3Dsimulados%26page%3D2%26tipo%3DENEM");
    });

    it("preserva busca, status, período e ordenação (incluindo aliases)", () => {
      expect(
        buildHistoricoLoginCallback({
          aba: "cursos",
          q: "matemática",
          page: "3",
          periodo: "30d",
          ordenacao: "titulo",
        }),
      ).toBe(
        "/login?callbackUrl=%2Fhistorico%3Faba%3Dcursos%26q%3Dmatem%25C3%25A1tica%26page%3D3%26periodo%3D30d%26ordenacao%3Dtitulo",
      );
      expect(buildHistoricoLoginCallback({ search: "física" })).toBe(
        "/login?callbackUrl=%2Fhistorico%3Fsearch%3Df%25C3%25ADsica",
      );
      expect(buildHistoricoLoginCallback({ status: "completed", filtro: "x" })).toContain(
        "callbackUrl=%2Fhistorico%3F",
      );
    });

    it("ignora chaves vazias e desconhecidas", () => {
      expect(buildHistoricoLoginCallback({})).toBe("/login?callbackUrl=%2Fhistorico");
      expect(buildHistoricoLoginCallback({ aba: "", q: "  " })).toBe(
        "/login?callbackUrl=%2Fhistorico",
      );
      expect(
        buildHistoricoLoginCallback({ aba: "simulados", chaveDesconhecida: "x" } as Record<string, string>),
      ).toBe("/login?callbackUrl=%2Fhistorico%3Faba%3Dsimulados");
    });
  });
});
