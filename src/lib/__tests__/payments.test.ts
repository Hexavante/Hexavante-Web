/**
 * Valida a camada de contrato com a API de pagamentos
 * (GET /catalog, POST /checkout, GET /:paymentId) usando um servidor
 * HTTP real — nada de mock de fetch: a resposta entra igualzinho ao runtime.
 *
 * Ambiente node: no jsdom o AbortSignal global é o do jsdom e o fetch do Node
 * recusa o sinal gerado por AbortSignal.timeout (fora do runtime real do Next).
 *
 * @vitest-environment node
 */
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let server: Server;
let baseUrl: string;
let handler: Handler;

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

beforeAll(async () => {
  server = createServer((req, res) => handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("porta inválida");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err?: Error | null) => (err ? reject(err) : resolve())),
  );
});

afterEach(() => {
  vi.resetModules();
});

async function loadPayments(apiUrl = baseUrl) {
  vi.resetModules();
  process.env.AUTH_API_URL = apiUrl;
  return import("@/lib/payments");
}

describe("formatBrl / formatCoins", () => {
  it("formata em pt-BR sem depender de preço hardcoded", async () => {
    const { formatBrl, formatCoins } = await loadPayments();
    // Intl usa espaço não separável (U+00A0) depois de "R$".
    const brl = (value: number) => formatBrl(value).replace(/\u00a0|\u202f/g, " ");
    expect(brl(4.9)).toBe("R$ 4,90");
    expect(brl(19.9)).toBe("R$ 19,90");
    expect(brl(29)).toBe("R$ 29,00");
    expect(formatCoins(1200)).toBe("1.200");
    expect(formatCoins(Number.NaN)).toBe("0");
  });
});

describe("fetchPaymentsCatalog", () => {
  it("normaliza packs e plano premium do contrato", async () => {
    handler = (_req, res) =>
      json(res, 200, {
        packs: [
          { id: "pack_100", coins: 100, priceBrl: 4.9, label: "100 moedas" },
          { id: "pack_500", coins: 500, priceBrl: 19.9, label: "500 moedas" },
          { id: "quebrado", coins: "muitas" },
        ],
        premium: { id: "hexa_premium", priceBrl: 29, days: 30, label: "Hexa" },
      });

    const { fetchPaymentsCatalog } = await loadPayments();
    const result = await fetchPaymentsCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.packs).toHaveLength(2);
    expect(result.data.packs[0]).toEqual({
      id: "pack_100",
      coins: 100,
      priceBrl: 4.9,
      label: "100 moedas",
    });
    expect(result.data.premium.days).toBe(30);
  });

  it("devolve o status HTTP quando a API falha", async () => {
    handler = (_req, res) => json(res, 500, { error: "boom" });
    const { fetchPaymentsCatalog } = await loadPayments();
    const result = await fetchPaymentsCatalog();
    expect(result).toEqual({ ok: false, status: 500 });
  });

  it("marca 'invalid' quando a resposta não é JSON", async () => {
    handler = (_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<html>gateway</html>");
    };
    const { fetchPaymentsCatalog } = await loadPayments();
    const result = await fetchPaymentsCatalog();
    expect(result).toEqual({ ok: false, status: "invalid" });
  });
});

describe("fetchCheckout", () => {
  it("retorna checkoutUrl e paymentId", async () => {
    handler = (_req, res) =>
      json(res, 200, {
        checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/preference",
        paymentId: "pay_abc",
      });

    const { fetchCheckout } = await loadPayments();
    const result = await fetchCheckout("pack_100");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/preference",
      paymentId: "pay_abc",
    });
  });

  it("repassa 401, 404 e 429 como status", async () => {
    for (const status of [401, 404, 429]) {
      handler = (_req, res) => json(res, status, { error: "x" });
      const { fetchCheckout } = await loadPayments();
      expect(await fetchCheckout("pack_100")).toEqual({ ok: false, status });
    }
  });

  it("marca 'invalid' quando a URL de checkout não é http", async () => {
    handler = (_req, res) => json(res, 200, { checkoutUrl: "javascript:alert(1)" });
    const { fetchCheckout } = await loadPayments();
    expect(await fetchCheckout("pack_100")).toEqual({ ok: false, status: "invalid" });
  });
});

describe("fetchPaymentStatus", () => {
  it("lê status, produto, valor e moedas", async () => {
    handler = (_req, res) =>
      json(res, 200, {
        status: "approved",
        productId: "pack_500",
        amountBrl: 19.9,
        coins: 500,
        paidAt: "2026-10-03T12:00:00.000Z",
      });

    const { fetchPaymentStatus } = await loadPayments();
    const result = await fetchPaymentStatus("pay_abc");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("approved");
    expect(result.data.coins).toBe(500);
    expect(result.data.paidAt).toBe("2026-10-03T12:00:00.000Z");
  });

  it("converte aliases do Mercado Pago (in_process, canceled)", async () => {
    const { fetchPaymentStatus } = await loadPayments();

    handler = (_req, res) =>
      json(res, 200, { status: "in_process", productId: "hexa_premium" });
    const pending = await fetchPaymentStatus("pay_1");
    expect(pending.ok && pending.data.status).toBe("pending");

    handler = (_req, res) =>
      json(res, 200, { status: "canceled", productId: "hexa_premium" });
    const cancelled = await fetchPaymentStatus("pay_2");
    expect(cancelled.ok && cancelled.data.status).toBe("cancelled");
  });

  it("repassa 404 (pagamento inexistente) e 401 (não é o dono)", async () => {
    for (const status of [404, 401]) {
      handler = (_req, res) => json(res, status, { error: "x" });
      const { fetchPaymentStatus } = await loadPayments();
      expect(await fetchPaymentStatus("pay_x")).toEqual({ ok: false, status });
    }
  });

  it("marca 'network' quando a API não responde", async () => {
    const { fetchPaymentStatus } = await loadPayments("http://127.0.0.1:1");
    expect(await fetchPaymentStatus("pay_x")).toEqual({ ok: false, status: "network" });
  });
});
