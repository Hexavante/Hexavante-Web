import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade – Hexavante",
  description: "Como o Hexavante coleta, usa e protege seus dados pessoais conforme a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-block text-sm text-zinc-400 hover:text-white">
        ← Voltar
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
      <p className="text-zinc-400 text-sm mb-10">Última atualização: novembro de 2026</p>

      <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300">
        <section>
          <h2 className="text-xl font-semibold text-white">1. Quem somos</h2>
          <p>
            O <strong>Hexavante</strong> é uma plataforma educacional que oferece cursos, simulados,
            gamificação e certificados voltada para estudantes de TI e ENEM. Os dados tratados por
            esta plataforma são de responsabilidade do operador do serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">2. Dados coletados</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Nome completo, e-mail e data de nascimento (no cadastro).</li>
            <li>Dados de progresso: XP, moedas, tentativas em simulados, conclusão de cursos.</li>
            <li>Registros de login (IP, data/hora) para segurança.</li>
            <li>Cookies de sessão essenciais para manter você autenticado.</li>
            <li>Dados do Google (nome, e-mail e foto) quando você entra com o Google.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">3. Finalidade do tratamento</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Autenticar e manter sua sessão ativa (cookie de sessão — essencial).</li>
            <li>Registrar seu progresso nos cursos e simulados.</li>
            <li>Emitir certificados e calcular seu ranking.</li>
            <li>Detectar e bloquear acessos abusivos (rate limiting por IP).</li>
            <li>
              Melhorar a plataforma com base em dados anonimizados (opcional, mediante
              consentimento).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">4. Cookies</h2>
          <p>Utilizamos dois tipos de cookies:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Essenciais:</strong> token de sessão JWT (authjs.session-token) — sem eles
              você não consegue se autenticar. Não podem ser recusados.
            </li>
            <li>
              <strong>Analíticos/opcionais:</strong> dados de uso para melhoria da plataforma. Você
              pode recusar esses cookies no banner de consentimento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">5. Compartilhamento de dados</h2>
          <p>
            Não vendemos seus dados. Eles podem ser acessados por provedores de infraestrutura
            (hospedagem, banco de dados) sob acordos de confidencialidade, e por provedores OAuth
            (Google) conforme suas próprias políticas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">6. Seus direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar seus dados e corrigi-los.</li>
            <li>Solicitar a exclusão da sua conta e dados associados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>
            Para exercer esses direitos, acesse <strong>Configurações → Perfil</strong> ou entre em
            contato via e-mail do administrador da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">7. Retenção de dados</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão, os dados são
            removidos em até 30 dias, exceto quando a retenção for exigida por lei.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">8. Contato</h2>
          <p>Dúvidas sobre privacidade? Entre em contato com o administrador da plataforma.</p>
        </section>
      </div>
    </main>
  );
}
