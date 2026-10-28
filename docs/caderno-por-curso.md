# Caderno por curso

A rota `/anotacoes` agora usa páginas pessoais na tabela `notebook_pages`.
Cada curso em que o usuário está matriculado aparece como uma divisória;
cada divisória pode conter várias páginas com título e texto. As notas das
aulas continuam intactas em `lesson_notes`, disponíveis em `/anotacoes/aulas`.
Não há importação automática nem sincronização entre os dois tipos de anotação.

## Persistência e publicação

- Aplicar a migração `20261028000000_course_notebook` antes de publicar o app.
- Ela cria somente `notebook_pages`, com relações para `users` e `courses`.
- Os nomes e tipos dos IDs foram comparados com o schema local da API.
  A API não acessa essa tabela neste fluxo; não houve alteração no repositório da API.
- Antes de aplicar em produção, conferir o estado das migrações e o schema real
  do banco compartilhado. O banco de produção não foi acessado nesta tarefa.
  Não usar `db push` para resolver diferenças ou executar migrações pendentes sem revisão.
- Gerar o Prisma Client com `npm run db:generate` e construir o Web.
- Sem a tabela, o Caderno mostra indisponibilidade com opção de tentar novamente;
  o link para as notas antigas continua acessível.

## Validação

O servidor obtém o usuário da sessão. Toda leitura e atualização é limitada ao
usuário; escrita exige matrícula no curso. O campo `version` impede sobrescrita
silenciosa entre duas abas. Falhas de salvamento mantêm o rascunho na tela.
O texto não é persistido no navegador: deve-se salvar antes de fechar a página.

Testes locais cobrem criação independente de aula, matrícula, isolamento de conta,
conflito de versões, limites de texto, seleção de divisória e preservação de
rascunho após falha. A verificação visual usa dados demonstrativos; a gravação
real deve ser validada após a migração em um banco de homologação.
