*Regras de Negócio - Hexavante e HexaSchools

#RN001 - Cadastro de Usuários

O sistema deve permitir o cadastro de usuários através de:

E-mail e senha
Conta Google
Conta Microsoft

#RN002 - Idade Mínima

O usuário deve possuir no mínimo 13 anos para criar uma conta na plataforma.

#RN003 - Nome de Usuário

O nome de usuário deve ser único em todo o sistema.

Não será permitido o cadastro de dois usuários com o mesmo nome de usuário.

#RN004 - Perfil Público

O usuário poderá definir seu perfil como:

Público
Privado

Quando privado, apenas informações mínimas poderão ser exibidas a terceiros.

#RN005 - Papéis de Usuário

Um usuário poderá possuir múltiplos papéis simultaneamente.

Exemplo:

Usuário
Instrutor
Moderador
Instrutores
#RN006 - Solicitação de Instrutor

Qualquer usuário poderá solicitar o cargo de instrutor.

A solicitação deverá ser analisada por um moderador.

#RN007 - Aprovação de Instrutor

Somente usuários aprovados poderão publicar cursos como instrutores.

#RN008 - Criação de Cursos

Instrutores aprovados poderão criar cursos.

Todo curso criado iniciará com status:

PENDING_REVIEW
#RN009 - Aprovação de Cursos

Somente moderadores poderão aprovar ou rejeitar cursos.

A análise é registrada em `CourseModeration` (não confundir com `CourseRating`, avaliação do aluno — Fase 2).

#RN010 - Publicação de Cursos

Apenas cursos aprovados poderão ser exibidos publicamente.

*Cursos

#RN011 - Tipos de Curso

Os cursos poderão ser:

Gratuitos
Pagos
Premium
#RN012 - Progressão

O instrutor poderá definir:

Curso Livre
Curso Progressivo

#RN013 - Múltiplos Instrutores

Um curso poderá possuir mais de um instrutor.

#RN014 - Categorias

Todo curso deverá pertencer a uma categoria.

*Certificados

#RN015 - Certificação Configurável

O instrutor poderá definir a forma de obtenção do certificado.

#RN016 - Modos de Certificação

Os modos disponíveis serão:

Automático
Quiz Final
Nota Mínima

#RN017 - Código de Verificação

Todo certificado deverá possuir um código único para validação.

## Simulados

### RN018 — Tipos de simulados

O sistema suporta categorias:

- ENEM
- Vestibulares
- Tecnologia da Informação

### RN019 — Origem das questões

As questões podem ser oficiais ou autorais (criadas pelo moderador no painel `/moderacao/simulados`).

### RN020 — Tentativas

O sistema registra todas as tentativas (`ExamAttempt`) com score, respostas e timestamps.

### RN020a — Alternativas dinâmicas (implementado)

Questões de múltipla escolha aceitam **mínimo 2 e máximo 6** alternativas. A letra (A, B, C…) é derivada da ordem de cadastro.

### RN020b — Questões dissertativas (implementado)

Questões do tipo `ESSAY` não possuem alternativas. O gabarito de referência (`expectedAnswer`) orienta a correção manual. Status: `PENDING`, `CORRECT`, `PARTIAL`, `INCORRECT`.

### RN020c — Tempo limite (implementado)

Simulados podem definir `timeLimit` em minutos. Sem limite, exibe cronômetro progressivo. Com limite, cronômetro regressivo com auto-envio ao expirar.

### RN020d — Imagem no enunciado (implementado)

Questões podem incluir imagem opcional com tamanho de exibição configurável (`SMALL`, `MEDIUM`, `LARGE`, `FULL`), preservando a proporção original.

*Gamificação

#RN021 - Experiência (XP)

Usuários poderão ganhar XP ao:

Concluir aulas
Concluir módulos
Concluir cursos
Realizar quizzes
Participar de eventos

#RN022 - Moedas

Usuários poderão ganhar moedas ao:

Completar missões
Concluir módulos
Concluir cursos
Gabaritar quizzes

#RN023 - Loja

As moedas poderão ser utilizadas na loja da plataforma.

#RN024 - Missões Diárias

O sistema poderá disponibilizar missões diárias para obtenção de XP e moedas.

*Assinaturas

#RN025 - Plano Gratuito

Usuários gratuitos terão acesso parcial aos recursos da plataforma.

#RN026 - Plano Premium

Usuários premium terão acesso a:

Download offline
Todos os simulados
Cursos exclusivos
Atendimento mensal de dúvidas
Prioridade em eventos

*Marketplace

#RN027 - Cursos Oficiais

Cursos produzidos pela equipe Hexavante terão receita integral destinada à plataforma.

#RN028 - Cursos de Instrutores

Cursos vendidos por instrutores independentes terão divisão de receita:

85% Instrutor
15% Hexavante

*HexaSchools

#RN029 - Hierarquia Institucional

A instituição poderá possuir:

Diretor
Administrador
Coordenador
Professor
Aluno

#RN030 - Diretor

Somente diretores poderão administrar a assinatura institucional.

#RN031 - Administrador

Administradores poderão gerenciar recursos da instituição, exceto a assinatura.

#RN032 - Coordenador

Coordenadores poderão:

Criar cursos
Criar turmas
Gerenciar professores
Emitir certificados

#RN033 - Professor

Professores poderão criar aulas e conteúdos.

#RN034 - Alunos

Alunos poderão participar dos cursos e atividades disponibilizados pela instituição.

#RN035 - Múltiplos Cursos

Um aluno poderá estar matriculado em vários cursos institucionais simultaneamente.

#RN036 - Professores

Um professor poderá atuar em múltiplas turmas simultaneamente.

#RN037 - Certificados Institucionais

Os certificados emitidos pelo HexaSchools deverão conter a assinatura do coordenador responsável pelo curso.