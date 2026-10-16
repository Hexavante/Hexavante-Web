/** Auth.js executa jwt/session no middleware (Edge) e nas rotas (Node). */
export function isAuthEdgeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "edge";
}
