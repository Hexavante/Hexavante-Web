/**
 * Gera simulados ENEM completos para ambiente de teste:
 * - 100 questões objetivas (25 por área do conhecimento)
 * - 1 questão dissertativa de Redação ao final (tipo ESSAY)
 *
 * As questões são fictícias, no estilo ENEM, para fins de desenvolvimento e QA.
 * Não reproduzem o conteúdo oficial do INEP.
 *
 * Os 3 exames completos (2024, 2025 e 2026) usam bancos de itens explícitos e
 * próprios por ano/área (`ENEM_ITEMS`): enunciado real com cenário a resolver,
 * gabarito único e 4 distratores escritos para cada questão — sem pool global
 * de alternativas. Os validadores deste arquivo lançam erro (fail-fast) se:
 * houver enunciado com menos de 120 caracteres, alternativa repetida dentro da
 * questão, gabarito diferente de 1, enunciado repetido entre os 3 anos ou
 * posição da correta fora da faixa 10%–40% por letra.
 */

export type SeedAlternative = { text: string; isCorrect: boolean };

export type SeedMcQuestion = {
  type: "MULTIPLE_CHOICE";
  statement: string;
  alternatives: SeedAlternative[];
  subject?: string;
  explanation?: string;
  difficulty?: number;
};

export type SeedEssayQuestion = {
  type: "ESSAY";
  statement: string;
  expectedAnswer?: string;
};

export type SeedExamQuestion = SeedMcQuestion | SeedEssayQuestion;

export type SeedFullEnemExam = {
  title: string;
  slug: string;
  description: string;
  examType: "ENEM";
  timeLimit: number;
  isPremiumOnly?: boolean;
  questions: SeedExamQuestion[];
};

type EnemArea = {
  code: string;
  name: string;
  start: number;
  topics: string[];
};

const ENEM_AREAS: EnemArea[] = [
  {
    code: "LC",
    name: "Linguagens, Códigos e suas Tecnologias",
    start: 1,
    topics: [
      "interpretação de texto literário",
      "variação linguística e preconceito",
      "funções da linguagem",
      "coesão e coerência textual",
      "gêneros digitais e multimodais",
      "figuras de linguagem",
      "artes e manifestações culturais",
      "língua estrangeira — compreensão global",
      "literatura brasileira contemporânea",
      "produção textual e revisão",
    ],
  },
  {
    code: "CH",
    name: "Ciências Humanas e suas Tecnologias",
    start: 26,
    topics: [
      "Brasil República e cidadania",
      "globalização e economia mundial",
      "geopolítica e conflitos",
      "urbanização e mobilidade",
      "movimentos sociais",
      "direitos humanos",
      "sociologia do trabalho",
      "meio ambiente e sustentabilidade",
      "cultura e identidade",
      "filosofia e ética pública",
    ],
  },
  {
    code: "CN",
    name: "Ciências da Natureza e suas Tecnologias",
    start: 51,
    topics: [
      "ecologia e cadeias alimentares",
      "genética e hereditariedade",
      "fotossíntese e metabolismo",
      "química orgânica aplicada",
      "reações químicas e estequiometria",
      "física — cinemática",
      "física — energia e trabalho",
      "ondas e fenômenos naturais",
      "saúde pública e epidemiologia",
      "sustentabilidade e recursos naturais",
    ],
  },
  {
    code: "MT",
    name: "Matemática e suas Tecnologias",
    start: 76,
    topics: [
      "porcentagem e juros",
      "razão e proporção",
      "função afim e quadrática",
      "geometria plana",
      "geometria espacial",
      "probabilidade e combinatória",
      "estatística — média e mediana",
      "análise de gráficos",
      "trigonometria aplicada",
      "álgebra e equações",
    ],
  },
];

const REDACAO_THEMES: Record<number, { tema: string; orientacao: string }> = {
  2024: {
    tema: "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
    orientacao:
      "Elabore um texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema, apresentando proposta de intervenção que respeite os direitos humanos.",
  },
  2025: {
    tema: "Persistência da violência contra a mulher na sociedade brasileira",
    orientacao:
      "Elabore um texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema, apresentando proposta de intervenção que respeite os direitos humanos.",
  },
  2026: {
    tema: "O estigma associado às doenças mentais na sociedade brasileira",
    orientacao:
      "Elabore um texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema, apresentando proposta de intervenção que respeite os direitos humanos.",
  },
};

/** Área do conhecimento de um item do banco ENEM completo. */
export type EnemAreaCode = "LC" | "CH" | "CN" | "MT";

/** Anos com prova completa disponível no seed. */
export type EnemYear = 2024 | 2025 | 2026;

/**
 * Item explícito do banco: enunciado com problema a resolver, gabarito,
 * exatamente 4 distratores próprios da questão, explicação e área.
 */
export type EnemItem = {
  statement: string;
  correct: string;
  wrong: [string, string, string, string];
  explanation: string;
  subject: string;
};

const S_LC = "Linguagens, Códigos e suas Tecnologias";
const S_CH = "Ciências Humanas e suas Tecnologias";
const S_CN = "Ciências da Natureza e suas Tecnologias";
const S_MT = "Matemática e suas Tecnologias";
// ---- ENEM 2024 · Linguagens, Códigos e suas Tecnologias (25 itens) ----
const ITEMS_2024_LC: EnemItem[] = [
  {
    statement: "Ao divulgar o resultado da campanha de arrecadação, a direção da escola publicou: «Faz dois meses que a biblioteca funciona com o horário ampliado.» Considerando a norma-padrão, a frase está:",
    correct: "correta, pois o verbo fazer, com sentido de tempo decorrido, é impessoal e permanece no singular.",
    wrong: ["incorreta, porque o sujeito «dois meses» exige a forma verbal fazem no plural.", "incorreta, porque verbos impessoais concordam sempre com o primeiro substantivo da frase.", "correta apenas se trocarmos «faz» por «fazem», para enfatizar a duração do período.", "incorreta, porque a oração «que a biblioteca» deveria antecipar-se ao verbo, exigindo próclise."],
    explanation: "O verbo fazer indicando tempo decorrido não tem sujeito e mantém a 3ª pessoa do singular: «faz dois meses».",
    subject: S_LC,
  },
  {
    statement: "A estudante responsável pela agenda cultural reescreveu o convite do evento sobre o horário da atividade. Qual formulação do período está de acordo com a norma-padrão quanto ao uso da crase?",
    correct: "A palestra, adiada duas vezes, acontecerá às dez horas da manhã, na biblioteca.",
    wrong: ["A palestra, adiada duas vezes, acontecerá à partir das dez horas da manhã, na biblioteca.", "A palestra, adiada duas vezes, acontecerá à dez horas da manhã, na biblioteca.", "A palestra, adiada duas vezes, acontecerá a dez horas da manhã, na biblioteca.", "A palestra, adiada duas vezes, acontecerá de dez horas da manhã, na biblioteca."],
    explanation: "«A partir de» não aceita crase; o horário pede preposição a mais artigo feminino: às dez horas.",
    subject: S_LC,
  },
  {
    statement: "Na coluna de esportes do jornal digital da escola, dois repórteres discutiram a redação da chamada sobre a final do campeonato interturmas. Qual frase obedece à regência padrão do verbo assistir?",
    correct: "Toda a torcida assistiu ao jogo decidido nos pênaltis.",
    wrong: ["Toda a torcida assistiu o jogo decidido nos pênaltis.", "Toda a torcida assistiu no jogo decidido nos pênaltis.", "Toda a torcida assistiu do jogo decidido nos pênaltis.", "Toda a torcida assistiu pelo jogo decidido nos pênaltis."],
    explanation: "No sentido de presenciar, assistir rege a preposição a: assistiu ao jogo.",
    subject: S_LC,
  },
  {
    statement: "Um e-mail do grêmio estudantil passou por revisão antes do envio à comunidade escolar. Qual alternativa apresenta a colocação pronominal adequada à norma-padrão formal?",
    correct: "Não se pode descartar a sugestão apresentada pela turma sem antes discuti-la.",
    wrong: ["Não pode-se descartar a sugestão apresentada pela turma sem antes discuti-la.", "Não descarta-se nunca a sugestão apresentada pela turma sem antes discuti-la.", "A sugestão apresentada pela turma não pode descartar-se sem antes discuti-la.", "Descarta-se não a sugestão apresentada pela turma sem antes discuti-la."],
    explanation: "As negações «não» e «nunca» atraem o pronome para antes do verbo: não se pode descartar.",
    subject: S_LC,
  },
  {
    statement: "Durante a revisão do relatório de prática, o grupo percebeu que o período abaixo havia ficado sem nenhuma vírgula: «Chegando ao laboratório os alunos perceberam que o equipamento havia quebrado durante a noite.» Qual é a pontuação correta?",
    correct: "Chegando ao laboratório, os alunos perceberam que o equipamento havia quebrado durante a noite.",
    wrong: ["Chegando, ao laboratório os alunos perceberam que o equipamento havia quebrado durante a noite.", "Chegando ao laboratório os alunos, perceberam que o equipamento havia quebrado durante a noite.", "Chegando ao laboratório, os alunos, perceberam que o equipamento havia quebrado, durante a noite.", "Chegando ao laboratório os alunos perceberam, que o equipamento havia quebrado durante a noite."],
    explanation: "A oração participial deslocada é separada por vírgula; não se separam sujeito e predicado nem o verbo de seu complemento.",
    subject: S_LC,
  },
  {
    statement: "A revisora do jornal escolar marcou quatro frases como possivelmente incorretas antes da página ir para a diagramação. Qual alternativa está grafada conforme o acordo ortográfico vigente?",
    correct: "A comissão analisou a frequência dos voluntários e concluiu que ela havia aumentado.",
    wrong: ["A comissão analizou a frequencia dos voluntários e concluiu que ela havia aumentado.", "A comissão analisou a frequênçia dos voluntários e concluiu que ela havia aumentado.", "A comissão analizou a frequência dos voluntários e concluiu que ela havia aumentado.", "A comissão analizou a frequencia dos voluntarios e concluiu que ela havia aumentado."],
    explanation: "«Frequência» leva acento circunflexo e c antes de -ia; «analisar» mantém o i: analisou.",
    subject: S_LC,
  },
  {
    statement: "O editor do jornal escolar destacou duas lacunas na matéria sobre o recesso antecipado: «Os alunos perguntaram ▭ o recesso foi antecipado e o diretor explicou o ▭ dessa decisão.» Qual preenche as lacunas, respectivamente?",
    correct: "porque, porquê",
    wrong: ["por que, por quê", "porquê, porque", "porque, por que", "por quê, porquê"],
    explanation: "Em oração indireta de pergunta, a causa indica-se por «porque»; depois do artigo o, substantiva-se «o porquê».",
    subject: S_LC,
  },
  {
    statement: "Na véspera da prova aplicada no auditório, o grêmio estudantil publicou a frase «O silêncio do recinto era uma manta pesada sobre os ombros dos estudantes». Esse recurso expressivo é:",
    correct: "metáfora, pois associa o silêncio a uma manta pesada sem conectivo de comparação.",
    wrong: ["hipérbole, pois exagera o incômodo para provocar riso dos leitores.", "eufemismo, pois atenua o nervosismo para não assustar os estudantes.", "anáfora, pois repete o artigo «os» para enfatizar o cansaço coletivo.", "onomatopeia, pois imita o ruído do recinto por meio de palavras sonoras."],
    explanation: "A metáfora substitui um termo por outro sem conectivos comparativos: silêncio é manta pesada.",
    subject: S_LC,
  },
  {
    statement: "Uma coluna de opinião sobre leitura abre assim: «Como um farol aceso na noite, a biblioteca orientava os estudantes perdidos entre tantas fontes.» A figura de linguagem presente no trecho é:",
    correct: "comparação (simile), porque o conectivo «como» aproxima a biblioteca de um farol.",
    wrong: ["metáfora pura, porque dispensa qualquer palavra de ligação entre os termos.", "personificação, porque atribui ações humanas exclusivamente à biblioteca inanimada.", "paradoxo, porque junta ideias opostas: noite escura e fontes acesas de informação.", "aliteração, porque repete o som inicial das palavras para ritmar a frase."],
    explanation: "Quando a associação entre os termos é marcada por «como», «tal qual» etc., temos comparação (simile).",
    subject: S_LC,
  },
  {
    statement: "Um cartaz afixado na cantina trazia a frase «Beba água: seu corpo agradece!», acompanhada da ilustração de um copo cheio. Sobre a função da linguagem predominante no texto escrito, é correto afirmar:",
    correct: "predomina a função conativa (apelativa), pois o imperativo dirige-se ao leitor para induzir um comportamento.",
    wrong: ["predomina a função metalinguística, pois o texto define o que é água para o corpo.", "predomina a função fática, pois a frase testa se o leitor está atento ao cartaz.", "predomina a função poética, pois o foco recai na sonoridade das palavras do cartaz.", "predomina a função referencial, pois a frase apresenta dados objetivos sobre hidratação."],
    explanation: "A segunda pessoa e o imperativo voltam-se ao destinatário para influenciar sua conduta: função conativa.",
    subject: S_LC,
  },
  {
    statement: "Numa antologia de poesia organizada pela turma, o verso «A chuva escreve em vidro a letra muda do outono» foi destacado. Considerando as funções da linguagem de Jakobson, o texto orienta-se sobretudo para:",
    correct: "o polo poético, porque a escolha das imagens e do ritmo faz da mensagem o próprio foco.",
    wrong: ["o polo conativo, porque o verso pede ao leitor que observe a chuva cair pela janela.", "o polo referencial, porque informa objetivamente quanto choveu durante o mês de outubro.", "o polo metalinguístico, porque o texto explica como se escreve corretamente sobre a natureza.", "o polo fático, porque o verso serve apenas para confirmar que o canal de leitura está funcionando."],
    explanation: "Quando a atenção recai sobre a materialidade da linguagem (imagens, sonoridade), predomina a função poética.",
    subject: S_LC,
  },
  {
    statement: "Dois textos sobre a mesma reforma da praça circularam na escola: um relata o que aconteceu, com data, local e fontes; o outro defende uma posição e pede providências ao poder público. A diferença central é que:",
    correct: "o primeiro é notícia, com foco informativo, e o segundo é editorial, com foco argumentativo.",
    wrong: ["ambos são editoriais, pois os dois tratam de um mesmo tema de interesse público.", "o primeiro é propaganda institucional e o segundo é anúncio publicitário de venda.", "o primeiro é verbete enciclopédico e o segundo é crônica, por ser mais subjetivo.", "o primeiro é instrução de manual e o segundo é carta ao leitor de resposta individual."],
    explanation: "A notícia relata fatos com apuração de fontes; o editorial assume posição e argumenta em nome do veículo.",
    subject: S_LC,
  },
  {
    statement: "O fechamento de um texto dissertativo diz: «A campanha de vacinação atendeu a 80% da meta. ▭, o número de recusas cresceu nas zonas rurais.» As duas ideias se relacionam por oposição; o conectivo que melhor marca essa relação é:",
    correct: "Contudo, pois introduz um dado que contrasta com o sucesso relatado antes.",
    wrong: ["Portanto, pois retoma o número anterior para concluir a favor da campanha.", "Além disso, pois acrescenta mais um percentual que confirma o bom resultado.", "Por isso, pois apresenta as recusas como consequência direta dos 80% atingidos.", "Em síntese, pois reexplica a meta de vacinação com outras palavras."],
    explanation: "«Contudo»/«entretanto»/«no entanto» introduzem informação contrastante com a anterior.",
    subject: S_LC,
  },
  {
    statement: "Em um texto sobre acolhimento de novos alunos, lê-se: «A secretaria entregou o cadastro a cada família; essa pasta deve ser devolvida preenchida em uma semana.» O termo «essa pasta»:",
    correct: "retoma anaforicamente «cadastro», elemento já mencionado no período anterior.",
    wrong: ["aponta para um elemento que só será mencionado no parágrafo seguinte.", "substitui «família», único substantivo feminino singular do período anterior.", "refere-se à secretaria, que é o sujeito da oração principal do período.", "é um dêitico que depende da situação de fala, sem âncora no texto escrito."],
    explanation: "Pronomes demonstrativos que recuperam um elemento anterior exercem referência anafórica (retórica).",
    subject: S_LC,
  },
  {
    statement: "Um estudante foi corrigido por usar «a gente vai» na apresentação oral, embora o registro da fala fosse espontâneo e informal. Sobre variação linguística, a postura mais adequada é:",
    correct: "reconhecer que a norma-padrão é uma variedade entre outras e orientar o uso formal quando exigido.",
    wrong: ["considerar «a gente vai» um erro grave que compromete a inteligência da fala.", "afirmar que a norma-padrão é a única forma correta da língua portuguesa.", "entender que variação linguística só existe entre países, nunca dentro do Brasil.", "sugerir que o estudante abandone a fala espontânea em todas as situações da vida."],
    explanation: "Toda língua é variável; a norma-padrão é uma variedade de prestígio, adequada a contextos formais.",
    subject: S_LC,
  },
  {
    statement: "Leia o trecho de um diário fictício: «Choveu a noite inteira e a horta da avó amanheceu verde; eu, porém, só consegui pensar no trem das sete, que leva meu pai embora há três meses.» A leitura mais consistente é:",
    correct: "o cenário de permanência (chuva e horta) contrasta com a partida marcada pelo trem.",
    wrong: ["o narrador comemora a chegada da estação chuvosa, que melhora a plantação da família.", "o texto descreve apenas a rotina rural, sem nenhuma tensão entre ficar e partir.", "o pai viaja com frequência por causa do trabalho na horta, sempre no mesmo horário.", "a frase registra um fato jornalístico sobre o atraso do trem das sete na cidade."],
    explanation: "O conector «porém» estabelece oposição entre o ambiente permanente e a ausência do pai, motivo da inquietação.",
    subject: S_LC,
  },
  {
    statement: "Um infográfico do jornal escolar mostra que, de 2019 a 2023, os empréstimos presenciais da biblioteca caíram de 4.200 para 1.800, enquanto os feitos por aplicativo subiram de 300 para 2.100. A conclusão melhor sustentada é:",
    correct: "o hábito de leitura não necessariamente diminuiu: houve migração do empréstimo físico para o digital.",
    wrong: ["a biblioteca fechou as portas em 2023 e por isso os números se inverteram.", "o total de empréstimos praticamente dobrou no período de cinco anos.", "os alunos passaram a ler menos porque o aplicativo exigia cadastro prévio.", "os dados provam que a leitura em papel desapareceu completamente entre 2019 e 2023."],
    explanation: "O saldo total caiu de 4.500 para 3.900, mas a forte alta do digital indica migração de meio, não fim da leitura.",
    subject: S_LC,
  },
  {
    statement: "Em Memórias Póstumas de Brás Cubas, de Machado de Assis, o narrador anuncia-se como «defunto autor». Essa estratégia narrativa produz, entre outros efeitos:",
    correct: "uma voz irônica e distanciada, que permite ao narrador julgar os vivos sem restrições morais.",
    wrong: ["um relatório objetivo dos fatos, na tradição do romance realista documental.", "um mistério policial, pois a causa da morte do narrador só é revelada no final.", "uma confissão religiosa, típica das memórias redigidas em mosteiro no século XIX.", "uma narrativa em terceira pessoa onisciente, sem marcas de subjetividade do narrador."],
    explanation: "O narrador falecido ri dos vivos e de si mesmo; a ironia machadiana nasce desse distanciamento entre morto e mundo.",
    subject: S_LC,
  },
  {
    statement: "Em Vidas Secas, de Graciliano Ramos, os capítulos dedicados à cachorra Baleia interrompem a sequência da família sertaneja. Esse recurso contribui para:",
    correct: "dar voz afetiva a um ser marginalizado e mostrar a dureza da migração por outro olhar.",
    wrong: ["apresentar a história natural da seca em formato de documentário científico.", "indicar que o romance pertence ao gênero fantástico, com animais que falam.", "mostrar que os personagens humanos perderam importância para o autor.", "encerrar a obra com desfecho feliz, já que a cachorra sobrevive à família."],
    explanation: "Os capítulos de Baleia empregam discurso indireto livre a partir do ponto de vista da cachorra, humanizando-a sem recorrer à fantasia.",
    subject: S_LC,
  },
  {
    statement: "Um anúncio de loja usa a expressão «Aquele têtopa arrasou no rolê!» para se dirigir a jovens. Sobre o uso da língua em publicidade, é correto afirmar que:",
    correct: "o texto escolhe um registro jovem como estratégia de aproximação com o público-alvo.",
    wrong: ["a expressão viola a norma-padrão e por isso não poderia ser veiculada.", "o texto está escrito em espanhol, já que «rolê» não pertence ao português.", "propagandas precisam usar sempre a norma-padrão para serem compreendidas.", "a escolha léxica não influencia de forma alguma a percepção da marca pelo consumidor."],
    explanation: "A variação de registro é recurso deliberado de marketing; a adequação depende do público e do canal.",
    subject: S_LC,
  },
  {
    statement: "Um letreiro numa feira de ciências informa em inglês: «Please keep your tickets until the end of the visit.» A orientação pede ao visitante que:",
    correct: "retenha o ingresso até o término da visita, provavelmente para conferência na saída.",
    wrong: ["devolva o ingresso imediatamente após a compra, antes de entrar na feira.", "compre novos ingressos ao fim da visita, caso queira retornar no dia seguinte.", "assine o ingresso antes do início da mostra para confirmar sua presença.", "troque o ingresso por um cupom e desista da visita no mesmo dia."],
    explanation: "«Keep … until the end» significa manter consigo até o fim: guarde o ingresso até o término da visita.",
    subject: S_LC,
  },
  {
    statement: "Na embalagem de um kit de eletrônica, lê-se em inglês: «Do not open the battery compartment before removing the power cord.» A instrução proíbe abrir a tampa:",
    correct: "antes de retirar o cabo de energia, ou seja, enquanto o aparelho estiver conectado.",
    wrong: ["depois que o cabo de energia já tiver sido retirado, pois aí a tampa fica solta.", "somente no primeiro dia de uso, mesmo com o aparelho desligado da rede elétrica.", "em qualquer situação, pois a tampa do compartimento não pode ser aberta pelo usuário.", "após conectar o cabo à tomada, já que a abertura exigiria energia para travar."],
    explanation: "«Do not … before removing» proíbe a ação anterior à remoção do cabo: não abra enquanto estiver conectado.",
    subject: S_LC,
  },
  {
    statement: "Em um documentário sobre praças, o editor usou um plano-sequência de trinta segundos em que a câmera atravessa o espaço sem cortes. Esse recurso, na linguagem audiovisual, serve principalmente a:",
    correct: "preservar a percepção contínua do espaço e fazer o espectador acompanhar o percurso em tempo real.",
    wrong: ["acelerar a ação, já que os cortes rápidos encurtam o tempo de tela de cada pessoa.", "substituir a trilha sonora, pois o plano-sequência dispensa qualquer som ambiente.", "destacar o rosto dos entrevistados por meio do enquadramento em primeiro plano.", "introduzir um elemento sobrenatural, recurso típico da linguagem do filme de terror."],
    explanation: "Sem cortes, o plano-sequência mantém a continuidade espacial e temporal, valorizando o trajeto filmado.",
    subject: S_LC,
  },
  {
    statement: "Um anúncio impresso de campanha de reciclagem mostra uma lata de alumínio esmagada cujo contorno forma uma árvore, com a legenda «Dê nova vida ao que já usou». O efeito de sentido decorre:",
    correct: "da imagem que redesenha o lixo como natureza, reforçando a reciclagem sem precisar explicá-la.",
    wrong: ["da repetição da palavra «vida» em várias línguas, recurso típico da sonoridade poética.", "do preço promocional da lata, informação essencial de qualquer anúncio de venda.", "da citação de norma legal sobre descarte, que dá autoridade científica ao texto.", "da ausência total de texto, já que anúncios multimodais nunca usam legendas."],
    explanation: "A diagramação da imagem (lata → árvore) e a legenda formam um enunciado multimodal: o descarte vira renascimento.",
    subject: S_LC,
  },
  {
    statement: "Num e-mail enviado à coordenação, um estudante escreveu: «A reunião foi remarcada para quinta-feira. O cardápio da cantina, portanto, será servido às 11h.» Sobre coesão e coerência, a leitura correta é:",
    correct: "o conector «portanto» liga ideias sem relação lógica entre si, quebrando a coerência do trecho.",
    wrong: ["o conectivo está correto, pois «portanto» pode introduzir qualquer informação nova.", "o problema está na vírgula, que nunca acompanha «portanto» dentro do período.", "a oração final deveria começar com «embora», para indicar contraste com a remarcação.", "o trecho viola a norma porque repete o sujeito «reunião» em duas orações seguidas."],
    explanation: "«Portanto» marca consequência; como o segundo período não decorre logicamente do primeiro, a coerência se rompe.",
    subject: S_LC,
  },
];
// ---- ENEM 2024 · Ciências Humanas e suas Tecnologias (25 itens) ----
const ITEMS_2024_CH: EnemItem[] = [
  {
    statement: "Num seminário, um aluno resume a República Velha assim: «São Paulo e Minas Gerais se revezavam na Presidência, enquanto as oligarquias rurais financiavam as campanhas.» Esse arranjo, chamado de política café com leite, caracterizava-se por:",
    correct: "acordo entre as oligarquias paulista e mineira para distribuir o poder, sustentado pelo voto de cabresto.",
    wrong: ["alternância democrática garantida pelo voto secreto de toda a população brasileira.", "governo direto dos trabalhadores urbanos, organizados por sindicatos e partidos.", "ditadura militar imposta pelos generais depois da Revolução de 1930.", "sistema parlamentar em que o Congresso indicava um primeiro-ministro a cada ano."],
    explanation: "A República Oligárquica (1889-1930) baseava-se em acordos de elites rurais e em eleições com voto aberto e manipulado.",
    subject: S_CH,
  },
  {
    statement: "Em 1943, o Estado novo consolidou a Consolidação das Leis do Trabalho. Sobre os direitos trabalhistas instituídos nesse período, é correto afirmar que:",
    correct: "a CLT assegurou jornada, férias e carteira assinada, ampliando a proteção do trabalhador sob controle do Estado.",
    wrong: ["garantia liberdade sindical plena, com greve livre reconhecida em qualquer empresa.", "resultou de negociação entre sindicatos independentes e patronato, sem intervenção estatal.", "extinguiu o salário mínimo, pois cada empresa poderia remunerar como quisesse.", "aboliu a carteira de trabalho, substituindo-a por contrato verbal regulado pelo mercado."],
    explanation: "A CLT centralizou a legislação trabalhista brasileira, com direitos formais ampliados, mas sob sindicatos tutelados pelo Estado.",
    subject: S_CH,
  },
  {
    statement: "Durante a ditadura militar brasileira, peças de teatro e matérias de jornal passavam por aprovação da censura federal antes de serem divulgadas. Essa prática violava principalmente o princípio da:",
    correct: "liberdade de expressão e de imprensa, assegurada como direito fundamental do cidadão.",
    wrong: ["federalismo, pois a censura deveria ser aplicada somente pelos governos estaduais.", "inviolabilidade do domicílio dos autores, garantida pela Constituição vigente.", "livre trânsito no território nacional, já que os artistas eram impedidos de viajar.", "sigilo funcional dos servidores que avaliavam as obras antes da divulgação."],
    explanation: "A censura prévia impede a circulação de ideias antes de ocorrer e atinge diretamente a liberdade de expressão.",
    subject: S_CH,
  },
  {
    statement: "A Constituição de 1988 é conhecida como Constituição Cidadã por ampliar direitos sociais e políticos. Um exemplo concreto dessa ampliação é:",
    correct: "a previsão do SUS e da assistência à saúde gratuita como dever do Estado e direito de todos.",
    wrong: ["a manutenção do voto censitário nas eleições municipais até 1992.", "a proibição da greve em serviços essenciais, retirada da legislação anterior.", "a extinção dos partidos políticos, substituídos por conselhos comunitários.", "a criação do salário mínimo em 1988, que inexistia até então no país."],
    explanation: "A Carta de 1988 universalizou direitos sociais, entre eles a saúde pública gratuita (SUS) e a educação obrigatória.",
    subject: S_CH,
  },
  {
    statement: "A Lei Áurea, de 1888, declarou encerrada a escravização no Brasil, mas não previu políticas de inserção para as pessoas recém-libertadas. Essa ausência contribuiu para:",
    correct: "a persistência de desigualdades raciais e da concentração de renda e terra no país.",
    wrong: ["o fim imediato da imigração europeia para o Brasil no século XIX.", "a igualdade formal plena entre brancos e negros já na Primeira República.", "a devolução imediata de terras a todos os quilombos remanescentes em 1889.", "a proibição do trabalho assalariado para as pessoas libertas até 1930."],
    explanation: "Sem terra nem políticas públicas, a população liberta ficou à margem da cidadania, originando desigualdades estruturais.",
    subject: S_CH,
  },
  {
    statement: "Durante a Guerra Fria, muitos países recém-independentes da África e da Ásia recusaram alinhamento automático com Estados Unidos e União Soviética. Esse posicionamento ficou conhecido como:",
    correct: "neutralismo, expresso no Movimento dos Não Alinhados, que buscava autonomia diante dos blocos.",
    wrong: ["détente militar, aliança ofensiva firmada entre os dois blocos em 1949.", "cortina de ferro, política que dividia a Alemanha em duas repúblicas soberanas.", "confronto armado direto entre EUA e URSS no campo de batalha europeu.", "descolonização imposta pela ONU, que obrigava todas as colônias a um mesmo bloco."],
    explanation: "Os não alinhados defendiam autonomia internacional sem filiação automática ao capitalismo ou ao socialismo.",
    subject: S_CH,
  },
  {
    statement: "Vários conflitos contemporâneos no Oriente Médio e no Norte da África envolvem o controle de rios e aqüíferos que atravessam fronteiras. Esse quadro ilustra que:",
    correct: "recursos hídricos escassos podem se tornar fator de tensão política entre estados e populações.",
    wrong: ["a água é abundante na região e o conflito decorre apenas de diferenças religiosas.", "a ONU distribui a água dos rios entre os países, encerrando definitivamente as disputas.", "a escassez hídrica só atinge países sem litoral, nunca zonas costeiras do continente.", "o problema já foi superado pela dessalinização, que tornou a água praticamente ilimitada."],
    explanation: "Rios e aqüíferos compartilhados geram dependência mútua; quando escassos, tornam-se objeto de disputa geopolítica.",
    subject: S_CH,
  },
  {
    statement: "Em muitas cidades brasileiras, os empregos concentram-se no centro e quem mora na periferia depende de deslocamentos de várias horas. Esse padrão de uso do solo explica:",
    correct: "o tempo excessivo de deslocamento e a desigualdade de acesso aos serviços urbanos.",
    wrong: ["a ausência total de postos de trabalho nas zonas periféricas das grandes cidades.", "o fim da segregação socioespacial, já que todos usam o mesmo sistema de transporte.", "a distribuição equitativa dos equipamentos culturais por todos os bairros.", "a substituição completa do transporte coletivo pelo automóvel em todas as capitais."],
    explanation: "A separação entre onde se mora e onde se trabalha é característica da segregação socioespacial das metrópoles brasileiras.",
    subject: S_CH,
  },
  {
    statement: "Um smartphone é projetado em um país, com componentes de vários outros, montado em nação distinta e vendido em centenas de mercados. Essa fragmentação internacional da produção caracteriza:",
    correct: "a globalização produtiva, com cadeias globais de valor e divisão internacional do trabalho.",
    wrong: ["o autarquismo, política de fechamento da economia adotada por muitos países no século XX.", "o protecionismo, pois cada etapa do produto seria gravada pelo país que o vende.", "o mercantilismo, doutrina que proibia o comércio entre nações diferentes.", "a economia de subsistência, em que cada país produz tudo o que consome."],
    explanation: "Na economia globalizada, as etapas do processo produtivo se dispersam internacionalmente em busca de custos e especialização.",
    subject: S_CH,
  },
  {
    statement: "Uma empresa passa a medir, além do lucro, o impacto ambiental e social de suas operações, incorporando esses dados à estratégia de gestão. Essa prática corresponde ao conceito de:",
    correct: "sustentabilidade de triple bottom line, que integra dimensões econômica, social e ambiental.",
    wrong: ["externalidade negativa, quando o custo ambiental é repassado integralmente ao consumidor.", "capitalismo de vigilância, modelo baseado no controle de dados dos clientes.", "economia linear, sistema em que os insumos são descartados após um único uso.", "efeito estufa, processo natural de aquecimento do planeta pela atmosfera."],
    explanation: "O triple bottom line avalia resultados econômicos, sociais e ambientais em conjunto, em vez do lucro isolado.",
    subject: S_CH,
  },
  {
    statement: "Aplicativos de entrega usam algoritmos para definir rotas, metas e pagamentos, enquanto o entregador é registrado como autônomo e assume os próprios custos. Essa organização ilustra:",
    correct: "a precarização do trabalho sob controle digital, com riscos transferidos ao trabalhador.",
    wrong: ["o fordismo clássico, baseado em estações fixas e linha de montagem rígida.", "a cooperativa autogestionária, em que os trabalhadores são donos da plataforma.", "o trabalho voluntário sem remuneração, praticado por usuários da aplicação.", "a escalação formal com carteira assinada e jornada supervisionada dentro da fábrica."],
    explanation: "O trabalho em plataformas combina subordinação algorítmica com informalidade, deslocando proteções legais para o trabalhador.",
    subject: S_CH,
  },
  {
    statement: "Nos anos 1970, grupos de mulheres se organizaram em várias cidades brasileiras para denunciar desigualdades no trabalho, na família e na política. Essa mobilização contribuiu para:",
    correct: "avanços legislativos e a criação de políticas públicas de igualdade entre homens e mulheres.",
    wrong: ["a criação do voto feminino, conquistado apenas em 1932 no Brasil.", "o fim da industrialização brasileira, que teria retirado as mulheres do mercado.", "a proibição do trabalho feminino remunerado até a Constituição de 1988.", "a exclusão das mulheres das eleições até a promulgação da Constituição de 1946."],
    explanation: "Os movimentos feministas dos anos 1970 pressionaram por leis como a Lei do Divórcio (1977) e a Constituição de 1988.",
    subject: S_CH,
  },
  {
    statement: "Em aula de cidadania, o professor projetou a Declaração Universal dos Direitos Humanos, aprovada pela ONU em 1948, e perguntou qual é o fundamento dos direitos ali declarados. A resposta correta é:",
    correct: "a dignidade inerente a todo ser humano, sem distinção de origem, raça, sexo ou condição.",
    wrong: ["a propriedade privada como direito absoluto e prioritário sobre os demais.", "a obediência às leis nacionais, mesmo quando violam padrões internacionais.", "a força militar das nações vencedoras da Segunda Guerra Mundial.", "o credo religioso majoritário de cada país como base da cidadania."],
    explanation: "A Declaração de 1948 afirma que todos nascem livres e iguais em dignidade e direitos, fundamento da ordem internacional de direitos humanos.",
    subject: S_CH,
  },
  {
    statement: "Um gestor decide manter um funcionário no cargo apesar de a demissão aumentar os lucros da empresa, alegando que demiti-lo sem justa causa seria uma injustiça. Essa postura se aproxima da ética:",
    correct: "deontológica, que avalia a ação pelo dever e pela regra, independentemente do resultado.",
    wrong: ["utilitarista, que calcula sempre o maior bem para o maior número de pessoas.", "epicurista, que busca o prazer imediato de todos os envolvidos na decisão.", "relativista, que nega a existência de qualquer critério universal de justiça.", "egoísta consequencialista, que considera apenas o ganho pessoal do gestor."],
    explanation: "Na ética deontológica (Kant), a ação vale pelo princípio que a sustenta, não pelas consequências que produz.",
    subject: S_CH,
  },
  {
    statement: "Hobbes e Rousseau discutiram o contrato social para explicar a origem do poder político. Em Rousseau, o contrato legítimo deve expressar:",
    correct: "a vontade geral, ou seja, o interesse comum deliberado pelos cidadãos em conjunto.",
    wrong: ["a vontade do monarca, considerada expressão direta da vontade divina.", "o interesse dos proprietários de terra, único grupo capaz de legislar.", "a liberdade absoluta do indivíduo, sem nenhuma obrigação perante a sociedade.", "a força militar como única fonte legítima do poder político e das leis."],
    explanation: "Para Rousseau, a legitimidade nasce da vontade geral, na qual cada cidadão obedece a uma lei que ajudou a decidir.",
    subject: S_CH,
  },
  {
    statement: "Uma cidade registra sua festa junina e os saberes dos sanfoneiros locais como patrimônio cultural. O reconhecimento de práticas, festas e saberes coletivos caracteriza o:",
    correct: "patrimônio imaterial, que valoriza formas de vida e expressões coletivas, não só bens materiais.",
    wrong: ["patrimônio natural, categoria reservada a parques nacionais e reservas ambientais.", "propriedade intelectual individual do artista, que impede qualquer reprodução da prática.", "exclusividade da prática, proibida em outras cidades do mesmo estado.", "valor comercial da festa, que passa a ser vendido obrigatoriamente a empresas estrangeiras."],
    explanation: "Bens imateriais — festas, saberes, oralidade, rituais — são reconhecidos pela Constituição de 1988 e pela UNESCO.",
    subject: S_CH,
  },
  {
    statement: "Um gráfico demográfico mostra que a proporção de crianças caiu enquanto a de pessoas acima de 60 anos aumentou na última década. A leitura correta dos dados é:",
    correct: "o país vive o envelhecimento populacional, com reflexos diretos em previdência e cuidados de saúde.",
    wrong: ["o aumento explosivo da natalidade, que exigiria mais escolas em poucos anos.", "a migração internacional em massa de jovens para o exterior no período.", "a diminuição da expectativa de vida ao nascer em todo o território nacional.", "o êxodo urbano acelerado, que esvazia as cidades brasileiras."],
    explanation: "Quando a proporção de idosos cresce e a de crianças diminui, fala-se em transição demográfica e envelhecimento.",
    subject: S_CH,
  },
  {
    statement: "Dois mapas do mesmo bairro foram impressos na mesma folha, um na escala 1:5.000 e outro na escala 1:25.000. Ao compará-los, é correto afirmar que:",
    correct: "o mapa 1:5.000 cobre uma área menor e apresenta mais detalhes do território representado.",
    wrong: ["o mapa 1:25.000 é sempre mais detalhado, pois traz números maiores na escala.", "as duas escalas representam exatamente a mesma área, variando apenas as cores.", "o mapa 1:5.000 cobre território maior, já que seu denominador é menor.", "a escala não influencia o conteúdo do mapa, apenas o tamanho do papel utilizado."],
    explanation: "Quanto menor o denominador da escala, maior é a representação gráfica de cada detalhe e menor a área coberta na folha.",
    subject: S_CH,
  },
  {
    statement: "Um jornal noticia que o IPCA subiu 0,5% no mês e que a inflação acumulada em 12 meses chegou a 4,2%. Para o leitor, esses dois números expressam:",
    correct: "a variação média dos preços consumidos pela população, primeiro no mês e depois no ano.",
    wrong: ["a taxa de juros que o Banco Central cobra dos empréstimos pessoais concedidos.", "o crescimento do produto interno bruto do país no último trimestre apurado.", "a variação do câmbio entre o real e o dólar no período de doze meses.", "o índice de desemprego registrado nas capitais brasileiras no mesmo período."],
    explanation: "O IPCA é o índice oficial de inflação: mede a variação de preços no mês e acumulada ao longo de 12 meses.",
    subject: S_CH,
  },
  {
    statement: "Um vídeo afirma que uma lei recém-aprovada «proíbe o café» no país; jornais verificam que o texto trata apenas da rotulagem obrigatória de produtos. Esse caso exemplifica:",
    correct: "desinformação, quando uma informação é distorcida ou descontextualizada para enganar.",
    wrong: ["liberdade de imprensa, já que qualquer veículo pode publicar o que desejar.", "opinião legítima, pois interpretações divergentes são sempre permitidas em democracia.", "censura prévia, prática em que o Estado impede a divulgação antes que ela ocorra.", "framing jornalístico neutro, recurso que apresenta todos os lados com o mesmo peso."],
    explanation: "Diferente da opinião, a desinformação veicula afirmação falsa ou fora de contexto com aparência de notícia.",
    subject: S_CH,
  },
  {
    statement: "Entre 1950 e 1980, milhões de famílias deixaram o campo brasileiro rumo às cidades, muitas vezes em fuga da seca e da falta de trabalho. Esse processo é chamado de:",
    correct: "êxodo rural, deslocamento populacional do campo para a cidade em busca de melhores condições.",
    wrong: ["êxodo urbano, retorno em massa das cidades para o interior no mesmo período.", "imigração, chegada de povos de outros continentes em navios no litoral.", "colonização, ocupação planejada de territórios sem população anterior.", "turismo, deslocamento temporário por lazer sem mudança de residência."],
    explanation: "O êxodo rural acelerou a urbanização brasileira e gerou as periferias metropolitanas nos grandes centros.",
    subject: S_CH,
  },
  {
    statement: "No semiárido nordestino, onde muitos rios só correm em épocas de chuva, a construção de açudes e cisternas para acumular água da chuva busca enfrentar sobretudo:",
    correct: "a intermitência dos rios e a irregularidade das chuvas, características da região.",
    wrong: ["as enchentes frequentes causadas pelo excesso de precipitação anual.", "o excesso de água subterrânea que invade os porões das casas.", "o afundamento do solo provocado pela exploração intensiva de minérios.", "a salinização dos rios provocada pela maré em cidades do interior."],
    explanation: "No semiárido, a escassez e a sazonalidade da chuva exigem armazenamento local de água para o consumo humano.",
    subject: S_CH,
  },
  {
    statement: "Um país exporta grandes quantidades de café cru e importa praticamente toda a maquinaria agrícola que utiliza. Essa relação comercial mostra que o país:",
    correct: "ocupa posição periférica na divisão internacional do trabalho, exportando commodities e importando tecnologia.",
    wrong: ["pratica o livre-comércio total, sem nenhuma tarifa alfandegária sobre importações.", "atua em regime de autarquia, produzindo internamente tudo o que necessita.", "não mantém relações comerciais com outros países da mesma região.", "exporta produtos manufaturados de alto valor agregado e importa alimentos básicos."],
    explanation: "A troca desigual entre commodities baratas e bens de capital caros caracteriza a dependência tecnológica na economia mundial.",
    subject: S_CH,
  },
  {
    statement: "A Constituição brasileira prevê o voto obrigatório para determinados cidadãos. Essa regra expressa a concepção de que a participação política é:",
    correct: "também um dever do cidadão, e não apenas um direito a ser exercido quando conveniente.",
    wrong: ["facultativa em todos os casos, tornando as eleições legítimas apenas com abstenção livre.", "exigida apenas de maiores de 70 anos, que perdem direitos políticos após essa idade.", "obrigatória também para analfabetos e menores de 16 anos, sem exceção.", "exigida somente em eleições nacionais, nunca nas municipais do país."],
    explanation: "Entre 18 e 70 anos o voto é obrigatório (com exceções como analfabetos e maiores de 70); a obrigatoriedade exprime dever cívico.",
    subject: S_CH,
  },
  {
    statement: "Pinturas rupestres encontradas em abrigos rochosos retratam cenas de caça e figuras humanas, ajudando a reconstruir a vida dos primeiros habitantes da região. Essas marcas são valiosas porque:",
    correct: "registram cotidiano e crenças de povos sem escrita, funcionando como fontes arqueológicas.",
    wrong: ["substituem integralmente os documentos escritos da história colonial brasileira.", "provam que a escrita alfabética existia na América antes da chegada de 1500.", "são obras fictícias, sem qualquer valor para a reconstrução do passado.", "pertencem exclusivamente à arte europeia trazida pelos colonizadores."],
    explanation: "Em ausência de escrita, arqueologia e iconografia tornam-se as principais fontes sobre o período pré-histórico.",
    subject: S_CH,
  },
];
// ---- ENEM 2024 · Ciências da Natureza e suas Tecnologias (25 itens) ----
const ITEMS_2024_CN: EnemItem[] = [
  {
    statement: "Numa lagoa, a energia passa do fitoplancton ao zooplâncton, deste ao peixe pequeno e deste ao golfinho que dele se alimenta. Sobre a transferência de energia entre níveis tróficos, é correto afirmar que:",
    correct: "cerca de 10% da energia de um nível passa ao seguinte; o restante é perdido, sobretudo como calor.",
    wrong: ["toda a energia captada por cada nível chega integralmente ao nível seguinte, sem perdas.", "cerca de 90% da energia é aproveitada pelo consumidor seguinte em cada salto trófico.", "a energia aumenta a cada nível, pois os consumidores acumulam calor extra do ambiente.", "a energia se cria nos consumidores, que produzem matéria nova a partir do nada."],
    explanation: "Na regra dos 10%, apenas uma fração pequena é convertida em biomassa do nível superior; o resto é dissipado.",
    subject: S_CN,
  },
  {
    statement: "Após um incêndio que destruiu a vegetação de uma área, gramíneas e arbustos começaram a predominar antes do retorno da floresta madura. Esse processo corresponde a uma:",
    correct: "sucessão ecológica secundária, que parte de um solo já existente após a perturbação.",
    wrong: ["sucessão primária, que se inicia sobre rocha nua sem solo formado.", "relação de amensalismo, em que uma espécie impede o crescimento da outra.", "transição para clímax imutável, estado final que nunca mais se modifica.", "bioinvasão, chegada de espécies exóticas trazidas pelo homem durante o incêndio."],
    explanation: "Quando o solo permanece após a perturbação, a regeneração é secundária e é mais rápida que a colonização primária.",
    subject: S_CN,
  },
  {
    statement: "Pesquisadores notaram que líquens desapareceram dos troncos próximos a uma fábrica e retornaram depois da instalação de filtros de partículas. Os líquens são bons bioindicadores porque:",
    correct: "são sensíveis à qualidade do ar, e sua presença ou ausência reflete a poluição atmosférica local.",
    wrong: ["absorvem toda a poluição do ambiente e a transformam diretamente em alimento.", "só crescem em regiões sem chuva, o que indica automaticamente clima seco na área.", "substituem os microorganismos do solo, elevando a fertilidade da terra agrícola.", "produzem flores apenas quando o ar está livre de qualquer gás presente na atmosfera."],
    explanation: "Líquens absorvem nutrientes do ar e são pouco tolerantes a poluentes; por isso são usados como indicadores de qualidade do ar.",
    subject: S_CN,
  },
  {
    statement: "Em ervilhas, a semente lisa (L) domina sobre a rugosa (l). Cruzando dois heterozigotos (Ll × Ll), espera-se nos descendentes:",
    correct: "75% de sementes lisas e 25% de sementes rugosas, na proporção mendeliana de 3:1.",
    wrong: ["100% de sementes lisas, pois o gene dominante elimina completamente o recessivo.", "50% de sementes lisas e 50% de sementes rugosas, em proporção exatamente igual.", "25% de sementes lisas e 75% de sementes rugosas, invertendo a proporção esperada.", "somente sementes rugosas, já que dois pais heterozigotos só transmitem o gene l."],
    explanation: "O cruzamento Ll × Ll produz 25% LL, 50% Ll e 25% ll; como L é dominante, 75% manifestam a semente lisa.",
    subject: S_CN,
  },
  {
    statement: "O cariótipo de uma criança revela três cópias do cromossomo 21 em suas células. A explicação biológica mais adequada para essa condição é:",
    correct: "não-disjunção na formação dos gametas, gerando óvulo ou espermatozóide com cópia cromossômica extra.",
    wrong: ["mutação induzida por vírus que duplica todos os cromossomos da célula ao mesmo tempo.", "herança dominante transmitida pelo pai em todas as gerações da mesma família.", "contaminação ambiental que altera a forma do cromossomo depois do nascimento.", "troca normal de material entre cromossomos homólogos durante a meiose."],
    explanation: "A trisomia do par 21 decorre da não-disjunção meiótica, em que um gameta recebe cópia extra do cromossomo.",
    subject: S_CN,
  },
  {
    statement: "Em uma estufa, o aumento da intensidade de luz não elevou a produção de oxigênio das plantas, mas o aumento da concentração de CO2 elevou. A leitura correta é que:",
    correct: "a luz já não era o fator limitante; era a disponibilidade de CO2 que condicionava a taxa fotossintética.",
    wrong: ["a fotossíntese independe de luz e de CO2, variando apenas com a temperatura ambiente.", "o oxigênio produzido é consumido integralmente pela própria planta dentro da célula.", "plantas com excesso de luz deixam de realizar fotossíntese de forma permanente.", "o CO2 é produto da fotossíntese e por isso não pode limitar a reação."],
    explanation: "Quando um fator deixa de limitar o processo, outro passa a condicionar a velocidade: aqui, o CO2 da fase de fixação.",
    subject: S_CN,
  },
  {
    statement: "Folhas verdes captam um gás da atmosfera durante o dia para produzir glicose e liberam outro gás como produto. Considerando fotossíntese, os gases captado e liberado no período diurno são, respectivamente:",
    correct: "gás carbônico (CO2) e oxigênio (O2).",
    wrong: ["oxigênio (O2) e gás carbônico (CO2).", "nitrogênio (N2) e oxigênio (O2).", "vapor d'água (H2O) e gás argônio (Ar).", "gás carbônico (CO2) e nitrogênio (N2)."],
    explanation: "Na fotossíntese, o CO2 é fixado para formar glicose e o O2 é liberado como subproduto da quebra da água.",
    subject: S_CN,
  },
  {
    statement: "Uma cidade imunizou alta proporção da população contra o sarampe, reduzindo a circulação do vírus mesmo entre quem não foi vacinado. Esse fenômeno é chamado de:",
    correct: "imunidade de rebanho: ao diminuir os indivíduos suscetíveis, limita-se a transmissão da doença.",
    wrong: ["efeito colateral da vacina, reação adversa observada simultaneamente em todo o grupo.", "resistência natural da população, que já teria contato anterior com o vírus.", "seleção de cepas mais fráceis do vírus provocada pela vacinação em massa.", "imunidade adquirida por todos os moradores, inclusive os que não tomaram a vacina."],
    explanation: "A imunidade de rebanho protege indiretamente os não vacinados porque o agente encontra menos hóspedes suscetíveis.",
    subject: S_CN,
  },
  {
    statement: "Em um ano, foram registrados 200 novos casos de uma doença numa cidade de 10.000 habitantes, e ao final do período havia 500 pessoas doentes. O número 200 corresponde à:",
    correct: "incidência: casos novos ocorridos no período, sobre a população em risco.",
    wrong: ["prevalência: total de doentes existentes na cidade ao final do ano.", "mortalidade: número de óbitos causados pela doença no mesmo período.", "letalidade: proporção de doentes que morreram em relação aos casos.", "endemicidade: quantidade de casos importados de outras regiões do país."],
    explanation: "Incidência conta apenas os casos novos no intervalo; prevalência conta todos os existentes, incluindo os antigos.",
    subject: S_CN,
  },
  {
    statement: "O uso inadequado de antibióticos seleciona bactérias resistentes, que se multiplicam e propagam os genes de resistência. Esse processo é um exemplo de:",
    correct: "seleção natural: os indivíduos menos sensíveis ao antibiótico sobrevivem e se reproduzem mais.",
    wrong: ["adaptação intencional do organismo, que aprende a tolerar o remédio durante a própria vida.", "mutação dirigida pelo antibiótico, que produz exatamente a alteração necessária à sobrevivência.", "herança de características adquiridas, transmitidas aos filhos após o contato com a droga.", "extinção das bactérias sensíveis sem nenhuma vantagem específica para as resistentes."],
    explanation: "O antibiótico não cria a resistência: atua como agente seletivo que favorece bactérias já resistentes.",
    subject: S_CN,
  },
  {
    statement: "Ao estudar combustíveis, uma turma comparou metano (CH4), etano (C2H6) e etanol (C2H5OH). Sobre essas substâncias, é correto afirmar que:",
    correct: "metano e etano são hidrocarbonetos, enquanto o etanol é um composto orgânico oxigenado.",
    wrong: ["os três são hidrocarbonetos, pois todos contêm carbono e hidrogênio na molécula.", "nenhum pode ser considerado orgânico, pois só moléculas de cadeia longa são orgânicas.", "etanol e etano são hidrocarbonetos, enquanto o metano contém oxigênio na molécula.", "os três são inorgânicos, porque o carbono só forma compostos combinados ao oxigênio."],
    explanation: "Hidrocarbonetos contêm apenas C e H; compostos com oxigênio, como o etanol, são orgânicos oxigenados.",
    subject: S_CN,
  },
  {
    statement: "Uma turma balanceou a combustão completa do metano e obteve a equação CH4 + 2O2 → CO2 + 2H2O. Considerando os coeficientes, a proporção molar entre o O2 consumido e o H2O produzido é:",
    correct: "2 mols de O2 para cada 2 mols de H2O, ou seja, razão igual a 1:1.",
    wrong: ["1 mol de O2 para cada 2 mols de H2O produzidos na reação.", "2 mols de O2 para cada 1 mol de H2O produzido na reação.", "3 mols de O2 para cada 2 mols de H2O, segundo a massa molar dos gases.", "4 mols de O2 para cada 2 mols de H2O, pela valência do carbono."],
    explanation: "Os coeficientes indicam 2 mols de O2 e 2 mols de H2O: a razão molar é 2:2 = 1:1.",
    subject: S_CN,
  },
  {
    statement: "Soluções de limão (pH ≈ 2,5) e de bicarbonato de sódio (pH ≈ 8) foram testadas com papel indicador. Sobre a escala de pH, é correto afirmar que:",
    correct: "o limão é ácido e o bicarbonato é básico; quanto menor o pH, maior a concentração de H+.",
    wrong: ["ambas são ácidas, pois o bicarbonato contém sódio em sua composição química.", "quanto maior o pH, maior a concentração de íons H+ na solução examinada.", "o pH mede a temperatura da solução, e não sua acidez relativa.", "o bicarbonato é ácido porque seu pH é maior que o do limão."],
    explanation: "O pH varia de 0 a 14: valores abaixo de 7 indicam acidez (maior [H+]) e acima de 7, alcalinidade.",
    subject: S_CN,
  },
  {
    statement: "Numa reação química, 16 g de metano reagem com 64 g de oxigênio e resulta em 44 g de gás carbônico. Pela lei de conservação das massas, a massa de água formada é:",
    correct: "36 g, pois a soma das massas dos produtos (44 + 36) iguala a dos reagentes (16 + 64).",
    wrong: ["20 g, diferença entre as massas de oxigênio e metano que reagiram.", "44 g, já que a massa da água sempre iguala a do gás carbônico produzido.", "80 g, soma de todas as massas envolvidas na equação da reação.", "16 g, valor igual à massa inicial do metano consumido na reação."],
    explanation: "Massa dos reagentes = 16 + 64 = 80 g; logo, água = 80 − 44 = 36 g.",
    subject: S_CN,
  },
  {
    statement: "Um ônibus percorre 120 km em 2 h e, no trecho seguinte de 60 km, gasta 1,5 h. A velocidade média de todo o percurso, expressa em km/h, é:",
    correct: "60 km/h, obtida pela distância total (180 km) dividida pelo tempo total (3 h).",
    wrong: ["50 km/h, média aritmética entre as velocidades dos dois trechos percorridos.", "90 km/h, distância total dividida somente pelas 2 horas do primeiro trecho.", "40 km/h, valor correspondente exclusivamente ao segundo trecho do percurso.", "66,7 km/h, razão entre o tempo total e a metade da distância percorrida."],
    explanation: "Velocidade média global é distância total ÷ tempo total: 180 km ÷ 3 h = 60 km/h.",
    subject: S_CN,
  },
  {
    statement: "Num trecho de ensaio, um carro parte do repouso e atinge a velocidade de 20 m/s em 5 segundos, com aceleração constante. Sobre esse movimento, é correto afirmar que:",
    correct: "a aceleração é de 4 m/s² e o deslocamento no intervalo foi de 50 m.",
    wrong: ["a aceleração é de 4 m/s², mas o deslocamento foi de 100 m no intervalo.", "a velocidade final é de 10 m/s, pois metade de 20 m/s vale para 5 s.", "o carro manteve velocidade constante de 20 m/s durante todo os 5 segundos.", "a aceleração é de 0,4 m/s² e o deslocamento foi de apenas 25 m."],
    explanation: "a = Δv/Δt = 20/5 = 4 m/s²; s = ½at² = ½ × 4 × 25 = 50 m.",
    subject: S_CN,
  },
  {
    statement: "Uma pedra é solta de um ponto alto e cai em queda livre, desprezando-se a resistência do ar. Sabendo que g = 10 m/s², após 3 s ela percorreu:",
    correct: "45 m, calculados por s = ½ · g · t² = ½ × 10 × 9.",
    wrong: ["30 m, valor obtido pela simples multiplicação de g pelo tempo.", "90 m, obtido multiplicando a velocidade final de 30 m/s pelo tempo.", "60 m, resultado de dividir g pelo quadrado do tempo em segundos.", "15 m, metade da distância percorrida na primeira hora de queda."],
    explanation: "Na queda livre, s = ½gt² = ½ × 10 × 3² = 45 m.",
    subject: S_CN,
  },
  {
    statement: "Para repor material no estoque, um motor eleva um caixote de 500 N até uma prateleira de 2 m de altura, levando 4 s para a manobra. A potência média desenvolvida é:",
    correct: "250 W, pois a potência é o trabalho dividido pelo tempo: (500 × 2)/4.",
    wrong: ["100 W, obtida dividindo a altura alcançada pela força aplicada ao caixote.", "4.000 W, calculada multiplicando força, altura e tempo da manobra.", "1.250 W, correspondente à força dividida pelo tempo em segundos.", "250 kW, já que todo trabalho mecânico deve ser expresso em quilowatts."],
    explanation: "P = W/t = (F × h)/t = (500 × 2)/4 = 250 W.",
    subject: S_CN,
  },
  {
    statement: "Com força horizontal constante de 60 N, um estudante desloca um caixote 3 m sobre uma mesa nivelada, sem atrito. O trabalho realizado por essa força é:",
    correct: "180 J, igual ao produto da força pelo deslocamento no sentido da força.",
    wrong: ["20 J, obtido pela diferença entre a força e o deslocamento medidos.", "0 J, pois o caixote permanece em equilíbrio sobre a mesa durante o movimento.", "18 J, valor da força multiplicada pelo deslocamento e dividido por 10.", "63 J, soma aritmética da força com o deslocamento expresso em metros."],
    explanation: "W = F · d = 60 × 3 = 180 J, já que a força age no mesmo sentido do deslocamento.",
    subject: S_CN,
  },
  {
    statement: "Em um laboratório de física, mediu-se uma onda sonora com frequência de 250 Hz propagando-se no ar a 340 m/s. O comprimento dessa onda é:",
    correct: "1,36 m, calculado por λ = v/f = 340/250.",
    wrong: ["85.000 m, resultado da multiplicação da velocidade pela frequência.", "0,74 m, obtido dividindo a frequência pela velocidade de propagação.", "590 m, soma da velocidade com a frequência da onda medida.", "250 m, valor numérico igual à frequência, lido diretamente em metros."],
    explanation: "Da relação v = λ · f, obtém-se λ = v/f = 340/250 = 1,36 m.",
    subject: S_CN,
  },
  {
    statement: "Durante uma tempestade, o relâmpago é visto antes de ouvirmos o trovão. Essa diferença de percepção explica-se pelo fato de que:",
    correct: "a luz propaga-se muito mais rápido que o som, chegando primeiro ao observador.",
    wrong: ["o som só se propaga em meios líquidos, atrasando sua chegada pelo ar.", "o trovão é produzido horas depois do relâmpago pela mesma nuvem.", "a luz sofre refração que atrasa sensivelmente sua chegada aos olhos.", "os olhos processam informações mais devagar que os ouvidos processam sons."],
    explanation: "A luz viaja a ~300.000 km/s e o som a ~340 m/s no ar; por isso vemos o raio antes de ouvir o trovão.",
    subject: S_CN,
  },
  {
    statement: "Um município quer reduzir a emissão de gases de efeito estufa em sua matriz elétrica. A alternativa que mais contribui para esse objetivo é:",
    correct: "substituir usinas térmicas a combustíveis fósseis por usinas solares e eólicas.",
    wrong: ["ampliar a queima de carvão mineral, que possui o maior poder calorífico disponível.", "aumentar a geração a diesel em geradores instalados em cada residência da cidade.", "manter usinas a óleo combustível, por serem mais baratas de serem operadas.", "instalar mais geradores a gasolina nos pontos de recarga urbana da região."],
    explanation: "Fontes solares e eólicas não emitem CO2 na geração, ao contrário dos combustíveis fósseis queimados nas térmicas.",
    subject: S_CN,
  },
  {
    statement: "Árvores maduras capturam CO2 atmosférico e o incorporam em sua madeira; ao serem derrubadas e transformadas em móveis duráveis, o carbono nele contido:",
    correct: "permanece estocado por mais tempo, adiando temporariamente seu retorno ao ciclo do carbono.",
    wrong: ["volta imediatamente à atmosfera, pois madeira jamais contém carbono em sua estrutura.", "transforma-se em oxigênio e é liberado pelas raízes da planta para o solo.", "desaparece da biosfera, deixando de participar de qualquer ciclo biogeoquímico.", "é absorvido pelo solo e convertido em petróleo em poucos anos de pressão."],
    explanation: "A madeira em uso prolongado mantém o carbono fixo; a decomposição ou a queima devolve o CO2 à atmosfera.",
    subject: S_CN,
  },
  {
    statement: "Certas formigas protegem plantas de insetos que as atacam e, em troca, recebem alimento e abrigo dessas mesmas plantas. Essa relação entre as duas espécies é:",
    correct: "mutualismo, pois ambas as espécies obtêm benefício da associação.",
    wrong: ["comensalismo, em que uma espécie se beneficia e a outra não é afetada.", "parasitismo, em que uma espécie vive à custa da outra, causando-lhe dano.", "amensalismo, em que uma espécie é inibida e a outra não apresenta alteração.", "competição, em que as duas disputam o mesmo recurso limitado do ambiente."],
    explanation: "Quando há benefício recíproco (formigas protegem; plantas hospedam e alimentam), caracteriza-se o mutualismo.",
    subject: S_CN,
  },
  {
    statement: "Dois pais, ambos portadores saudáveis do gene recessivo de uma doença hereditária, tiveram filhos. Sobre o risco genético do casal, é correto afirmar que:",
    correct: "cada filho tem 25% de chance de ser doente e 50% de chance de ser portador saudável.",
    wrong: ["todos os filhos serão doentes, pois ambos os pais carregam o gene recessivo.", "filhas serão doentes e filhos saudáveis, pois o gene está ligado ao cromossomo Y.", "a chance de doença é de 50%, igual à proporção de gametas com o gene recessivo.", "nenhum filho poderá ser afetado, pois os pais são apenas portadores saudáveis."],
    explanation: "No cruzamento Aa × Aa, nasce 25% aa (doente), 50% Aa (portador) e 25% AA (sem o gene).",
    subject: S_CN,
  },
];
// ---- ENEM 2024 · Matemática e suas Tecnologias (25 itens) ----
const ITEMS_2024_MT: EnemItem[] = [
  {
    statement: "Uma loja de materiais escolares anunciou uma jaqueta por R$ 250,00 com descontos sucessivos de 20% e 10% aplicados no caixa. O valor final pago pelo produto será de:",
    correct: "R$ 180,00, pois os descontos sucessivos equivalem a 28% sobre o preço cheio.",
    wrong: ["R$ 175,00, resultado da soma dos dois percentuais (30%) descontados do preço.", "R$ 200,00, valor obtido aplicando apenas o primeiro desconto de 20%.", "R$ 225,00, valor obtido aplicando apenas o segundo desconto de 10%.", "R$ 170,00, cálculo feito sobre um preço base de R$ 566,66."],
    explanation: "250 × 0,80 = 200 e 200 × 0,90 = 180. Descontos sucessivos não se somam.",
    subject: S_MT,
  },
  {
    statement: "Uma cooperativa vendeu 4.000 caixas de laranja em uma safra; na safra seguinte, a demanda aumentou 5% sobre a mesma base de comparação. A nova quantidade vendida foi de:",
    correct: "4.200 caixas, obtidas acrescentando 5% de 4.000 ao total anterior.",
    wrong: ["4.005 caixas, somando simplesmente 5 unidades ao total da safra anterior.", "4.400 caixas, aplicando-se um aumento de 10% sobre a safra anterior.", "3.800 caixas, pois o percentual de 5% representaria queda da demanda.", "400 caixas, valor correspondente apenas aos 5% calculados sobre o total."],
    explanation: "4.000 × 0,05 = 200; logo, 4.000 + 200 = 4.200 caixas.",
    subject: S_MT,
  },
  {
    statement: "Um capital de R$ 2.000,00 foi aplicado a juros compostos de 5% ao ano durante 2 anos. Considerando o capitalizado a cada ano, o montante final será de:",
    correct: "R$ 2.205,00, porque os juros do primeiro ano também renderão no segundo.",
    wrong: ["R$ 2.200,00, valor correspondente ao cálculo com juros simples.", "R$ 2.100,00, montante acumulado após apenas um ano de aplicação.", "R$ 2.420,00, resultado de aplicar 10% ao ano em juros compostos.", "R$ 2.050,00, acrescendo ao capital apenas 5% de um único juro."],
    explanation: "M = 2.000 × 1,05² = 2.000 × 1,1025 = R$ 2.205,00.",
    subject: S_MT,
  },
  {
    statement: "Um mapa está na escala 1:50.000 e mostra uma rodovia medindo 8 cm entre dois postos de serviço. A distância real correspondente é de:",
    correct: "4 km, obtida convertendo 400.000 cm em quilômetros.",
    wrong: ["40 km, resultado de uma conversão errada dos centímetros para metros.", "400 m, valor obtido dividindo os 8 cm pela escala indicada.", "80 km, correspondente ao dobro da medida real da rodovia.", "4 m, conversão direta dos centímetros do mapa sem usar a escala."],
    explanation: "8 cm × 50.000 = 400.000 cm = 4.000 m = 4 km.",
    subject: S_MT,
  },
  {
    statement: "Um trem percorre 300 km em 4 horas. Mantido o mesmo ritmo médio de velocidade, que distância será percorrida em 6 horas de viagem?",
    correct: "450 km, já que a velocidade média de 75 km/h multiplicada por 6 h dá 450 km.",
    wrong: ["400 km, valor obtido somando 100 km por hora adicional de viagem.", "75 km, que corresponde à velocidade média em km/h, não à distância.", "300 km, pois a distância percorrida não variaria com o tempo de viagem.", "540 km, obtido multiplicando a distância de 300 km pelo tempo em horas."],
    explanation: "v = 300/4 = 75 km/h; d = 75 × 6 = 450 km.",
    subject: S_MT,
  },
  {
    statement: "A função afim f(x) = 3x − 7 representa, em reais, o custo de envio de um pacote de x kg. O custo de envio de um pacote que pesa 4 kg é de:",
    correct: "R$ 5,00, calculado por 3 × 4 − 7.",
    wrong: ["R$ 19,00, obtido somando 3 × 4 + 7, invertendo o sinal da operação.", "R$ 12,00, correspondente apenas ao produto do coeficiente pelo peso.", "R$ 7,00, valor do termo constante da função desconsiderando o peso.", "R$ 2,00, diferença entre o coeficiente 3 e o peso de 4 kg somada a 1."],
    explanation: "f(4) = 3 × 4 − 7 = 12 − 7 = 5.",
    subject: S_MT,
  },
  {
    statement: "Uma empresa de entregas cobra um valor fixo de R$ 5,00 mais R$ 2,00 por quilômetro rodado. O preço cobrado por uma entrega feita a uma distância de 12 km é de:",
    correct: "R$ 29,00, resultado de 5 + (2 × 12).",
    wrong: ["R$ 24,00, valor apenas da parte variável do frete.", "R$ 17,00, soma do valor fixo com a distância em quilômetros.", "R$ 34,00, total acrescido de mais um valor fixo de R$ 5,00.", "R$ 60,00, obtido multiplicando o valor fixo pela distância."],
    explanation: "Total = 5 + 2 × 12 = 5 + 24 = R$ 29,00.",
    subject: S_MT,
  },
  {
    statement: "Ao calcular a largura de um retângulo, um estudante montou a equação x² − 5x + 6 = 0. As raízes dessa equação, que indicam as medidas possíveis, são:",
    correct: "x = 2 e x = 3, cuja soma é 5 e cujo produto é 6.",
    wrong: ["x = 1 e x = 6, valores cujo produto é 6, mas cuja soma é 7.", "x = −2 e x = −3, que multiplicam para 6, mas somam −5.", "x = 2,5 e x = 2,5, raízes repetidas obtidas com discriminante nulo.", "x = 0 e x = 5, obtidas anulando separadamente cada termo da expressão."],
    explanation: "x² − 5x + 6 = (x − 2)(x − 3), logo as raízes são 2 e 3.",
    subject: S_MT,
  },
  {
    statement: "A altura de um foguete de brinquedo, em metros, após t segundos é dada por h(t) = −5t² + 20t. A altura máxima atingida pelo foguete é de:",
    correct: "20 m, atingida no vértice, quando t = 2 s.",
    wrong: ["40 m, obtida multiplicando 20 por 2 e ignorando o termo quadrático.", "10 m, valor da altura no instante t = 1 s.", "15 m, correspondente à altura calculada em t = 3 s.", "5 m, valor numérico do coeficiente do termo quadrático."],
    explanation: "Vértice em t = −b/(2a) = −20/(−10) = 2 s; h(2) = −20 + 40 = 20 m.",
    subject: S_MT,
  },
  {
    statement: "Num projeto paisagístico, uma faixa de jardim em formato de trapézio recebeu bases de 8 m e 12 m e altura de 5 m. A área dessa faixa de jardim é de:",
    correct: "50 m², calculada pela média das bases multiplicada pela altura: 10 × 5.",
    wrong: ["100 m², obtida multiplicando a soma das bases pela altura, sem dividir por 2.", "60 m², correspondente à área do retângulo de 12 m por 5 m.", "40 m², valor obtido multiplicando apenas a base menor pela altura.", "20 m², resultado da simples soma das duas bases do trapézio."],
    explanation: "A = ((B + b)/2) × h = ((12 + 8)/2) × 5 = 10 × 5 = 50 m².",
    subject: S_MT,
  },
  {
    statement: "Um terreno comunitário em formato de polígono regular possui exatamente 8 lados iguais. A medida de cada ângulo interno desse polígono é de:",
    correct: "135°, calculada por ((8 − 2) × 180°)/8.",
    wrong: ["120°, valor próprio do ângulo interno do hexágono regular.", "144°, correspondente ao ângulo externo do pentágono regular.", "90°, ângulo interno esperado para um quadrado, não para oito lados.", "45°, valor do ângulo externo, não do ângulo interno, do polígono."],
    explanation: "Soma dos internos = (8 − 2) × 180° = 1.080°; dividido por 8 lados iguais, cada ângulo mede 135°.",
    subject: S_MT,
  },
  {
    statement: "Para decorar o pátio, a turma desenhou uma rosácea circular com raio de 10 cm no projeto da fachada. Usando π = 3,14, a área dessa rosácia circular é de:",
    correct: "314 cm², calculada por π × r² = 3,14 × 100.",
    wrong: ["62,8 cm², valor correspondente ao perímetro do círculo, não à área.", "31,4 cm², obtido multiplicando π apenas pela metade do raio.", "100 cm², resultado de elevar o raio ao quadrado sem multiplicar por π.", "628 cm², correspondente ao dobro da área correta do círculo."],
    explanation: "A = πr² = 3,14 × 10² = 3,14 × 100 = 314 cm².",
    subject: S_MT,
  },
  {
    statement: "Para calcular o rótulo, um estudante mediu uma lata de leite com raio da base de 5 cm e altura de 10 cm. Usando π = 3,14, o volume dessa lata é de:",
    correct: "785 cm³, calculado por π × r² × h = 3,14 × 25 × 10.",
    wrong: ["314 cm³, valor correspondente à área da superfície lateral da lata.", "157 cm³, obtido multiplicando π, o raio e a altura sem elevar o raio ao quadrado.", "392,5 cm³, metade do volume correto, com a altura reduzida pela metade.", "78,5 cm³, volume da base multiplicada por um décimo da altura."],
    explanation: "V = πr²h = 3,14 × 5² × 10 = 3,14 × 250 = 785 cm³.",
    subject: S_MT,
  },
  {
    statement: "Um fabricante de sorvetes usa cones com raio da base de 6 cm e altura de 10 cm. Usando π = 3,14, o volume de cada cone é de:",
    correct: "376,8 cm³, calculado por (π × r² × h)/3.",
    wrong: ["1.130,4 cm³, obtido sem dividir por 3, como se a forma fosse cilíndrica.", "188,4 cm³, resultado de dividir o volume do cilindro correspondente por 6.", "753,6 cm³, valor correspondente ao dobro do volume do cone.", "37,68 cm³, obtido com o raio elevado apenas à primeira potência."],
    explanation: "V = (πr²h)/3 = (3,14 × 36 × 10)/3 = 1.130,4/3 = 376,8 cm³.",
    subject: S_MT,
  },
  {
    statement: "Em um jogo de tabuleiro, dois dados justos são lançados simultaneamente. A probabilidade de a soma dos pontos mostrar exatamente 7 é de:",
    correct: "1/6, pois há 6 combinações favoráveis em 36 resultados possíveis.",
    wrong: ["1/12, valor obtido contando uma única combinação favorável.", "7/36, fração criada dividindo a soma desejada pelo total de resultados.", "1/9, razão entre 4 resultados favoráveis e 36 possíveis.", "1/2, suposição de que sair 7 é tão provável quanto não sair."],
    explanation: "As combinações que somam 7 são (1,6), (2,5), (3,4), (4,3), (5,2) e (6,1): 6/36 = 1/6.",
    subject: S_MT,
  },
  {
    statement: "Uma urna contém 5 bolas vermelhas e 3 bolas azuis, todas do mesmo tamanho e peso. Sorteando uma bola ao acaso, a probabilidade de ela ser azul é de:",
    correct: "3/8, pois há 3 bolas azuis entre as 8 bolas da urna.",
    wrong: ["5/8, fração que representa a chance de sortear bola vermelha.", "1/3, razão entre as duas cores presentes na urna.", "1/2, suposição de chance igual entre azul e vermelha.", "3/5, razão invertida entre azuis e vermelhas da urna."],
    explanation: "Probabilidade = casos favoráveis/possíveis = 3/(5 + 3) = 3/8.",
    subject: S_MT,
  },
  {
    statement: "Quatro amigos disputam a ordem de participação em um painel, e a sequência será sorteada. O número de ordens possíveis para os quatro participantes é de:",
    correct: "24 ordenações, resultado de 4! = 4 × 3 × 2 × 1.",
    wrong: ["16 ordenações, obtidas elevando o número de participantes ao quadrado.", "12 ordenações, valor da permutação de quatro elementos com dois fixos.", "10 ordenações, correspondente ao número de pares que podem se formar.", "4 ordenações, supondo que apenas o primeiro lugar pode variar."],
    explanation: "A ordenação de 4 elementos distintos é 4! = 24.",
    subject: S_MT,
  },
  {
    statement: "As cinco notas de um estudante nas provas mensais de uma disciplina foram 6, 7, 8, 9 e 15. A média aritmética dessas notas é igual a:",
    correct: "9,0, obtida dividindo a soma 45 pelo número de notas, 5.",
    wrong: ["8,0, valor da mediana dos cinco dados ordenados.", "11,25, resultado da divisão da soma das notas por quatro.", "7,5, média calculada apenas com as quatro menores notas.", "45,0, correspondente à soma das notas sem a divisão pelo total."],
    explanation: "(6 + 7 + 8 + 9 + 15)/5 = 45/5 = 9.",
    subject: S_MT,
  },
  {
    statement: "As idades de oito voluntários de um projeto comunitário são 18, 20, 22, 25, 27, 30, 33 e 40 anos. A mediana desse conjunto de dados é:",
    correct: "26 anos, média aritmética dos dois valores centrais, 25 e 27.",
    wrong: ["25 anos, quarto valor da sequência já ordenada.", "27 anos, quinto valor da sequência ordenada.", "30 anos, valor que divide o conjunto em partes iguais por acaso.", "24 anos, média entre a menor e a maior idade do grupo."],
    explanation: "Com 8 dados, a mediana é a média do 4º e do 5º valores: (25 + 27)/2 = 26.",
    subject: S_MT,
  },
  {
    statement: "Numa pesquisa de opinião sobre o melhor horário de aula, as respostas foram: 8h, 10h, 10h, 10h, 13h, 13h e 18h. A moda desse conjunto é:",
    correct: "10h, horário citado por mais estudantes (três vezes).",
    wrong: ["13h, segundo horário mais recorrente nas respostas.", "11,7h, valor correspondente à média aritmética dos horários.", "8h, primeiro horário listado na sequência de respostas.", "15h, valor central entre o menor e o maior horário citado."],
    explanation: "Moda é o valor de maior frequência: 10h aparece 3 vezes, mais que qualquer outro.",
    subject: S_MT,
  },
  {
    statement: "Num gráfico de setores circular sobre a opinião de 250 estudantes, o setor «concordo» ocupa 40% da figura. O número de estudantes que respondeu concordo é de:",
    correct: "100 estudantes, calculados por 40% de 250.",
    wrong: ["40 estudantes, valor lido diretamente do percentual sem aplicá-lo à base.", "150 estudantes, correspondentes aos 60% restantes do gráfico.", "62,5 estudantes, obtidos dividindo 40 por 0,4 em vez de multiplicar.", "25 estudantes, cálculo feito sobre uma base imaginária de 100 pessoas."],
    explanation: "250 × 0,40 = 100 estudantes.",
    subject: S_MT,
  },
  {
    statement: "O gráfico de barras de um produto mostra vendas de 200 unidades em 2023 e 250 unidades em 2024. O crescimento percentual registrado nesse período foi de:",
    correct: "25%, obtido dividindo o aumento de 50 unidades pela base de 200.",
    wrong: ["20%, obtido dividindo o aumento pela meta de 250 unidades do ano seguinte.", "50%, valor do aumento relativo às 50 unidades vendidas a mais.", "12,5%, razão do aumento dividido por 400, soma equivocada dos dois anos.", "5%, acréscimo de cinco unidades percentuais ao valor de 200."],
    explanation: "Crescimento = (250 − 200)/200 × 100% = 50/200 = 25%.",
    subject: S_MT,
  },
  {
    statement: "Uma escada de 20 m de comprimento apoia-se contra um telhado formando um ângulo de 30° com o solo. A altura máxima atingida pelo topo da escada é de:",
    correct: "10 m, pois a altura é a cateta oposta: 20 × sen 30° = 20 × 0,5.",
    wrong: ["17,3 m, valor obtido multiplicando 20 pelo cosseno de 30°.", "20 m, igual ao comprimento total da escada apoiada no telhado.", "11,5 m, calculado multiplicando a hipotenusa pela tangente de 30°.", "4 m, correspondente a um quinto do comprimento da escada."],
    explanation: "sen 30° = cateta oposta/hipotenusa; logo, altura = 20 × 0,5 = 10 m.",
    subject: S_MT,
  },
  {
    statement: "O sol projeta uma sombra de 10 m na horizontal para um poste de altura desconhecida, e o ângulo de elevação do sol é de 60°. A altura do poste é de:",
    correct: "17,3 m, pois a altura é 10 × tangente de 60° ≈ 10 × 1,73.",
    wrong: ["10 m, valor obtido com a tangente de 45° aplicada à sombra.", "8,7 m, calculado multiplicando a sombra pelo cosseno de 60°.", "5 m, correspondente à metade da medida da sombra projetada.", "30 m, obtido somando a sombra com o triplo de sua medida."],
    explanation: "tg 60° = altura/sombra; logo, altura = 10 × 1,73 ≈ 17,3 m.",
    subject: S_MT,
  },
  {
    statement: "Numa festa, 3 refrigerantes e 2 sucos somaram R$ 31,00, enquanto 1 refrigerante e 1 suco somaram R$ 11,00. Se x é o preço do refrigerante e y o do suco, o valor de x é:",
    correct: "R$ 9,00, resolvido pelo sistema 3x + 2y = 31 e x + y = 11.",
    wrong: ["R$ 2,00, correspondente ao valor de cada suco (y).", "R$ 11,00, total pago por uma unidade de cada bebida.", "R$ 7,75, obtido dividindo R$ 31,00 pelo número total de itens.", "R$ 15,50, valor da metade do primeiro total somado."],
    explanation: "Da segunda equação, y = 11 − x; substituindo: 3x + 22 − 2x = 31, logo x = 9.",
    subject: S_MT,
  },
];
// ---- ENEM 2025 · Linguagens, Códigos e suas Tecnologias (25 itens) ----
const ITEMS_2025_LC: EnemItem[] = [
  {
    statement: "Num bilhete deixado na sala dos professores, lia-se: «As novas professoras chegaram cedo e estão bastante ansiosa pela reunião.» A correção da frase exige:",
    correct: "trocar «ansiosa» por «ansiosas», para concordar com o sujeito plural «professoras».",
    wrong: ["trocar «estão» por «está», mantendo o verbo no singular da oração anterior.", "trocar «bastante» por «bastantes», pois o advérbio também precisa concordar.", "manter a frase como está, pois «bastante» altera o número do sujeito.", "trocar «chegaram» por «chegou», unificando o sujeito das duas orações."],
    explanation: "O predicativo «ansiosas» deve concordar com o sujeito «professoras», no plural feminino.",
    subject: S_LC,
  },
  {
    statement: "O mural da secretaria informava sobre o novo atendimento: «O balcão atende das 8h às 12h e das 13h às 17h, sem hora marcada.» O uso da crase em «às» está correto porque:",
    correct: "nas expressões de horário, a preposição «a» une-se ao artigo feminino «as», formando «às».",
    wrong: ["a crase ocorre porque os números 12 e 17 são considerados palavras femininas.", "as formas «às» foram usadas onde deveria prevalecer a preposição «de» sem artigo.", "a regra vale apenas para o primeiro limite de horário; o segundo ficaria sem crase.", "a crase é obrigatória antes de qualquer numeral, mesmo sem preposição no período."],
    explanation: "«De + as» e «a + as» fundem-se em «às» nas locuções de tempo: das 8h às 12h.",
    subject: S_LC,
  },
  {
    statement: "Numa enquete sobre aulas gravadas, um estudante escreveu: «Eu prefiro videoaula do que texto escrito para revisar conteúdo.» A frase fica de acordo com a norma-padrão se trocarmos «do que» por:",
    correct: "«a», pois o verbo preferir rege a preposição «a» entre os termos comparados.",
    wrong: ["«em», porque conteúdos digitais são sempre regidos pela preposição «em».", "«de», formando a locução «de que», obrigatória após verbos de comparação.", "«com», pois a comparação entre dois meios pede a preposição «com».", "«por», que indica a causa da preferência com a preposição causal «por»."],
    explanation: "Preferir A a B: o verbo rege a preposição «a» simples, sem crase nem «de».",
    subject: S_LC,
  },
  {
    statement: "Um redator revisou a frase «O relatório que ficou pronto ontem será apresentado hoje à equipe diretora» e hesitou quanto às vírgulas. O uso correto da pontuação determina que:",
    correct: "se cerquem «que ficou pronto ontem», oração explicativa que qualifica o sujeito sem restringi-lo.",
    wrong: ["se cerquem «será apresentado hoje», predicado que não admite interrupção alguma.", "não se use vírgula em nenhuma posição, pois frases com «que» dispensam pontuação.", "se separe «o relatório» do verbo «será», já que sujeito e predicado exigem corte.", "se cerquem «hoje à equipe diretora», complemento deslocado no final do período."],
    explanation: "Orações explicativas entre vírgulas acrescentam informação não essencial; restringitivas dispensam o corte.",
    subject: S_LC,
  },
  {
    statement: "Ao revisar a matéria intitulada «As conseqüências da reforma foram comunicadas à comunidade», a editora marcou o trecho. Pela grafia vigente do português, a correção adequada é:",
    correct: "escrever «consequências», sem diérese, pois o encontro «ue» dispensa o trema desde 2009.",
    wrong: ["manter «conseqüências», já que palavras com «ue» somado a i sempre exigem trema.", "trocar «comunicadas» pela forma «comunicadas» com acento agudo na terminação -adas.", "reescrever «reforma» com acento circunflexo, por ser paroxítona esdrúxula.", "substituir «à comunidade» por «a comunidade», suprimindo a crase dita obrigatória."],
    explanation: "O Acordo Ortográfico de 2009 eliminou o trema (diérese) antes de i e y: consequência, frequentemente.",
    subject: S_LC,
  },
  {
    statement: "Numa caixa de comentários, um leitor escreveu: «A obra parou ▭ faltou verba, e quero saber o ▭ disso.» As formas que preenchem corretamente as lacunas são:",
    correct: "porque, na frase declarativa de causa, e porquê, substantivado depois do artigo «o».",
    wrong: ["por que e por quê, respectivamente, nas duas posições da caixa de comentários.", "porquê e porque, invertendo causa e substantivação nas duas lacunas.", "porque e por que, já que «saber o» admite a forma separada sem acento.", "por quê e porquê, formas obrigatórias em perguntas diretas e indiretas."],
    explanation: "Causa após verbo pede «porque»; depois de artigo, «porquê» substantiva-se e leva acento.",
    subject: S_LC,
  },
  {
    statement: "Ao comentar a fila da cantina no grupo da turma, um estudante escreveu: «Já espero há uma eternidade e vou morrer de fome aqui dentro.» O recurso predominante nessa exageração é a:",
    correct: "hipérbole, pela afirmação impossível de espera infinita e morte literal para intensificar o incômodo.",
    wrong: ["eufemismo, pois a frase suaviza a espera para não constranger os responsáveis.", "ironia, pois o estudante pretende dizer exatamente o contrário do que escreveu.", "metonímia, pois troca a cantina pela refeição que ali seria servida.", "pleonasmo, pois a expressão repete a mesma ideia com palavras redundantes."],
    explanation: "A hipérbole recorre ao exagero deliberado para amplificar um sentimento, sem intenção literal.",
    subject: S_LC,
  },
  {
    statement: "No jornal de parede da escola, uma chamada dizia: «O relógio da sala 12 corria mais devagar enquanto a prova não acabava.» O recurso que atribui ação humana ao relógio é a:",
    correct: "personificação, pois o relógio recebe o verbo «correr» no sentido humano de passar o tempo.",
    wrong: ["comparação, pois o trecho usa «como» para aproximar o relógio do tempo.", "hipérbole, pois afirma que o relógio parou de funcionar durante a prova.", "eufemismo, pois disfarça a ansiedade dos estudantes diante da avaliação.", "onomatopeia, pois imita o barulho do tique-taque do relógio de parede."],
    explanation: "A personificação (ou prosopopeia) atribui traços humanos a seres ou objetos inanimados.",
    subject: S_LC,
  },
  {
    statement: "Num texto sobre redação, o autor incluiu a nota: «Observe que o termo crase designa a fusão da preposição “a” com o artigo “a”.» Esse trecho exercita principalmente a função:",
    correct: "metalinguística, pois o texto fala da própria língua usando a língua como objeto.",
    wrong: ["apelativa, pois convida o leitor a praticar exercícios de gramática.", "poética, pois valoriza a sonoridade das palavras citadas na nota.", "fática, pois testa se o canal de leitura está funcionando corretamente.", "referencial, pois informa dados históricos sobre a origem das palavras."],
    explanation: "Quando o enunciado volta-se para os próprios signos linguísticos, predomina a função metalinguística.",
    subject: S_LC,
  },
  {
    statement: "O trecho de um manual de bicicleta diz: «Aperte o parafuso da roda traseira com chave de 10 mm até o torque indicado de 6 N·m.» A função predominante é a referencial porque o texto:",
    correct: "informa dados objetivos e verificáveis, com foco na transmissão precisa da mensagem.",
    wrong: ["busca convencer o leitor a comprar a ferramenta certa na loja oficial.", "brinca com as palavras para criar humor em torno da manutenção do produto.", "só pode ser compreendido por quem domina a norma-padrão da língua.", "testa a atenção do leitor com perguntas retóricas sobre segurança."],
    explanation: "A função referencial prioriza a informação denotativa, clara e comprovável sobre o tema.",
    subject: S_LC,
  },
  {
    statement: "Um texto relata o bairro onde o autor cresceu, com lembranças afetivas e opiniões pessoais, em linguagem coloquial e de poucas páginas. O gênero textual mais provável é a:",
    correct: "crônica, pela combinação de subjetividade, cotidiano e extensão breve.",
    wrong: ["reportagem investigativa, que exige fontes confirmadas e imparcialidade.", "verbete de enciclopédia, que apresenta definições impessoais e organizadas.", "instrução de manual, que descreve procedimentos em etapas numeradas.", "editorial, que defende a posição oficial do veículo de comunicação."],
    explanation: "A crônica mescla narrativa e reflexão pessoal sobre fatos do cotidiano, em texto curto.",
    subject: S_LC,
  },
  {
    statement: "O parágrafo de uma crônica diz: «Mal o sino tocou, os alunos ocuparam o pátio.» A oração iniciada pela conjunção «mal» estabelece relação de:",
    correct: "tempo, indicando que a segunda ação ocorreu logo em seguida à primeira.",
    wrong: ["causa, explicando o motivo pelo qual os alunos ocuparam o pátio.", "concessão, apresentando um obstáculo que não impediu a ação dos alunos.", "finalidade, indicando o objetivo pretendido pelos alunos no pátio.", "condição, definindo o único cenário em que o pátio seria ocupado."],
    explanation: "«Mal», «assim que», «logo que» e «tão logo» introduzem orações temporais imediatas.",
    subject: S_LC,
  },
  {
    statement: "Leia o trecho fictício de uma entrevista: «Antigamente eu ia ao mercado para comprar e ficava conversando; hoje saio com a sacola e nem sei o nome de quem vende ao lado.» A leitura mais consistente é:",
    correct: "o progresso da praticidade convive com o enfraquecimento dos laços de vizinhança.",
    wrong: ["o entrevistado elogia a agilidade das compras feitas hoje em dia.", "o mercado perdeu clientes porque os preços aumentaram no período.", "a fala prova que o comércio de bairro já não existe nas cidades atuais.", "o entrevistado descreve apenas a rotina de compra, sem nenhuma crítica."],
    explanation: "O contraste entre «antigamente» e «hoje» associa conveniência atual à perda de convívio e memória afetiva.",
    subject: S_LC,
  },
  {
    statement: "Um texto afirma: «Enquanto 7 em cada 10 entrevistados leem mensagens no celular, apenas 2 em cada 10 terminam matérias longas na tela.» A leitura correta desse dado é:",
    correct: "o acesso à informação aumentou, mas a permanência em leituras longas segue baixa.",
    wrong: ["os entrevistados não possuem celular para ler notícias na internet.", "a maioria termina as matérias longas depois de iniciar a leitura no celular.", "o dado demonstra que os livros impressos foram abandonados pelos leitores.", "70% dos entrevistados nunca leram uma matéria completa em nenhuma mídia."],
    explanation: "Os dois números medem hábitos distintos: acesso rápido (70%) e conclusão de textos longos (20%).",
    subject: S_LC,
  },
  {
    statement: "Um colega foi alvo de deboche por «falar errado» ao usar formas linguísticas comuns em sua região natal. Sobre a questão, a postura adequada é:",
    correct: "reconhecer que nenhuma variedade é superior: a norma-padrão é convenção de prestígio, não a única fala certa.",
    wrong: ["considerar que a fala regional deve ser corrigida mesmo em conversas informais.", "afirmar que existe uma única forma correta de falar e que as demais são erros.", "sugerir que a pessoa abandone sua região para adotar um sotaque neutro.", "entender que variedades linguísticas só existem entre países, nunca dentro do Brasil."],
    explanation: "A variação é inerente à língua; o preconceito linguístico recai sobre uma variedade social, não sobre um erro em si.",
    subject: S_LC,
  },
  {
    statement: "A poesia de Castro Alves ecoou os protestos contra a escravização e rendeu-lhe o apelido de poeta dos escravos. Sobre a produção do autor, é correto afirmar que:",
    correct: "versos como «Liberdade! Liberdade!» inscrevem sua obra no romantismo abolicionista do século XIX.",
    wrong: ["o autor integrou a geração modernista de 1922, ao lado de Mário de Andrade.", "sua obra trata exclusivamente de amor romântico, sem nenhum engajamento político.", "os poemas foram escritos em prosa jornalística para circular em folhetins.", "sua poesia foi publicada apenas após a abolição, já no século XX."],
    explanation: "Castro Alves (1847-1871) publicou em vida sua poesia abolicionista no romantismo brasileiro.",
    subject: S_LC,
  },
  {
    statement: "Carlos Drummond de Andrade, nascido em Itabira, é frequentemente vinculado à chamada Geração de 30. Sobre o autor, é correto afirmar que:",
    correct: "o exercício do funcionalismo público e a crônica cotidiana atravessam boa parte de sua obra.",
    wrong: ["ele representou o romantismo brasileiro do século XIX ao lado de Gonçalves Dias.", "foi o organizador da Semana de Arte Moderna de 1922, no Theatro Municipal.", "escreveu majoritariamente romances históricos ambientados no período da Colônia.", "publicou sua obra exclusivamente em espanhol durante exílio na Argentina."],
    explanation: "Drummond (1902-1987), poeta da Geração de 30, trabalhou no jornal e no serviço público e cronicou o cotidiano.",
    subject: S_LC,
  },
  {
    statement: "Num corredor da biblioteca municipal, os visitantes encontram um cartaz em inglês com o aviso «Silence, please. Phones on vibrate.» O cartaz solicita que os frequentadores:",
    correct: "mantenham silêncio e deixem os aparelhos no modo vibração.",
    wrong: ["desliguem completamente os aparelhos antes de entrar na biblioteca.", "liguem os aparelhos em volume alto para não perderem nenhuma chamada.", "reservem os telefones da biblioteca por meio do aplicativo oficial.", "levantem a mão para falar sempre que precisarem de ajuda."],
    explanation: "«Silence» pede silêncio e «phones on vibrate» determina o modo vibração dos aparelhos.",
    subject: S_LC,
  },
  {
    statement: "Um e-mail de trabalho termina com a frase «Please reply by Friday; the meeting will be moved otherwise.» A instrução pede que o destinatário:",
    correct: "responda até sexta-feira, sob pena de a reunião ser remarcada.",
    wrong: ["responda somente depois da reunião de sexta-feira.", "mude a reunião para uma data posterior sem avisar ninguém.", "escreva novamente no domingo, caso não possa responder a tempo.", "confirme presença apenas na segunda-feira seguinte ao prazo."],
    explanation: "«Reply by Friday» fixa o prazo; «otherwise» indica a consequência de não cumprir o prazo.",
    subject: S_LC,
  },
  {
    statement: "Um folheto de cordel exposto na feira de livros usa versos curtos de sete sílabas, rima emparelhada e tipografia centrada. Essas marcas identificam a:",
    correct: "literatura de cordel, tradição impressa e oral de versos populares do Nordeste.",
    wrong: ["soneto clássico, forma fixa de catorze versos endecassílabos.", "crônica jornalística, texto em prosa publicado diariamente em jornal.", "contrato jurídico, documento formal com cláusulas numeradas e assinadas.", "hino escolar, composição musical cantada em cerimônias cívicas."],
    explanation: "O cordel caracteriza-se por versos em redondilha maior, rima emparelhada, tipografia de folheto e circulação oral.",
    subject: S_LC,
  },
  {
    statement: "Uma foto de campanha de doação mostra moedas dentro de um sapato infantil e traz a legenda «Todo passo conta». O sentido do conjunto imagem e texto é:",
    correct: "associar o gesto de doar ao caminho de uma criança, sugerindo que cada contribuição impulsiona trajetórias.",
    wrong: ["informar o preço exato de um sapato infantil usado em campanha publicitária.", "descrever literalmente a quantidade de moedas guardadas pela família na foto.", "criticar o uso de calçados infantis em campanhas de marketing comercial.", "substituir a imagem, dispensando qualquer leitura visual da publicação."],
    explanation: "No texto multimodal, imagem e legenda combinam-se metaforicamente: moedas + sapato + «passo» = trajetória apoiada.",
    subject: S_LC,
  },
  {
    statement: "Ao revisar um texto, a professora apontou: «A decisão do conselho foi finalmente aprovada por todos os presentes de forma unânime.» O problema estilístico mais evidente é:",
    correct: "redundância, pois «por todos» e «de forma unânime» repetem a mesma ideia.",
    wrong: ["ambiguidade, pois a frase admite dois sujeitos distintos para o verbo aprovar.", "regência, pois «aprovar por» exigiria a preposição «em» na norma-padrão.", "concordância, pois «presentes» deveria concordar com «decisão» no singular.", "pontuação, pois a locução deveria ser separada por ponto e vírgula."],
    explanation: "Redundância repete informações desnecessárias: unanimidade já implica a aprovação por todos.",
    subject: S_LC,
  },
  {
    statement: "A palavra banco aparece em «o banco do parque» e em «o banco emprestou dinheiro». Sobre os dois empregos, é correto afirmar que são:",
    correct: "homônimos: grafias iguais, mas sentidos distintos originados de etimologias diferentes.",
    wrong: ["sinônimos, pois designam lugares onde as pessoas se sentam ou guardam valores.", "polissêmicos com sentido base comum, já que ambos se referem a instituições.", "derivados do mesmo radical latino, com sentidos complementares entre si.", "um segundo sentido errado, registrado apenas informalmente na língua."],
    explanation: "Homônimos têm mesma grafia e origens etimológicas distintas; a polissemia pressupõe um mesmo núcleo de sentido.",
    subject: S_LC,
  },
  {
    statement: "Numa reunião, um participante diz: «Com todo respeito, talvez fosse melhor ouvir quem chegou primeiro.» O sentido implícito da fala é que:",
    correct: "o interventor está falando demais e deveria ceder a vez de quem já estava presente.",
    wrong: ["o participante cumprimenta educadamente quem chegou atrasado à reunião.", "a reunião deveria ser adiada para ouvir os absentos no próximo encontro.", "a ordem de chegada determina sempre quem fala em qualquer decisão.", "o falante concorda integralmente com as propostas apresentadas até ali."],
    explanation: "A implicatura é o sentido não dito deduzido do contexto: o pedido de vez de falar disfarçado de conselho.",
    subject: S_LC,
  },
  {
    statement: "Numa dissertação, o autor apresenta dados, cita especialistas e antecipa objeções do leitor antes de concluir. Esses recursos indicam que o texto:",
    correct: "constrói uma argumentação com tese, sustentação e refutação de contraargumentos.",
    wrong: ["descreve um processo científico sem nenhuma intenção de convencer o leitor.", "apenas informa fatos, já que dados e citações dispensam defesa de ponto de vista.", "é um texto narrativo, cujo foco é a sequência cronológica de acontecimentos.", "produz um manual de instruções, organizado em etapas numeradas de execução."],
    explanation: "Antecipar objeções é recurso de refutação, marca central do gênero argumentativo.",
    subject: S_LC,
  },
];
// ---- ENEM 2025 · Ciências Humanas e suas Tecnologias (25 itens) ----
const ITEMS_2025_CH: EnemItem[] = [
  {
    statement: "Em 1937, o governo fechou o Congresso, outorgou nova Constituição e suspendeu as eleições diretas. Esse episódio, conhecido como Estado Novo, caracterizou-se por:",
    correct: "concentração do poder executivo, censura e ausência de eleições até a redemocratização de 1945.",
    wrong: ["democratização ampliada, com voto feminino e de analfabetos garantidos pela nova carta.", "governo parlamentar, em que um primeiro-ministro respondia perante o Congresso.", "fortalecimento da federação, com estados ganhando autonomia para cobrar impostos.", "ditadura militar liderada por generais da Marinha sem participação de civis."],
    explanation: "O Estado Novo (1937-1945) concentrou poder no Executivo, fechou o Congresso e instituiu a censura.",
    subject: S_CH,
  },
  {
    statement: "Nos anos 1950, o Estado criou a Companhia Siderúrgica Nacional e investiu em petroquímica para reduzir a dependência de produtos importados. Essa política correspondia à:",
    correct: "substituição de importações, estratégia de industrialização voltada ao mercado interno.",
    wrong: ["abertura comercial irrestrita, que eliminava tarifas sobre produtos estrangeiros.", "mercantilismo colonial, doutrina que impedia a produção industrial nas colônias.", "economia de subsistência, baseada no cultivo apenas para o consumo da família.", "reforma agrária, distribuição de terras aos trabalhadores rurais sem terra."],
    explanation: "A industrialização por substituição de importações visava produzir internamente o que se comprava do exterior.",
    subject: S_CH,
  },
  {
    statement: "Em 1979, a anistia devolveu ao país exilados e presos políticos; em 1984, a campanha das Diretas Já exigiu eleições diretas para a Presidência. Esses movimentos expressam:",
    correct: "a pressão popular pela redemocratização após os anos de ditadura militar.",
    wrong: ["o apoio da sociedade à permanência do regime militar até o fim dos anos 1990.", "a criação do voto censitário, restrito a proprietários e pessoas que sabem ler.", "o fortalecimento da censura prévia como garantia da ordem pública.", "a instauração de um governo parlamentar com Congresso fechado até 1988."],
    explanation: "Anistia e Diretas Já são marcos da sociedade civil organizando-se contra o autoritarismo e pela volta do voto direto.",
    subject: S_CH,
  },
  {
    statement: "A Constituição de 1988 define a propriedade como função social: seu uso deve atender ao bem-estar geral da população. Na prática, esse princípio:",
    correct: "permite exigir do proprietário o cumprimento de finalidades como moradia e aproveitamento racional.",
    wrong: ["autoriza o confisco imediato de qualquer imóvel sem indenização prévia ao dono.", "elimina o direito de herança entre os familiares do proprietário de terras.", "impede o Estado de regular o uso do solo nas áreas urbanas das cidades.", "restringe a propriedade apenas a empresas, isentando as pessoas físicas."],
    explanation: "Segundo a Constituição, a propriedade cumpre função social quando atende às necessidades da cidade e do trabalhador.",
    subject: S_CH,
  },
  {
    statement: "Um levantamento revelou que 38% dos trabalhadores urbanos não tinham carteira assinada e que esse grupo recebia, em média, metade da renda dos trabalhadores formais. A conclusão sustentada pelos dados é:",
    correct: "a informalidade concentra trabalhadores com menor renda e menor proteção trabalhista.",
    wrong: ["os trabalhadores informais ganham mais, pois não descontam imposto de renda.", "a carteira assinada não influencia a renda nem a proteção do trabalhador.", "todo trabalhador formal é protegido por sindicato e previdência integral.", "a informalidade atinge apenas o meio rural, nunca as capitais brasileiras."],
    explanation: "A ausência de vínculo formal associa-se a renda menor, ausência de estabilidade e sem contribuição previdenciária.",
    subject: S_CH,
  },
  {
    statement: "Uma agência da ONU atua na redução da fome, no combate ao desperdício de alimentos e na assistência técnica a pequenos produtores rurais. Essa agência corresponde à:",
    correct: "FAO, Organização das Nações Unidas para Alimentação e Agricultura.",
    wrong: ["UNESCO, órgão dedicado a educação, ciência e cultura nos países-membros.", "OMS, organização responsável pela saúde pública e vigilância epidemiológica.", "FMI, fundo que empresta moeda a países com balança de pagamentos deficitária.", "OTAN, aliança militar firmada para a defesa coletiva do Atlântico Norte."],
    explanation: "A FAO tem como mandato a segurança alimentar, o combate à fome e o desenvolvimento agrícola sustentável.",
    subject: S_CH,
  },
  {
    statement: "Críticos apontam que redes globais de fast-food padronizam cardápios, cores e decorações do mesmo jeito em todos os países onde se instalam. Esse fenômeno é associado à:",
    correct: "homogeneização cultural, crítica à circulação acrítica de modelos culturais globais.",
    wrong: ["multiculturalismo, prática de valorizar igualmente todas as culturas locais.", "relativismo cultural, doutrina segundo a qual nenhuma cultura pode ser julgada.", "endogenização, processo em que a cultura local absorve o estrangeiro e o transforma.", "etnocentrismo inverso, valorização automática das culturas estrangeiras."],
    explanation: "A padronização global de hábitos de consumo é o exemplo clássico da crítica à homogeneização cultural.",
    subject: S_CH,
  },
  {
    statement: "Numa região central de uma grande cidade, medem-se temperaturas bem superiores às dos bairros arborizados, por causa do calor liberado por aparelhos e do asfalto. Esse fenômeno é chamado de:",
    correct: "ilha de calor, aquecimento local causado pela impermeabilização do solo e pelo calor antropogênico.",
    wrong: ["efeito estufa global, processo atmosférico que aquece o planeta como um todo.", "buraco na camada de ozônio, perda de ozônio provocada por gases refrigerantes.", "inversão térmica, camada de ar frio que retém poluentes no fundo dos vales.", "brisa marítima, vento local que sopra do mar para o interior da cidade."],
    explanation: "Concreto, asfalto e calor humano elevam a temperatura urbana em relação às áreas verdes próximas.",
    subject: S_CH,
  },
  {
    statement: "Uma cidade implantou faixas exclusivas de ônibus rápidos e ciclovias contínuas, medindo o resultado em passageiros por hora em cada corredor. A política descrita prioriza:",
    correct: "o transporte coletivo e ativo, com maior eficiência e menor emissão por passageiro.",
    wrong: ["o automóvel individual, ampliando o número de faixas nas avenidas centrais.", "o transporte aéreo urbano, com rotas de helicóptero entre os distritos.", "a pavimentação de estradas rurais para escoar a produção agrícola.", "a construção de estacionamentos subterrâneos em todos os bairros."],
    explanation: "Corredores de ônibus e ciclovias deslocam mais pessoas por espaço ocupado que o carro individual.",
    subject: S_CH,
  },
  {
    statement: "Um município definiu faixas de vegetação nativa ao redor dos mananciais e proibiu construções nelas. A finalidade principal dessa medida é:",
    correct: "preservar a recarga dos rios e a biodiversidade que sustenta o ecossistema local.",
    wrong: ["elevar a arrecadação de impostos prediais do município sobre novos lotes.", "ampliar o número de lotes urbanizados para moradias de interesse social.", "reduzir o custo do transporte público nos bairros periféricos da cidade.", "facilitar a mineração de agregados usados na construção civil."],
    explanation: "As matas ciliares protegem a qualidade e o volume da água, além de abrigar espécies da fauna e da flora.",
    subject: S_CH,
  },
  {
    statement: "O conceito de desenvolvimento sustentável, consolidado pela Comissão Brundtland em 1987, define-se como a capacidade de:",
    correct: "atender às gerações presentes sem comprometer as possibilidades das gerações futuras.",
    wrong: ["crescer economicamente a qualquer custo, gerando empregos imediatamente.", "preservar a natureza de forma integral, sem nenhuma intervenção humana.", "voltar ao modo de vida pré-industrial, suprimindo a tecnologia moderna.", "distribuir renda igualitariamente entre todos os países do mundo."],
    explanation: "O relatório Nosso Futuro Comum cunhou o equilíbrio entre necessidades atuais e responsabilidade intergeracional.",
    subject: S_CH,
  },
  {
    statement: "Quando a taxa de fecundidade de um país se mantém abaixo de 2,1 filhos por mulher por longo período, a população tende, no longo prazo, a:",
    correct: "envelhecer e, se a tendência persistir, diminuir, com menos jovens sustentando os idosos.",
    wrong: ["dobrar a cada década, pois as famílias passariam a ter mais filhos.", "manter-se etariamente constante, sem nenhuma mudança de composição.", "aumentar a proporção de crianças, exigindo ampliação imediata das escolas.", "desaparecer em poucos anos, pois o crescimento se torna negativo na data-limite."],
    explanation: "A taxa de reposição é2,1; abaixo dela, a pirâmide etária envelhece e a população tende a decrescer.",
    subject: S_CH,
  },
  {
    statement: "Milhares de famílias venezuelanas cruzaram a fronteira norte do Brasil em fuga de crises econômica e política. Esse fluxo caracteriza-se como:",
    correct: "migração forçada, em que o deslocamento decorre de condições adversas que ameaçam a vida.",
    wrong: ["turismo internacional, deslocamento temporário por lazer com retorno garantido.", "êxodo urbano, mudança do campo para a cidade dentro do mesmo país.", "colonização, ocupação planejada de territórios desabitados por um Estado.", "nomadismo, circulação sem rumo de povos que não possuem residência fixa."],
    explanation: "Quando a partida decorre de perigo, persecuição ou colapso, fala-se em refúgio ou migração forçada.",
    subject: S_CH,
  },
  {
    statement: "A cidade tombou uma antiga estação ferroviária para impedir sua demolição e exigir preservação. O tombamento protege sobretudo:",
    correct: "o patrimônio material, bens construídos de valor histórico, arquitetônico ou artístico.",
    wrong: ["o patrimônio imaterial, festas e saberes coletivos sem suporte físico.", "apenas imóveis residenciais, nunca espaços de uso público da cidade.", "bens móveis de museus, que passam a ser exportados livremente.", "a propriedade privada contra qualquer regra urbanística municipal."],
    explanation: "Tombamento protege bens materiais (edificações, sítios); o imaterial é assegurado por registro específico.",
    subject: S_CH,
  },
  {
    statement: "Casas de culto de matriz africana e os toques de tambor associados a essas religiões, reconhecidos como expressões do patrimônio brasileiro, dizem respeito a:",
    correct: "a identidade e à memória cultural de comunidades afro-descendentes no país.",
    wrong: ["a imposição de uma única religião oficial ao longo da história republicana.", "a cultura europeia trazida pelos colonizadores portugueses no século XVI.", "ao turismo religioso internacional, sem vínculo com a população local.", "a práticas sem nenhuma dimensão coletiva ou simbólica para os participantes."],
    explanation: "Essas expressões são reconhecidas como patrimônio imaterial por relembrarem a herança africana e afro-brasileira.",
    subject: S_CH,
  },
  {
    statement: "Na alegoria da caverna, de Platão, os prisioneiros tomam as sombras projetadas na parede por realidade. A alegoria sugere que:",
    correct: "o senso comum pode aprisionar, e a filosofia buscaria sair da caverna em direção ao conhecimento.",
    wrong: ["as sombras devem ser estudadas como a única forma válida de conhecimento.", "a prisão física é sempre preferível ao risco do conhecimento verdadeiro.", "a arte pintada nas paredes é a mais elevada das formas de saber.", "os filósofos devem permanecer na caverna e jamais tentar sair dela."],
    explanation: "Para Platão, o conhecimento verdadeiro exigiria romper as aparências que prendem o senso comum.",
    subject: S_CH,
  },
  {
    statement: "Para John Rawls, uma sociedade justa seria a escolhida sob um véu de ignorância, em que ninguém conhece sua posição futura. Esse princípio busca:",
    correct: "garantir imparcialidade, pois ninguém criaria regras que soubesse poder prejudicá-lo.",
    wrong: ["eliminar completamente o mercado, na forma de uma economia sem propriedade.", "autorizar o mais forte a legislar, por se julgar preparado para qualquer papel.", "privilegiar os mais ricos, que conhecem melhor as regras do sistema.", "prescindir de qualquer deliberação coletiva na definição das leis."],
    explanation: "O véu da ignorância é experimento mental: sem saber quem se será, escolher-se-iam regras equitativas.",
    subject: S_CH,
  },
  {
    statement: "Um jovem aprende normas de convívio na família, na escola, nos grupos de amigos e nas redes sociais. Essas instituições, por transmitirem valores e papéis, são chamadas de:",
    correct: "agências de socialização, meios pelos quais o indivíduo interioriza a vida em sociedade.",
    wrong: ["instituições totais, estabelecimentos que retiram a liberdade dos internos.", "estruturas de classe, divisões fixas determinadas apenas pela renda familiar.", "mercadologias, estratégias de consumo aprendidas exclusivamente no varejo.", "poderes moderadores, órgãos que freiam decisões do Executivo e do Judiciário."],
    explanation: "Família, escola, mídia e pares formam o conjunto de agências que integram o indivíduo à sociedade.",
    subject: S_CH,
  },
  {
    statement: "Dados mostram que as 20% mais pobres concentram 4% da renda nacional e as 20% mais ricas, 60%. Essa distribuição indica:",
    correct: "elevada desigualdade, com a renda concentrada no topo da pirâmide social.",
    wrong: ["equilíbrio, pois cada faixa guarda proporção semelhante de riqueza.", "meritocracia plena, em que a renda reflete apenas o esforço individual.", "pobreza generalizada, já que nenhuma faixa ultrapassa a média nacional.", "estagnação, pois nenhuma faixa teve variação de renda no período."],
    explanation: "Concentração de 60% da renda nas mãos de um quinto da população caracteriza forte desigualdade.",
    subject: S_CH,
  },
  {
    statement: "O PIB per capita divide a riqueza produzida pelo número de habitantes, mas não revela como ela é distribuída. Assim, um país com PIB per capita elevado pode:",
    correct: "conviver com forte desigualdade e indicadores sociais baixos para parte da população.",
    wrong: ["ter necessariamente o maior IDH do mundo, sem nenhuma exceção registrada.", "não produzir bens ou serviços, já que o indicador mede apenas o consumo.", "manter toda a população com renda idêntica à média calculada.", "não possuir dados para calcular nenhum indicador econômico do país."],
    explanation: "PIB per capita é média aritmética; sem informação sobre distribuição, esconde desigualdades internas.",
    subject: S_CH,
  },
  {
    statement: "No Brasil, os deputados federais são eleitos pelo sistema de representação proporcional, e não pelo mais votado. Esse sistema de votação:",
    correct: "distribui cadeiras segundo a votação de partidos e coligações, mediante quociente eleitoral.",
    wrong: ["atribui a vitória ao candidato com mais votos, em turno único sem partidos.", "exige um segundo turno entre os dois mais votados em cada estado.", "conta apenas os votos nominais, ignorando a votação de legenda partidária.", "escolhe os parlamentares por sorteio entre os membros do colegiado."],
    explanation: "Nas eleições proporcionais, a votação do partido define a distribuição das vagas, e não apenas o nome mais votado.",
    subject: S_CH,
  },
  {
    statement: "O direito de se manifestar publicamente é um direito civil; o direito à saúde garantida pelo Estado é um direito social. A diferença fundamental entre eles é que:",
    correct: "os civis limitam a ação do Estado sobre o indivíduo; os sociais exigem políticas públicas efetivas.",
    wrong: ["os direitos sociais valem apenas para trabalhadores com carteira assinada.", "os direitos civis só podem ser exercidos após autorização judicial prévia.", "ambos foram criados em 1988 e inexistiam na Constituição anterior.", "os direitos sociais dispensam recursos públicos para serem efetivados."],
    explanation: "Direitos civis são liberdades protegidas do arbítrio estatal; direitos sociais dependem de prestações do Estado.",
    subject: S_CH,
  },
  {
    statement: "Num bairro histórico, os aluguéis sobem, lojas locais fecham e moradores antigos são substituídos por população de maior poder aquisitivo. O processo descrito é a:",
    correct: "gentrificação, transformação socioespacial que desloca a população original do território.",
    wrong: ["conurbação, fusão das áreas urbanas de municípios vizinhos em uma mancha contínua.", "periferização, expansão da população de baixa renda para os limites da cidade.", "ilha de calor, aquecimento local do clima urbano por pavimentação e concreto.", "segregação rural, separação entre zona agrícola e área de preservação."],
    explanation: "Valorização imobiliária com troca de população de baixa renda por de maior renda é o núcleo da gentrificação.",
    subject: S_CH,
  },
  {
    statement: "Após a tragédia de Mariana, famílias atingidas por barragens organizaram-se em um movimento que reivindica reparação e responsabilização. Essa mobilização é um exemplo de:",
    correct: "movimento social de base, organização da sociedade civil em torno de uma causa comum.",
    wrong: ["partido político, sigla que disputa eleições majoritárias em todo o país.", "órgão público, instituição estatal com orçamento e servidores concursados.", "empresa privada, constituída para distribuir lucros aos seus acionistas.", "associação comercial, entidade que representa apenas o comércio local."],
    explanation: "Sem finalidade eleitoral nem lucrativa, a organização de atingidos típica dos novos movimentos sociais.",
    subject: S_CH,
  },
  {
    statement: "Um país membro de uma organização de produtores de petróleo decide reduzir a extração para diminuir a oferta global e sustentar o preço. Essa ação ilustra o uso do petróleo como:",
    correct: "instrumento de poder geopolítico, com capacidade de influenciar a economia mundial.",
    wrong: ["livre-comércio, política que elimina tarifas e barreiras entre as nações.", "autarquia, regime em que a nação não mantém comércio exterior algum.", "cooperativismo, sistema de propriedade coletiva dos meios de produção.", "keynesianismo, política de gasto público para combater recessões."],
    explanation: "Quando um recurso essencial é controlado por poucos produtores, sua oferta torna-se alavanca política internacional.",
    subject: S_CH,
  },
];
// ---- ENEM 2025 · Ciências da Natureza e suas Tecnologias (25 itens) ----
const ITEMS_2025_CN: EnemItem[] = [
  {
    statement: "Num ecossistema, fungos e bactérias quebram as folhas caídas e devolvem nutrientes ao solo para novas plantas. O papel desses organismos é o de:",
    correct: "decompositores, que fecham o ciclo ao mineralizar a matéria orgânica morta.",
    wrong: ["produtores primários, que sintetizam matéria orgânica usando a luz solar.", "consumidores primários, que se alimentam diretamente das plantas vivas.", "hospedeiros, que abrigam parasitas no interior de seus próprios corpos.", "predadores de topo, que controlam as populações de herbívoros do local."],
    explanation: "Decompositores transformam matéria orgânica morta em nutrientes inorgânicos disponíveis no solo.",
    subject: S_CN,
  },
  {
    statement: "O excesso de esgoto doméstico num lago estimula o crescimento de algas; ao morrerem, elas consomem o oxigênio da água e matam os peixes. Esse processo chama-se:",
    correct: "eutrofização, enriquecimento de nutrientes que leva à asfixia dos organismos aquáticos.",
    wrong: ["bioremediação, uso de organismos para remover poluentes de um corpo d'água.", "contaminação radioativa, liberação de material instável proveniente de usinas.", "acidificação, queda do pH provocada exclusivamente pela chuva ácida regional.", "biomagnificação, aumento da concentração de poluente nos níveis tróficos altos."],
    explanation: "Nutrientes em excesso (N e P) provocam floração de algas; a decomposição dessas algas esgota o oxigênio dissolvido.",
    subject: S_CN,
  },
  {
    statement: "Após o desvio de um rio, espécies exóticas de peixes dominaram o reservatório e reduziram as populações nativas. O caso ilustra os riscos da:",
    correct: "introdução de espécies exóticas, que competem melhor e desequilibram a comunidade local.",
    wrong: ["sucessão secundária, regeneração natural da comunidade após uma perturbação.", "hibridação natural, cruzamento entre variedades distintas da mesma espécie.", "migração sazonal, deslocamento regular de animais entre estações do ano.", "domesticação, seleção humana de características úteis de uma espécie."],
    explanation: "Espécies invasoras, sem reguladores naturais, podem superar as nativas e reduzir a biodiversidade local.",
    subject: S_CN,
  },
  {
    statement: "A ideia de que traços adquiridos durante a vida de um organismo seriam transmitidos à sua progênie corresponde a uma teoria:",
    correct: "lamarckista, superada pela genética e pela seleção natural darwiniana.",
    wrong: ["darwiniana, que atua sobre variações já existentes na população.", "mendeliana, que descreve a segregação de alelos na formação dos gametas.", "homeostática, baseada na capacidade de manter equilíbrio interno do corpo.", "fototrópica, que explica o crescimento das plantas na direção da luz."],
    explanation: "Segundo Lamarck, o uso e o desuso de órgãos adquiriam características; hoje sabe-se que só mutações germinativas são herdáveis.",
    subject: S_CN,
  },
  {
    statement: "No ser humano, células com 46 cromossomos originam os gametas, que possuem apenas 23. A divisão celular responsável por essa redução é a:",
    correct: "meiose, que divide o material genético e gera células haploides.",
    wrong: ["mitose, que mantém o número cromossômico idêntico ao da célula-mãe.", "citocinese, simples divisão do citoplasma sem alteração dos cromossomos.", "replicação do DNA, que duplica as cromátidas sem dividir a célula.", "apoptose, morte programada que fragmenta o material genético."],
    explanation: "A meiose realiza duas divisões sucessivas e reduz 46 para 23 cromossomos, viabilizando a fecundação.",
    subject: S_CN,
  },
  {
    statement: "Plantas realizam fotossíntese apenas quando há luz; à noite, porém, continuam vivas e ativas. Durante o período noturno, as plantas:",
    correct: "consomem oxigênio na respiração celular, sem produzir oxigênio por fotossíntese.",
    wrong: ["param qualquer atividade metabólica até o nascer do sol.", "produzem oxigênio em maior quantidade que durante o dia.", "liberam gás carbônico exclusivamente por fotossíntese sem luz.", "absorvem nitrogênio do ar para substituir a fotossíntese noturna."],
    explanation: "Sem luz, cessa a fotossíntese, mas a respiração celular continua, consumindo O2 e liberando CO2.",
    subject: S_CN,
  },
  {
    statement: "A dengue é transmitida pela picada do Aedes aegypti, mosquito que se reproduz em recipientes com água parada. A medida que interrompe melhor a transmissão é:",
    correct: "eliminar os recipientes com água parada ao redor das residências, onde o mosquito se reproduz.",
    wrong: ["tomar antibióticos preventivos durante toda a estação chuvosa.", "usar repelente somente dentro de casa, sem eliminar os criadouros.", "vacinar a população com a vacina gripal de uso anual obrigatório.", "clorar a água de consumo, o que impediria a picada do mosquito."],
    explanation: "O controle do vetor ataca o ciclo reprodutivo do mosquito, única forma eficaz de reduzir a transmissão.",
    subject: S_CN,
  },
  {
    statement: "Um surto de diarreia em uma comunidade rural foi associado ao consumo de água de poço sem tratamento. A medida de prevenção mais eficaz é:",
    correct: "tratar a água de consumo, fervendo ou clorando, e proteger a fonte de captação.",
    wrong: ["aumentar o consumo de alimentos fermentados pela população local.", "aplicar inseticida dentro do poço para matar os microrganismos.", "administrarem-se doses diárias de antibiótico a toda a comunidade.", "ventilar as residências para reduzir a umidade do ar nos ambientes."],
    explanation: "A via hídrica é o principal vetor dessas doenças; tratar e proteger a fonte corta a transmissão oral-fecal.",
    subject: S_CN,
  },
  {
    statement: "Um médico classificou sedentarismo, excesso de sal e obesidade como fatores modificáveis de risco cardiovascular. Esses fatores:",
    correct: "podem ser alterados por hábitos de vida, ao contrário de idade e herança genética.",
    wrong: ["são imutáveis, pois dependem exclusivamente do código genético do paciente.", "não influenciam a pressão arterial de pessoas jovens em nenhuma hipótese.", "só se aplicam a pacientes acima dos 60 anos de idade.", "aplicam-se exclusivamente a homens, não havendo risco para as mulheres."],
    explanation: "Fatores modificáveis respondem a mudança de comportamento; os não modificáveis (idade, genética) apenas são monitorados.",
    subject: S_CN,
  },
  {
    statement: "Numa aula, o gelo derreteu sobre a bancada, uma lâmina de ferro enferrujou na estufa e o açúcar se dissolveu na água. As transformações químicas do conjunto são:",
    correct: "somente o enferrujamento do ferro, que gera uma substância nova, o óxido de ferro.",
    wrong: ["o derretimento do gelo e o enferrujamento do ferro, ambos com mudança química.", "a dissolução do açúcar e o derretimento do gelo, ambos com mudança química.", "as três ocorrências, já que toda mudança visível altera a composição da matéria.", "somente a dissolução do açúcar, única em que o soluto desaparece na água."],
    explanation: "Mudança química forma nova substância (ferrugem); derreter e dissolver são mudanças físicas reversíveis.",
    subject: S_CN,
  },
  {
    statement: "Pessoas com azia costumam tomar antiácidos, que neutralizam o excesso de ácido do estômago. O antiácido reage com o ácido formando:",
    correct: "sal e água, produtos típicos de uma reação de neutralização ácido-base.",
    wrong: ["base e metal, produtos de uma reação de deslocamento simples.", "gás hidrogênio e sal, pela ação de um metal sobre o ácido.", "apenas água, sem a formação de nenhum outro produto.", "óxido metálico e oxigênio, produtos de decomposição térmica."],
    explanation: "Ácido + base → sal + água; é a definição clássica da neutralização.",
    subject: S_CN,
  },
  {
    statement: "O polietileno é formado pela união de milhares de moléculas pequenas de etileno. As moléculas pequenas que se unem para formá-lo são os:",
    correct: "monômeros, unidades repetidas que se ligam para construir o polímero.",
    wrong: ["íons, átomos ou grupos de átomos com carga elétrica.", "catalisadores, substâncias que aceleram reações sem serem consumidas.", "solventes, líquidos que dissolvem outras substâncias em solução.", "compostos iônicos, associações entre metais e não metais."],
    explanation: "Na polimerização, monômeros (etileno) ligam-se em cadeias longas formando o polímero (polietileno).",
    subject: S_CN,
  },
  {
    statement: "A queima completa de um combustível orgânico, como o álcool etílico, em presença de oxigênio suficiente, produz sempre como produtos:",
    correct: "gás carbônico e água, quando a combustão se completa sem falta de oxigênio.",
    wrong: ["monóxido de carbono e oxigênio, quando a queima é dita completa.", "hidrogênio puro e fumaça, produtos de qualquer queima orgânica.", "metano e nitrogênio, gases do ar que sustentam a chama do fogão.", "carvão e vapor, resíduos sólidos da combustão incompleta."],
    explanation: "Hidrocarbonetos e álcoois combustíveis, com oxigênio abundante, formam CO2 e H2O (combustão completa).",
    subject: S_CN,
  },
  {
    statement: "Um automóvel freia com aceleração constante de −5 m/s² até parar, partindo de 20 m/s. A distância percorrida durante a frenagem é de:",
    correct: "40 m, obtida de v² = 2 · a · s, ou seja, 400 = 10 · s.",
    wrong: ["20 m, valor obtido dividindo a velocidade inicial pela aceleração.", "80 m, resultado da multiplicação da velocidade pelo tempo de parada.", "100 m, distância que o carro percorreria mantendo 20 m/s por 5 s.", "4 m, valor correspondente apenas ao tempo de frenagem em segundos."],
    explanation: "Com v final nula: 0 = 400 − 2 · 5 · s → s = 40 m.",
    subject: S_CN,
  },
  {
    statement: "Num ônibus em movimento, o passageiro é arremessado para frente quando o motorista freia de surpresa. Esse comportamento é explicado pela:",
    correct: "primeira lei de Newton (inércia): o corpo tende a manter seu estado de movimento.",
    wrong: ["segunda lei de Newton (F = m · a), que relaciona força e aceleração.", "terceira lei de Newton, sobre ação e reação entre dois corpos distintos.", "lei da gravitação universal, que atrai o corpo para a frente do veículo.", "relação de Arquimedes, referente ao empuxo em meios fluidos."],
    explanation: "Sem força resultante que o freie junto, o corpo conserva a velocidade que tinha antes da frenagem.",
    subject: S_CN,
  },
  {
    statement: "Um pêndulo é solto de uma altura e atinge o ponto mais baixo da trajetória com velocidade máxima. Nesse ponto da oscilação:",
    correct: "a energia potencial é mínima e a energia cinética do movimento é máxima.",
    wrong: ["toda a energia do sistema desapareceu, dissipada por atrito desprezível.", "a energia potencial é máxima e a energia cinética é nula no ponto baixo.", "o sistema passa a criar energia para manter o balanço do pêndulo.", "a energia mecânica total é nula, pois o pêndulo está em equilíbrio."],
    explanation: "Na altura, EP máx e EC mín; na base, a EP converte-se em EC — conservação da energia mecânica.",
    subject: S_CN,
  },
  {
    statement: "Uma lâmpada de 60 W funcionou 5 horas por dia durante 30 dias seguidos. O consumo de energia elétrica nesse período foi de:",
    correct: "9 kWh, convertendo os 9.000 Wh consumidos em quilowatt-hora.",
    wrong: ["9.000 kWh, valor numérico dos watts-hora sem a conversão final.", "0,9 kWh, obtido dividindo o consumo por dez mil.", "30 kWh, correspondente apenas ao número de dias do mês.", "0,3 kWh, consumo correspondente a um único dia de funcionamento."],
    explanation: "E = P · t = 60 W × 5 h × 30 = 9.000 Wh = 9 kWh.",
    subject: S_CN,
  },
  {
    statement: "Dois sons com intensidade semelhante, porém em frequências diferentes, são percebidos como um mais agudo que o outro. A frequência da onda determina:",
    correct: "a altura do som: frequências maiores produzem sons mais agudos.",
    wrong: ["a intensidade do som, medida pela amplitude da onda sonora.", "a velocidade de propagação, que cresce junto com a frequência no ar.", "a reverberação, definida pelo tamanho da sala onde o som ocorre.", "o timbre, qualidade definida pela forma de onda de cada fonte."],
    explanation: "Frequência corresponde à percepção de altura (agudo/grave); intensidade relaciona-se à amplitude.",
    subject: S_CN,
  },
  {
    statement: "Ao mergulhar um lápis num copo com água, ele parece quebrado exatamente na linha da superfície. Esse efeito visual decorre da:",
    correct: "refração, mudança de direção da luz ao passar entre meios de densidades diferentes.",
    wrong: ["reflexão, devolução da luz pela superfície espelhada da água.", "difração, desvio da luz ao contornar obstáculos de tamanho reduzido.", "absorção, retenção da luz pela água antes de que ela chegue aos olhos.", "polarização, filtragem da luz em um único plano de vibração."],
    explanation: "A luz muda de velocidade ao entrar na água e desvia-se do caminho original: é a refração.",
    subject: S_CN,
  },
  {
    statement: "Numa bateria recarregável, a energia fica armazenada enquanto o aparelho está na tomada e é liberada durante o uso. No uso, ocorre a transformação de:",
    correct: "energia química armazenada convertida em energia elétrica para o circuito.",
    wrong: ["energia elétrica convertida em energia nuclear dentro da bateria.", "energia mecânica transformada em energia térmica pelo aparelho.", "energia solar acumulada em forma de luz dentro da célula.", "energia elétrica criada do nada pelos íons do eletrodo."],
    explanation: "Baterias armazenam energia em reações químicas reversíveis; no uso, a reação gera corrente elétrica.",
    subject: S_CN,
  },
  {
    statement: "O efeito estufa natural mantém a Terra aquecida em temperatura compatível com a vida. O problema ambiental atual decorre da:",
    correct: "intensificação do efeito pelo excesso de CO2 e outros gases de origem humana.",
    wrong: ["fim do efeito estufa natural, que deixou de aquecer o planeta.", "aumento constante do tamanho do Sol nas últimas décadas.", "desaparecimento da camada de ozônio, que antes bloqueava o calor.", "redução da espessura da atmosfera, que deixou de reter calor."],
    explanation: "Gases antropogênicos amplificam o efeito estufa já existente, elevando a temperatura média do planeta.",
    subject: S_CN,
  },
  {
    statement: "Num plano municipal de gestão de resíduos sólidos, a equipe de meio ambiente definiu uma ordem de prioridade entre as ações. Essa ordem correta é:",
    correct: "reduzir o consumo, reutilizar os itens e, por fim, reciclar o que sobrar.",
    wrong: ["reciclar primeiro, depois reutilizar e, por último, reduzir o consumo.", "queimar o material para gerar energia antes de reciclar qualquer resíduo.", "coletar tudo em um único lixo, pois a separação não altera o resultado.", "enterrar o resíduo em aterro sanitário como etapa inicial do processo."],
    explanation: "A hierarquia dos 3R prioriza evitar o consumo (reduzir); reciclar é o último recurso, não o primeiro.",
    subject: S_CN,
  },
  {
    statement: "Um agricultor planta brotos retirados de uma mesma planta-mãe para obter laranjas geneticamente idênticas. Essa forma de reprodução é a:",
    correct: "assexuada vegetativa, sem fusão de gametas, que gera descendentes geneticamente iguais.",
    wrong: ["sexuada, pois envolve a fusão de óvulo e espermatozoide dos produtores.", "assexuada por esporos, típica de fungos e samambaias com meiose.", "partenogênese, desenvolvimento de embrião a partir de um gameta não fecundado.", "heterógama, com alternância de gerações e meiose obrigatória."],
    explanation: "Na multiplicação vegetativa, a muda herda exatamente o genoma da planta-mãe, sem variabilidade.",
    subject: S_CN,
  },
  {
    statement: "Num lago contaminado por mercúrio, os peixes grandes concentram mais tóxico que os pequenos. Essa diferença de concentração explica-se pela:",
    correct: "biomagnificação: a concentração do poluente cresce a cada nível trófico percorrido.",
    wrong: ["fotossíntese, que converte o mercúrio em substância solúvel nas algas.", "eutrofização, crescimento excessivo de algas que absorvem o tóxico.", "degradação bacteriana, que destrói o mercúrio antes de chegar aos peixes.", "transpiração, perda do poluente pelas brânquias dos peixes menores."],
    explanation: "O poluente não é eliminado e acumula-se ao longo da cadeia, atingindo máxima concentração nos predadores do topo.",
    subject: S_CN,
  },
  {
    statement: "Após uma infecção, o organismo produz substâncias que se ligam especificamente ao agente invasor. Essas substâncias da defesa são os:",
    correct: "anticorpos, proteínas de linfócitos que reconhecem antígenos específicos.",
    wrong: ["antibióticos, moléculas que destroem bactérias e vírus por ação direta.", "enzimas digestivas, que quebram os patógenos no estômago antes do contato.", "plaquetas, fragmentos celulares que formam coágulos no local da ferida.", "glóbulos vermelhos, que transportam oxigênio e não participam da defesa."],
    explanation: "A resposta imunológica específica produz anticorpos contra antígenos concretos, gerando também memória imunológica.",
    subject: S_CN,
  },
];
// ---- ENEM 2025 · Matemática e suas Tecnologias (25 itens) ----
const ITEMS_2025_MT: EnemItem[] = [
  {
    statement: "Um item custava R$ 200,00 em dezembro e sofreu aumentos sucessivos de 5% em janeiro e de 5% em fevereiro. O preço do item em fevereiro era de:",
    correct: "R$ 220,50, pois cada aumento incide sobre o valor já corrigido do mês anterior.",
    wrong: ["R$ 220,00, soma de dois acréscimos simples de R$ 10,00 sobre o preço de dezembro.", "R$ 210,00, valor obtido com apenas um aumento de 5% aplicado ao preço.", "R$ 230,00, acréscimo simples de R$ 30,00 sobre o valor original do item.", "R$ 240,00, aplicação de dois aumentos sucessivos de 10% ao preço cheio."],
    explanation: "200 × 1,05 = 210 e 210 × 1,05 = 220,50. Aumentos sucessivos não se somam.",
    subject: S_MT,
  },
  {
    statement: "Numa turma de simulado, 45 dos 60 alunos foram aprovados na avaliação final. Considerando o total da turma, o percentual de alunos aprovados foi de:",
    correct: "75%, calculado por 45 ÷ 60, com resultado expresso em percentual.",
    wrong: ["45%, valor bruto de alunos aprovados lido diretamente como percentual.", "133%, razão entre o total da turma e o número de aprovados.", "25%, percentual correspondente apenas aos alunos reprovados.", "15%, diferença numérica entre aprovados e reprovados na turma."],
    explanation: "(45/60) × 100 = 75% de aprovação.",
    subject: S_MT,
  },
  {
    statement: "Uma empresa tomou empréstimo de R$ 8.000,00 a juros simples de 1,5% ao mês durante 4 meses. O juro total devido nesse período é de:",
    correct: "R$ 480,00, calculado por J = C · i · t = 8.000 × 0,015 × 4.",
    wrong: ["R$ 120,00, juro correspondente a um único mês de empréstimo.", "R$ 8.480,00, montante total, que inclui o capital original emprestado.", "R$ 48,00, valor obtido deslocando a vírgula dos juros mensais.", "R$ 600,00, acréscimo sobre o capital arredondado de R$ 10.000,00."],
    explanation: "J = 8.000 × 0,015 × 4 = 480.",
    subject: S_MT,
  },
  {
    statement: "Se 5 máquinas produzem 1.000 peças em uma hora, quantas peças produzirão 8 máquinas no mesmo tempo, mantida a proporção?",
    correct: "1.600 peças, pois cada máquina produz 200 peças na hora.",
    wrong: ["8.000 peças, multiplicação direta de 1.000 pelo número de máquinas.", "1.800 peças, obtidas somando 80% ao total original de peças.", "625 peças, valor da proporção com a razão aplicada de forma invertida.", "1.500 peças, resultado de somar metade da produção original."],
    explanation: "Produção por máquina = 1.000/5 = 200; com 8 máquinas: 200 × 8 = 1.600.",
    subject: S_MT,
  },
  {
    statement: "Num projeto de arquitetura, a planta de uma sala está na escala 1:100 e mede 2,5 cm no papel. A dimensão real dessa sala, em metros, é de:",
    correct: "2,5 m, obtida convertendo os 250 cm reais em metros.",
    wrong: ["25 m, resultado de multiplicar por 100 e errar a conversão de centímetros.", "0,25 m, valor obtido dividindo a medida do papel pela escala.", "250 m, medida em centímetros interpretada diretamente como metros.", "100 m, valor do denominador da escala aplicado à sala desenhada."],
    explanation: "2,5 cm × 100 = 250 cm = 2,5 m.",
    subject: S_MT,
  },
  {
    statement: "Numa fila de carnaval, a cada minuto entram 8 pessoas e já havia 15 aguardando. Após 6 minutos, quantas pessoas formarão a fila?",
    correct: "63 pessoas, resultado de 15 + (8 × 6).",
    wrong: ["48 pessoas, apenas as entradas dos 6 minutos, sem contar o início.", "55 pessoas, contando cinco minutos de entrada em vez de seis.", "80 pessoas, soma de 15 com 8 multiplicado pelo próprio número 8.", "15 pessoas, número inicial da fila antes de qualquer entrada."],
    explanation: "f(t) = 8t + 15; f(6) = 48 + 15 = 63.",
    subject: S_MT,
  },
  {
    statement: "O gráfico da função y = x² − 4 é uma parábola com vértice no eixo y. Das opções abaixo, o ponto que pertence ao gráfico da função é:",
    correct: "(3; 5), pois 3² − 4 = 5.",
    wrong: ["(3; 4), obtido sem subtrair a constante da função.", "(2; 1), ponto que não satisfaz a equação y = x² − 4.", "(4; 8), valor da metade do resultado correto para x = 4.", "(0; 4), ponto da parábola sem o sinal de menos da constante."],
    explanation: "Substituindo x = 3: y = 9 − 4 = 5; o ponto (3; 5) está na parábola.",
    subject: S_MT,
  },
  {
    statement: "Ao resolver a equação do segundo grau 2x² − 5x − 3 = 0 para dimensionar uma caixa, o estudante obteve duas raízes. Uma das raízes é:",
    correct: "x = 3, obtida pela fórmula de Bhaskara com discriminante 49.",
    wrong: ["x = 1", "x = −3", "x = 0,5", "x = 5"],
    explanation: "Δ = 25 + 24 = 49; x = (5 ± 7)/4, logo x = 3 ou x = −0,5.",
    subject: S_MT,
  },
  {
    statement: "Um campo retangular de futebol de salão mede 6 m de largura por 8 m de comprimento. Usando a relação de Pitágoras, a medida da diagonal do campo é de:",
    correct: "10 m, pela relação de Pitágoras: raiz de (36 + 64).",
    wrong: ["14 m, soma das duas dimensões do retângulo.", "48 m, produto das duas dimensões do campo.", "7 m, média aritmética entre 6 e 8.", "28 m, valor do perímetro calculado com (6 + 8) × 2."],
    explanation: "d = √(6² + 8²) = √100 = 10 m (ternas 6-8-10).",
    subject: S_MT,
  },
  {
    statement: "Um painel de vidro tem formato de hexágono regular, com os seis lados iguais. A medida de cada ângulo interno desse painel é de:",
    correct: "120°, calculada por ((6 − 2) × 180°)/6.",
    wrong: ["60°, valor do ângulo externo do hexágono regular.", "90°, ângulo interno típico de figuras de quatro lados.", "108°, medida do ângulo interno do pentágono regular.", "135°, medida do ângulo interno do octógono regular."],
    explanation: "Soma dos internos = 720°; dividida por 6 lados, cada ângulo mede 120°.",
    subject: S_MT,
  },
  {
    statement: "Para alcançar um degrau de 0,90 m de altura, uma escada se apoia a 1,20 m da base da parede. A distância entre o pé da escada e o topo do degrau é de:",
    correct: "1,5 m, hipotenusa do triângulo retângulo formado (raiz de 0,81 + 1,44).",
    wrong: ["2,1 m, soma das duas medidas do triângulo formado pela escada.", "0,3 m, diferença entre a base e a altura do degrau.", "1,08 m, produto da altura pela base, sem raiz quadrada.", "2,25 m, soma dos quadrados das catetas sem retirar a raiz."],
    explanation: "d = √(0,9² + 1,2²) = √(0,81 + 1,44) = √2,25 = 1,5 m.",
    subject: S_MT,
  },
  {
    statement: "Uma caixa cúbica de embalagem utilizada no transporte de volumes possui aresta medindo exatamente 6 dm. O volume dessa caixa cúbica é de:",
    correct: "216 dm³, calculado pela aresta elevada ao cubo: 6 × 6 × 6.",
    wrong: ["36 dm³, área de uma face do cubo, e não o volume.", "1.296 dm³, resultado da aresta elevada à quarta potência.", "108 dm³, metade do volume correto da caixa.", "72 dm³, valor obtido multiplicando aresta, área e2."],
    explanation: "V = a³ = 6³ = 216 dm³.",
    subject: S_MT,
  },
  {
    statement: "Uma peça em formato de prisma tem base triangular de área 8 cm² e altura de 12 cm. O volume de material necessário para produzir a peça é de:",
    correct: "96 cm³, calculado por área da base vezes altura: 8 × 12.",
    wrong: ["20 cm³, soma da área da base com a altura da peça.", "48 cm³, metade do volume, por dividir erroneamente por dois.", "192 cm³, dobro do volume correto da peça.", "64 cm³, valor obtido elevando a área da base ao quadrado."],
    explanation: "V = área da base × altura = 8 × 12 = 96 cm³.",
    subject: S_MT,
  },
  {
    statement: "Duas moedas justas e equilibradas são lançadas simultaneamente sobre uma mesa. A probabilidade de as duas moedas caírem com a face cara para cima é de:",
    correct: "1/4, pois há um resultado favorável entre quatro possíveis.",
    wrong: ["1/2, suposição de que sair cara é metade dos lançamentos duplos.", "1/3, fração criada com três resultados considerados possíveis.", "1/6, valor da probabilidade de sair um número específico em um dado.", "2/3, razão entre caras possíveis e total de faces das moedas."],
    explanation: "Resultados: CC, CÇ, ÇC, ÇÇ — apenas CC interessa: 1/4.",
    subject: S_MT,
  },
  {
    statement: "Em um dado de seis faces numeradas de 1 a 6 e completamente equilibrado, a probabilidade de sair um número múltiplo de 3 é de:",
    correct: "1/3, pois há dois favoráveis (3 e 6) entre seis possíveis.",
    wrong: ["1/6, considerando apenas um resultado favorável.", "1/2, fração correspondente a três resultados favoráveis.", "2/3, razão entre resultados múltiplos de2 e de3.", "1/4, valor obtido dividindo os favoráveis pelo dobro do total."],
    explanation: "Favoráveis: 3 e 6 → 2/6 = 1/3.",
    subject: S_MT,
  },
  {
    statement: "Num torneio de xadrez em duplas, cinco inscritos serão sorteados para formar uma única dupla. O número de duplas possíveis é de:",
    correct: "10 duplas, pois C(5,2) = 5!/(2! · 3!) = 10.",
    wrong: ["20 duplas, contando a ordem entre os dois jogadores da dupla.", "5 duplas, escolha apenas do primeiro jogador de cada dupla.", "25 duplas, multiplicação do total de inscritos por 5.", "15 duplas, valor de combinações de seis elementos tomados dois a dois."],
    explanation: "A ordem dentro da dupla não importa: combinação C(5,2) = 10.",
    subject: S_MT,
  },
  {
    statement: "Na escala de aprovação, a prova normal vale 40% e a prova final vale 60%. Quem tirou 5,5 na prova normal e 8,0 na final obteve média:",
    correct: "7,0, calculada por 5,5 × 0,4 + 8,0 × 0,6.",
    wrong: ["6,75, média aritmética simples das duas notas.", "13,5, soma das duas notas sem a aplicação dos pesos.", "5,5, valor da prova normal desconsiderando os pesos.", "8,0, valor da prova final, isolado dos demais componentes."],
    explanation: "Média ponderada: 2,2 + 4,8 = 7,0.",
    subject: S_MT,
  },
  {
    statement: "As idades de cinco moradores de um prédio são 4, 6, 7, 8 e 40 anos. A média aritmética é 13 e a mediana é 7. Essa diferença se explica porque:",
    correct: "a média é sensível a valores extremos, enquanto a mediana não se altera com eles.",
    wrong: ["a mediana é sempre maior que a média em qualquer conjunto de dados.", "a média ignora os valores intermediários e considera apenas os extremos.", "a mediana só pode ser calculada quando há número par de elementos.", "a média correta desse conjunto seria 7, mesmo com a idade de 40 anos."],
    explanation: "A idade de 40 puxa a média para cima; a mediana, por usar a posição central, permanece em 7.",
    subject: S_MT,
  },
  {
    statement: "Numa pesquisa com 40 respondentes, 25 pessoas escolheram a opção A. A frequência relativa da opção A, em percentual, é de:",
    correct: "62,5%, calculada por 25 ÷ 40 × 100.",
    wrong: ["40%, valor total de respondentes lido como percentual.", "25%, número bruto de pessoas que escolheram a opção.", "15%, diferença entre o total e o número de escolhas.", "16%, razão entre a opção A e o triplo do total."],
    explanation: "Frequência relativa = 25/40 = 0,625 = 62,5%.",
    subject: S_MT,
  },
  {
    statement: "Um gráfico de linhas mostra vendas de 200 unidades em 2021, 250 em 2022, 300 em 2023 e 400 em 2024. O ano com maior crescimento absoluto foi:",
    correct: "2024, com aumento de 100 unidades sobre o ano anterior.",
    wrong: ["2021, ano de partida da série, com 200 unidades vendidas.", "2022, ano com crescimento percentual de 25% sobre 2021.", "2023, ano em que as vendas atingiram 300 unidades.", "2023 e 2024 empatados, ambos com aumento de 100 unidades."],
    explanation: "Alturas: +50, +50 e +100; o maior salto absoluto ocorreu em 2024.",
    subject: S_MT,
  },
  {
    statement: "Um observador mede um ângulo de elevação de 30° ao olhar o topo de um farol de 15 m de altura. A distância horizontal do observador até a base do farol é de:",
    correct: "cerca de 26 m, calculada por 15 ÷ tangente de 30° (15 × 1,73).",
    wrong: ["7,5 m, obtida multiplicando a altura por 0,5.", "15 m, valor igual à própria altura do farol.", "10 m, resultado da altura dividida por 1,5.", "52 m, valor correspondente ao dobro da distância correta."],
    explanation: "tg 30° = altura/d → d = 15/0,577 ≈ 26 m.",
    subject: S_MT,
  },
  {
    statement: "Num triângulo retângulo, a cateta oposta a um ângulo mede 12 cm e a hipotenusa mede 20 cm. O seno desse ângulo é igual a:",
    correct: "0,6, pois o seno é a razão entre cateta oposta e hipotenusa: 12/20.",
    wrong: ["0,8, valor do cosseno do mesmo ângulo no triângulo.", "1,67, razão invertida entre hipotenusa e cateta oposta.", "0,36, quadrado da razão correta do ângulo.", "0,5, valor do seno de 30°, ângulo não informado no enunciado."],
    explanation: "sen θ = oposta/hipotenusa = 12/20 = 0,6.",
    subject: S_MT,
  },
  {
    statement: "Para descobrir o valor de x que satisfaz a relação, um estudante montou a equação de primeiro grau 3(x − 2) = 2x + 5. A solução correta dessa equação é:",
    correct: "x = 11, obtido distribuindo o3 e isolando a incógnita: 3x − 6 = 2x + 5.",
    wrong: ["x = 7, por não distribuir o 3 pelo termo entre parênteses.", "x = 6, por esquecer o termo +5 do segundo membro.", "x = 12, ao somar 5 e 6 no primeiro membro da equação.", "x = −11, trocando os sinais dos dois membros."],
    explanation: "3x − 6 = 2x + 5 → 3x − 2x = 5 + 6 → x = 11.",
    subject: S_MT,
  },
  {
    statement: "Marcelo guarda R$ 5,00 na primeira semana em um cofre e acrescenta mais R$ 3,00 a cada semana seguinte, formando uma sequência. O valor depositado na décima semana foi de:",
    correct: "R$ 32,00, pois o décimo depósito soma nove incrementos de R$ 3,00 ao inicial.",
    wrong: ["R$ 35,00, por contar dez incrementos somados ao depósito inicial.", "R$ 30,00, soma apenas dos incrementos, sem o depósito inicial.", "R$ 29,00, contando oito incrementos em vez de nove.", "R$ 41,00, somando R$ 5,00 a doze incrementos de R$ 3,00."],
    explanation: "Termo geral da PA: a₁₀ = 5 + (10 − 1) × 3 = 32.",
    subject: S_MT,
  },
  {
    statement: "Um estudante acertou 60 questões no primeiro simulado e 75 no segundo. O aumento percentual dos acertos no segundo simulado foi de:",
    correct: "25%, calculado pelo aumento de 15 questões sobre a base de 60.",
    wrong: ["15%, diferença bruta entre as duas quantidades de acertos.", "20%, obtido dividindo o aumento pela pontuação do segundo simulado.", "60%, percentual correspondente ao total de acertos do primeiro simulado.", "75%, valor bruto do segundo simulado lido como percentual."],
    explanation: "(75 − 60)/60 × 100% = 15/60 = 25%.",
    subject: S_MT,
  },
];
// ---- ENEM 2026 · Linguagens e Códigos (25 itens) ----
const ITEMS_2026_LC: EnemItem[] = [
  {
    statement: "Um estudante pretende escrever a uma empresa local para solicitar o patrocínio de seu projeto de robótica. Considerando o destinatário e o propósito do texto, o registro linguístico mais adequado é:",
    correct: "formal, com vocabulário preciso, terceira pessoa e tratamento respeitoso ao interlocutor.",
    wrong: ["informal, com gírias e abreviações, para criar proximidade com o leitor.", "coloquial, usando diminutivos e expressões de humor, como em conversa entre amigos.", "literário, com metáforas longas e poéticas, próprias de romance.", "telegráfico, sem pontuação, como em bilhete passado rapidamente ao colega."],
    explanation: "Texto destinado a instituição exige formalidade, clareza e impessoalidade no pedido.",
    subject: S_LC,
  },
  {
    statement: "Um funcionário enviará um e-mail avisando que ficará atrasado à reunião por problema de transporte. A abertura mais adequada ao gênero e à situação comunicativa é:",
    correct: "Bom dia. Peço desculpas pelo atraso, que se deve a um problema no transporte público.",
    wrong: ["E aí, chefe, vou chegar meio atrasado, relaxa aí que apareço já já.", "Caríssimos colegas, espero que todos gozem de boa saúde neste glorioso dia.", "AVISO: ÔNIBUS QUEBROU. CHEGO DEPOIS, SEM CONVERSA.", "Bom dia, queria muito estar aí com vocês, mas acho que hoje não vai dar."],
    explanation: "E-mail profissional pede formalidade moderada, informação clara e breve justificativa.",
    subject: S_LC,
  },
  {
    statement: "Um anúncio tem a finalidade de convencer o leitor a adquirir um produto. O trecho que cumpre essa intencionalidade comunicativa é:",
    correct: "Garanta já o seu: com ele, você resolve em minutos o que antes tomava horas.",
    wrong: ["A empresa foi fundada em 1998 e possui três fábricas no estado.", "Os dados técnicos do produto constam no manual enviado com a embalagem.", "Para dúvidas, consulte o site institucional da marca.", "O fabricante não se responsabiliza por usos diversos do descrito."],
    explanation: "Textos publicitários usam verbos de ação e promessa de benefício para persuadir.",
    subject: S_LC,
  },
  {
    statement: "Num texto, a diferença entre uma afirmação factual e um posicionamento opinativo pode ser identificada principalmente por:",
    correct: "juízos de valor e adjetivos avaliativos, como 'deve' ou 'é benéfico', que revelam a autoria.",
    wrong: ["a presença de datas e números, que aparecem apenas em textos opinativos.", "o uso de primeira pessoa do plural, obrigatório em toda notícia jornalística.", "a quantidade de parágrafos, que indica o grau de opinião do autor.", "a ausência de pontuação, típica dos textos de opinião."],
    explanation: "Fatos são verificáveis; opiniões expressam avaliação, marcada por modalidade e adjetivos.",
    subject: S_LC,
  },
  {
    statement: "Leia a frase: 'O projeto foi aprovado pela comissão. ______, ele não terá verba neste exercício.' O conector que melhor expressa a relação de oposição entre as duas ideias é:",
    correct: "Contudo,",
    wrong: ["Portanto,", "Além disso,", "Por conseguinte,", "Em síntese,"],
    explanation: "A segunda oração contraria a expectativa criada pela primeira: é relação de oposição.",
    subject: S_LC,
  },
  {
    statement: "Complete a frase: 'Maria estudou todas as noites do semestre; ______, foi aprovada na seleção.' O conector que indica conclusão e melhor se adequa ao contexto é:",
    correct: "por isso,",
    wrong: ["embora,", "no entanto,", "apesar disso,", "por outro lado,"],
    explanation: "A segunda oração é consequência da primeira, exigindo conector conclusivo.",
    subject: S_LC,
  },
  {
    statement: "Num bilhete, uma amiga escreve: 'Não ligue para as críticas deles; sua pele já está bem grossa.' No contexto do bilhete, a expressão 'ter a pele grossa' significa:",
    correct: "não se abalar diante de críticas e provocações.",
    wrong: ["estar fisicamente protegido do frio com roupas adequadas.", "ter a pele ressecada por causa do clima seco do inverno.", "ser uma pessoa rude e mal-educada com os outros.", "praticar esportes ao ar livre com muita frequência."],
    explanation: "O sentido figurado de 'pele grossa' é tolerância a crítica, não a condição física da pele.",
    subject: S_LC,
  },
  {
    statement: "Após um colega derrubar o protótipo do projeto inteiro, Lucas disse: 'Nossa, que cuidado exemplar o seu!' A frase é irônica porque:",
    correct: "elogia em excesso justamente a atitude contrária à elogiada — o erro cometido.",
    wrong: ["elogia sinceramente a habilidade do colega em manipular os objetos.", "critica diretamente a qualidade do projeto, sem referência à atitude.", "expressa dúvida sobre o resultado do trabalho apresentado.", "procura consolar o colega com palavras de encorajamento."],
    explanation: "Ironia é dizer o contrário do que se pensa; o elogio destaca a falha do colega.",
    subject: S_LC,
  },
  {
    statement: "Uma secretaria de saúde escreverá um texto sobre vacinação dirigido a crianças de 7 anos. O texto deve apresentar, sobretudo:",
    correct: "linguagem simples e lúdica, com vocabulário conhecido das crianças e apoio de imagens.",
    wrong: ["termos técnicos completos, como 'administração parenteral', para precisão científica.", "registro altamente formal, com artigos de opinião e citações bibliográficas.", "abreviações e gírias da internet, para aproximar-se do público jovem.", "frases longas com períodos complexos, que estimulem raciocínio avançado."],
    explanation: "Adequação ao destinatário: crianças pedem linguagem acessível e contexto familiar.",
    subject: S_LC,
  },
  {
    statement: "Em uma dissertação sobre saúde pública, o trecho 'A campanha foi super legal e ajudou pra caramba' destoa do registro por conter:",
    correct: "expressões coloquiais e gírias, incompatíveis com a norma culta exigida pelo gênero.",
    wrong: ["verbos na primeira pessoa do plural, jamais admitidos em textos dissertativos.", "a voz passiva, que não pode aparecer em textos argumentativos.", "palavras longas demais, que prejudicam a leitura do texto.", "a palavra 'você', proibida em qualquer texto escrito formal."],
    explanation: "Dissertação exige norma culta; 'super legal' e 'pra caramba' são marcas de oralidade.",
    subject: S_LC,
  },
  {
    statement: "Um revisor recebeu quatro versões de uma mesma frase num texto jornalístico. Entre as frases abaixo, a única redigida em conformidade com a norma-padrão é:",
    correct: "Há muitas pessoas esperando na fila desde as seis da manhã.",
    wrong: ["Existe muitas pessoas esperando na fila desde as seis da manhã.", "Haviam muitas pessoas esperando na fila desde as seis da manhã.", "Tem muitas pessoas esperando na fila desde as seis da manhã.", "Através de muitas pessoas, espera-se na fila desde as seis da manhã."],
    explanation: "'Haver' no sentido de existir é impessoal e impõe verbo no singular: há muitas pessoas.",
    subject: S_LC,
  },
  {
    statement: "Numa prova de língua portuguesa, o examinador pediu a frase em que o acento indicativo de crase está empregado corretamente em todas as suas ocorrências:",
    correct: "O delegado viajou à Brasília para prestar esclarecimentos à autoridade.",
    wrong: ["O segurança olhou à direita antes de liberar a entrada do prédio.", "O funcionário chegou à pé no escritório no primeiro dia de trabalho.", "A atividade começa à anoitecer, segundo informa o edital.", "O estudante assinou à lápis, em vez de caneta, o termo de entrega."],
    explanation: "'Para a' + palavra feminina pede crase (à Brasília); 'a pé', 'a direita' e 'a lápis' não levam crase.",
    subject: S_LC,
  },
  {
    statement: "Entre as opções abaixo, a frase corretamente pontuada, com vírgula separando oração subordinada temporal do período principal, é:",
    correct: "Quando o sinal tocou, os alunos se levantaram e saíram em silêncio.",
    wrong: ["Quando o sinal tocou os alunos, se levantaram e saíram em silêncio.", "Quando o sinal; tocou, os alunos se levantaram e saíram em silêncio.", "Quando: o sinal tocou, os alunos se levantaram e saíram em silêncio.", "Quando o sinal tocou, os alunos se levantaram, e saíram em silêncio."],
    explanation: "Oração introdutória separada do corpo do período por vírgula; sem ela, cria-se ambiguidade.",
    subject: S_LC,
  },
  {
    statement: "A frase em que o pronome relativo 'que' restringe o sentido do substantivo anterior — sem vírgulas —, indicando apenas parte do conjunto, é:",
    correct: "Os alunos que estudaram para a prova foram aprovados.",
    wrong: ["Os alunos, que estudaram para a prova, foram aprovados.", "Os alunos, que estudaram para a prova foram aprovados.", "Os alunos de que estudaram foram aprovados.", "Os alunos o que estudaram foram aprovados."],
    explanation: "Sem vírgulas, 'que' é restritivo: só os alunos que estudaram foram aprovados; com vírgulas, todos.",
    subject: S_LC,
  },
  {
    statement: "Num e-mail formal para um professor, o trecho que emprega corretamente os pronomes oblíqueos e mantém o registro adequado é:",
    correct: "Poderia enviar-me o arquivo até sexta-feira, por gentileza?",
    wrong: ["Me manda o arquivo até sexta, por favor, tá?", "Envia pra mim o arquivo na sexta-feira, beleza?", "Dar para você me mandar o arquivo ainda hoje?", "Você me envia o arquivo na sexta, tá bom?"],
    explanation: "Registro formal pede colocação pronominal átona após o verbo (enviar-me) e fórmulas de cortesia.",
    subject: S_LC,
  },
  {
    statement: "Um redator precisa reescrever a oração 'A diretoria aprovou o novo regulamento' mantendo o mesmo conteúdo, porém na voz passiva. A frase correta é:",
    correct: "O novo regulamento foi aprovado pela diretoria.",
    wrong: ["O novo regulamento aprova a diretoria.", "Pela diretoria, o novo regulamento havia aprovado.", "O novo regulamento é aprovado pela diretoria todo ano.", "A diretoria foi aprovada pelo novo regulamento."],
    explanation: "Na voz passiva, o paciente vira sujeito e o agente aparece com 'por'; o tempo verbal se mantém.",
    subject: S_LC,
  },
  {
    statement: "Complete o aviso: 'Quando eu chegar em casa, o relatório ______ (estar) pronto para revisão.' A forma verbal que preenche corretamente o espaço é:",
    correct: "estará, pois trata-se de situação futura em relação a outro momento futuro.",
    wrong: ["estava, pois a ação anterior exige o pretérito imperfeito.", "está, pois o presente do indicativo cobre qualquer tempo futuro.", "estivera, pois o futuro do pretérito antecede sempre o presente.", "esteja, pois o subjuntivo é obrigatório na oração principal."],
    explanation: "Futuro do presente do indicativo para estado futuro: quando eu chegar, estará pronto.",
    subject: S_LC,
  },
  {
    statement: "Num texto escolar, quatro frases tentam expressar a escassez de alunos no dia do feriado. A única que emprega corretamente o verbo 'haver' no sentido de existir é:",
    correct: "Havia poucos alunos na sala no dia do feriado, e por isso a aula foi suspensa.",
    wrong: ["Houviam poucos alunos na sala no dia do feriado, e por isso a aula foi suspensa.", "Haveram poucos alunos na sala no dia do feriado, e por isso a aula foi suspensa.", "Tinha poucos alunos na sala no dia do feriado, e por isso a aula foi suspensa.", "Houve, tinha poucos alunos na sala no feriado, e a aula foi suspensa."],
    explanation: "'Haver' com sentido de existir é impessoal: verbo sempre no singular, sem concordância.",
    subject: S_LC,
  },
  {
    statement: "Entre as frases abaixo, a única que apresenta uma tese — isto é, um juízo de valor defensável em texto dissertativo — é:",
    correct: "As cidades brasileiras devem priorizar o transporte coletivo sobre o carro individual.",
    wrong: ["O metrô de São Paulo foi inaugurado em 1974 e possui seis linhas atuais.", "Segundo o IBGE, a população do país ultrapassou 200 milhões de habitantes.", "A estação de trem fica a cem metros da escola técnica do bairro.", "Pesquisa divulgada em janeiro apontou queda da inflação no trimestre."],
    explanation: "Tese é posição argumentativa verificável como defensável; as demais frases são fatos.",
    subject: S_LC,
  },
  {
    statement: "Um texto dissertativo tratará dos benefícios da leitura infantil. A frase que melhor funcionaria como tópico frasal do primeiro parágrafo é:",
    correct: "Ler desde cedo amplia o vocabulário e fortalece a imaginação da criança.",
    wrong: ["O livro usado na pesquisa foi publicado em 1960 por editora carioca.", "A biblioteca municipal fica aberta às terças e quintas-feiras.", "O exemplar consultado tem 120 páginas e capa dura.", "A edição utilizada custa R$ 34,90 na livraria do centro."],
    explanation: "Tópico frasal anuncia a ideia central do parágrafo; as demais frases são dados avulsos.",
    subject: S_LC,
  },
  {
    statement: "Um blogueiro de divulgação científica explica como a telemedicina aproxima pacientes de regiões distantes dos especialistas. O título mais adequado ao gênero e ao conteúdo é:",
    correct: "A consulta que atravessa distâncias sem sair de casa.",
    wrong: ["Últimas notícias da saúde no Brasil e no mundo.", "Aspectos jurídicos da responsabilidade na teleconsulta.", "Manual do paciente para uso do aplicativo de consultas.", "Relatório técnico de teleconsultas remotas do hospital."],
    explanation: "Título divulgativo deve ser sugestivo e fiel ao tema, sem ser genérico nem técnico demais.",
    subject: S_LC,
  },
  {
    statement: "Num artigo científico, o trecho 'O método foi muito legal para os pacientes' destoa do registro acadêmico. A substituição mais adequada é:",
    correct: "O método mostrou-se bastante favorável aos pacientes.",
    wrong: ["O método foi super bacana para os pacientes.", "O método ficou massa pra caramba nos pacientes.", "O método deu certo nos pacientes, uau!", "O método foi muito legal para os pacientes, né?"],
    explanation: "Registro acadêmico exige vocabulário técnico e impessoal, afastando gírias e oralidade.",
    subject: S_LC,
  },
  {
    statement: "Uma escola enviará aos pais um comunicado sobre a mudança do horário das reuniões. O texto deve conter, prioritariamente:",
    correct: "informações objetivas: novo horário, data, local e prazo de resposta.",
    wrong: ["críticas ao calendário acadêmico, para justificar publicamente a mudança.", "narrativa emocional sobre a rotina diária dos professores.", "argumentos persuasivos para vender os cursos extras da escola.", "citações literárias que embelezem a mensagem enviada."],
    explanation: "Comunicado é gênero informativo: dados objetivos e prazos, sem função persuasiva ou narrativa.",
    subject: S_LC,
  },
  {
    statement: "Leia: 'Carlos faltou ao exame sem avisar. Por isso, teve de refazer a prova no mês seguinte.' A expressão 'Por isso' retoma, como causa do ocorrido:",
    correct: "a falta ao exame sem aviso, que motivou a repetição da prova.",
    wrong: ["a boa nota obtida por Carlos no exame anterior.", "a reunião de pais que antecedeu a data do exame.", "o aviso de falta que Carlos enviou à escola.", "a segunda aplicação da prova realizada no mês seguinte."],
    explanation: "'Por isso' é conectivo causal anafórico: retoma a ideia anterior (a falta sem aviso) como causa.",
    subject: S_LC,
  },
  {
    statement: "Um trecho afirma: 'Embora a energia solar ainda dependa de incentivos, os custos de instalação caíram 70% na última década, tornando o painel doméstico acessível à classe média.' O resumo fiel desse trecho é:",
    correct: "Com a forte queda dos custos, a energia solar se tornou acessível, embora ainda dependa de incentivos.",
    wrong: ["A energia solar não é viável e permanece muito cara para as famílias.", "Os custos caíram 70% e, por isso, o governo encerrou todos os incentivos.", "A energia elétrica domiciliar teve queda de 70% de preço nesta década.", "O texto compara energia solar com outras fontes do mercado brasileiro."],
    explanation: "Resumo mantém as duas ideias (queda de custos e dependência de incentivos) sem distorcer nem inventar.",
    subject: S_LC,
  },
];
// ---- ENEM 2026 · Ciências Humanas e suas Tecnologias (25 itens) ----
const ITEMS_2026_CH: EnemItem[] = [
  {
    statement: "A Constituição brasileira de 1937, outorgada durante o Estado Novo, ficou conhecida como Polaca. Um traço marcante desse documento era:",
    correct: "a concentração dos poderes no presidente, com supressão de liberdades públicas e partidos.",
    wrong: ["a ampliação do direito de greve e a criação de sindicatos livres.", "o voto feminino e a criação do Conselho de Estado.", "a soberania do Parlamento sobre o Poder Executivo.", "a autonomia plena dos estados e a federação descentralizada."],
    explanation: "A Carta de 1937 legitimou o autoritarismo de Vargas: partido oficial, censura e poderes concentrados.",
    subject: S_CH,
  },
  {
    statement: "Em 1945, o fim do Estado Novo no Brasil ocorreu sob forte pressão popular. O fato que melhor explica a redemocratização é:",
    correct: "a renúncia de Vargas diante de greves e mobilizações que exigiam eleições livres.",
    wrong: ["a invasão do país por potências estrangeiras que impuseram eleições.", "o fechamento do Congresso por decreto militar em 1945.", "o restabelecimento do voto censitário pela elite cafetalera.", "a adoção do sufrágio exclusivo masculino de renda alta."],
    explanation: "Mobilizações como a greve de 1945 e a campanha 'Queremismo' pressionaram a convocação de eleições.",
    subject: S_CH,
  },
  {
    statement: "A expressão 'A cobra está fumando', usada em 1944, está associada à participação brasileira na Segunda Guerra Mundial. Seu significado histórico é:",
    correct: "anunciar a entrada da Força Expedicionária Brasileira na campanha da Itália.",
    wrong: ["despedida simbólica dos imigrantes italianos no porto de Santos.", "nome do quartel-general brasileiro instalado em Nápoles.", "lema oficial da Marinha brasileira no teatro do Pacífico.", "declaração de rendição dos prisioneiros alemães capturados."],
    explanation: "A frase, de Hertha Amin, celebrou a FEB enviada à Itália — o Brasil só combateu na Europa.",
    subject: S_CH,
  },
  {
    statement: "Entre as décadas de 1950 e 1970, o Brasil viveu intenso deslocamento populacional do campo para as cidades. A causa estrutural desse processo foi:",
    correct: "a mecanização agrícola e a concentração fundiária, que expulsaram trabalhadores do campo.",
    wrong: ["a abolição da escravidão e a vinda massiva de imigrantes europeus.", "o colonialismo de povoamento promovido pelo governo militar.", "os investimentos estrangeiros no setor de mineração amazônica.", "a proibição oficial do cultivo de café no interior do país."],
    explanation: "Menos mão de obra no campo + industrialização nas cidades = êxodo rural e crescimento urbano acelerado.",
    subject: S_CH,
  },
  {
    statement: "O Ato Institucional nº 5 (AI-5), editado em dezembro de 1968, aprofundou o regime militar brasileiro. Entre as medidas desse documento, destacou-se:",
    correct: "a suspensão do habeas corpus e o fechamento do Congresso, ampliando a repressão política.",
    wrong: ["a abertura imediata das eleições presidenciais diretas de 1969.", "a garantia constitucional do direito de greve aos trabalhadores.", "o fim da censura prévia sobre imprensa, rádio e cinema.", "a devolução do poder aos civis por meio de eleição parlamentar."],
    explanation: "O AI-5 deu ao Executivo poder de fechar o Congresso, intervir nos estados e censurar a imprensa.",
    subject: S_CH,
  },
  {
    statement: "Entre 1983 e 1984, a campanha das Diretas Já reuniu comícios com milhões de brasileiros em todo o país. O objetivo central desse movimento era assegurar:",
    correct: "a eleição direta para a presidência da República, com voto popular universal.",
    wrong: ["a eleição indireta ampliada, com mais parlamentares no Colégio Eleitoral.", "a constituinte exclusiva para reformar a Constituição de 1967.", "o voto censitário baseado na renda dos candidatos.", "a redução do mandato presidencial para dois anos."],
    explanation: "A emenda Dante de Oliveira, que instituía o voto direto, foi rejeitada em 1984.",
    subject: S_CH,
  },
  {
    statement: "Nas grandes cidades brasileiras, milhares de famílias ocupam áreas periféricas sem água, esgoto ou transporte. Essa ocupação reflete, em última análise:",
    correct: "o acesso desigual ao solo urbano e à moradia, combinado à migração acelerada.",
    wrong: ["o planejamento estatal que reservou moradias centrais aos migrantes.", "a queda contínua da população urbana nas últimas décadas.", "uma política de zoneamento exclusivo da área rural.", "a oferta regular de crédito habitacional de baixo custo."],
    explanation: "Sem acesso ao mercado formal de moradia, a população ocupa áreas improvidas de serviços.",
    subject: S_CH,
  },
  {
    statement: "Pesquisas mostram que, em dias de calor extremo, as áreas centrais de São Paulo são mais quentes que o entorno rural. Esse fenômeno, chamado ilha de calor, explica-se porque:",
    correct: "asfalto e concreto absorvem e retêm calor, e há pouca vegetação para amenizar a temperatura.",
    wrong: ["a vegetação nativa emite mais calor que o asfalto das avenidas.", "a altitude do centro urbano reduz a cobertura de nuvens.", "a maior umidade do ar urbano mantém a temperatura sempre baixa.", "os grandes rios urbanos refrigeram o meio rural ao redor."],
    explanation: "Superfícies impermeáveis e ausência de áreas verdes elevam a temperatura urbana em relação ao entorno.",
    subject: S_CH,
  },
  {
    statement: "Multinacionais têm transferido fábricas para países periféricos em busca de maior competitividade. O principal atrativo desses territórios para a instalação de plantas industriais é:",
    correct: "o menor custo da mão de obra e legislações trabalhistas e ambientais mais flexíveis.",
    wrong: ["o fortalecimento dos sindicatos e o aumento dos encargos trabalhistas.", "a abertura de fronteiras comerciais apenas entre países pobres.", "o aumento dos impostos de importação nos países desenvolvidos.", "a escassez absoluta de energia elétrica nas regiões industriais."],
    explanation: "A localização industrial segue custos de produção baixos e regulamentação menos rígida.",
    subject: S_CH,
  },
  {
    statement: "No Brasil, a distribuição desigual da terra é evidenciada historicamente pela coexistência de formas opostas de propriedade, quais sejam:",
    correct: "latifúndios extensivos ao lado de minifúndios de baixa produtividade.",
    wrong: ["propriedades uniformes, com média de cinquenta hectares em todas as regiões.", "a extinção total dos pequenos sítios após as reformas agrárias.", "o predomínio absoluto da agricultura familiar em todo o território.", "áreas rurais coletivizadas pelo Estado em todas as unidades da federação."],
    explanation: "A concentração fundiária convive com unidades pequenas e improdutivas — retrato da desigualdade rural.",
    subject: S_CH,
  },
  {
    statement: "O desmatamento na Amazônia é um dos grandes problemas ambientais brasileiros. Suas causas imediatas mais frequentes são:",
    correct: "abertura de pastagens, extração madeireira ilegal e grilagem de terras.",
    wrong: ["a expansão da agricultura de sequeiro na região Sul do país.", "a redução da população ribeirinha nas áreas protegidas.", "o aumento da proteção integral em unidades de conservação.", "a diminuição do rebanho bovino na fronteira agrícola."],
    explanation: "Criação de gado, madeira ilegal e apropriação de terras públicas são os vetores diretos do desmatamento.",
    subject: S_CH,
  },
  {
    statement: "Ao longo do século XX e do início do XXI, o Brasil passou por uma transição demográfica marcada pela queda da fecundidade. Essa transição caracterizou-se por:",
    correct: "queda da fecundidade e do crescimento vegetativo, com envelhecimento progressivo da população.",
    wrong: ["aumento das taxas de natalidade e redução da esperança de vida.", "estagnação da população urbana e retomada do crescimento rural.", "imigração europeia massiva registrada após 1950.", "duplicação da população total a cada dez anos desde 1900."],
    explanation: "Com menos filhos e maior longevidade, a pirâmide etária envelhece e o crescimento desacelera.",
    subject: S_CH,
  },
  {
    statement: "Ao estudar a vida em sociedade, um sociólogo observa que cada grupo exerce pressão sobre o comportamento de seus membros. Em Sociologia, norma social pode ser definida como:",
    correct: "regra de conduta aceita pelo grupo, que orienta comportamentos e prevê sanções.",
    wrong: ["lei escrita sancionada exclusivamente pelo Estado.", "instinto biológico inalterável dos seres humanos.", "preferência individual sem qualquer influência coletiva.", "produto temporário da vontade de uma única pessoa."],
    explanation: "Normas sociais vão além da lei: existem em grupos e instituições, com sanções informais.",
    subject: S_CH,
  },
  {
    statement: "O carnaval de rua, o axé baiano e o forró do Nordeste podem ser interpretados, no contexto da cultura brasileira, como exemplos de:",
    correct: "produção cultural popular que mescla tradições locais com influências externas.",
    wrong: ["manifestações artísticas importadas sem nenhum elemento nacional.", "práticas criadas e mantidas exclusivamente pela elite cultural.", "manifestações proibidas pela legislação cultural brasileira.", "ritos religiosos obrigatórios em todas as cidades do país."],
    explanation: "Culturas populares demonstram mestiçagem e apropriação criativa, não cópia passiva.",
    subject: S_CH,
  },
  {
    statement: "No estudo de Max Weber sobre a ética protestante e o espírito do capitalismo, o autor associa o surgimento do capitalismo moderno à valorização de:",
    correct: "o trabalho disciplinado, a poupança e a reinversão dos frutos do trabalho.",
    wrong: ["o consumo suntuário estimulado pela Igreja medieval.", "a renúncia budista a todos os bens materiais.", "a proibição islâmica absoluta de qualquer forma de juros.", "o ateísmo moderno como condição do comércio."],
    explanation: "Para Weber, a vocação protestante e a ética do trabalho ajudaram a formar o capitalismo moderno.",
    subject: S_CH,
  },
  {
    statement: "Criado em 1984 e presente em vários estados brasileiros, o Movimento dos Trabalhadores Rurais Sem Terra (MST) atua na sociedade para, sobretudo:",
    correct: "reivindicar reforma agrária e a regularização de assentamentos de famílias rurais.",
    wrong: ["representar os produtores do agronegócio em negociações internacionais.", "funcionar como partido político com bancadas no Senado.", "concentrar pequenos comerciantes urbanos de capitais.", "administrar escolas privadas ligadas a igrejas evangélicas."],
    explanation: "O MST é movimento social de luta pela terra, com ocupações e pedidos de titulação.",
    subject: S_CH,
  },
  {
    statement: "Nas capitais brasileiras, redes de fast-food globais convivem com feiras de produtos regionais. Essa convivência indica que a globalização cultural produz:",
    correct: "apropriações e acomodações locais, em vez de apagar as culturas regionais.",
    wrong: ["a substituição completa das tradições alimentares locais.", "a eliminação da diversidade linguística das cidades.", "a restrição da cultura ao espaço das redes digitais.", "o impedimento total da circulação de produtos estrangeiros."],
    explanation: "Fluxos globais são reinterpretados localmente — hibridização, e não homogeneização absoluta.",
    subject: S_CH,
  },
  {
    statement: "Nas praças de Atenas, Sócrates questionava os cidadãos sobre a justiça e a virtude. O método socrático praticado nessas conversas baseia-se em:",
    correct: "questionar o interlocutor para que ele próprio chegue à definição verdadeira.",
    wrong: ["transmitir prontas respostas memorizadas ao discípulo.", "usar a força para impor a verdade ao oponente.", "evitar perguntas e concentrar-se em discursos longos.", "basear-se em textos religiosos aceitos sem discussão."],
    explanation: "A maiêutica socrática faz o outro 'dar à luz' o conhecimento por meio da pergunta.",
    subject: S_CH,
  },
  {
    statement: "Na ética utilitarista, Bentham e Mill propõem um critério único para decidir se uma ação é moralmente correta. Segundo esse critério, a moralidade de uma ação deve ser avaliada com base em:",
    correct: "a produção da maior soma de bem-estar para o maior número de pessoas.",
    wrong: ["a obediência estrita a mandamentos divinos revelados.", "o lucro exclusivo obtido pelo indivíduo que age.", "a inexistência de qualquer critério objetivo de moral.", "a antiguidade histórica da tradição praticada."],
    explanation: "O princípio da maior felicidade é consequencialista: importa o resultado em bem-estar coletivo.",
    subject: S_CH,
  },
  {
    statement: "O imperativo categórico kantiano — 'aja apenas segundo a máxima que possa ao mesmo tempo tornar-se lei universal' — exige que o agente:",
    correct: "universalize a própria ação antes de praticá-la, eliminando o arbítrio pessoal.",
    wrong: ["obedeça apenas às suas inclinações do momento.", "considere moralmente bom o que produz prazer imediato.", "adote regras diferentes para cada pessoa encontrada.", "calcule sempre as consequências materiais da ação."],
    explanation: "Kant funda a moral na forma da lei universal, não em desejos ou resultados.",
    subject: S_CH,
  },
  {
    statement: "Na dúvida metódica de Descartes, o filósofo suspende todas as crenças dos sentidos para encontrar uma certeza indubitável. Essa certeza é:",
    correct: "a existência do próprio pensamento: penso, logo existo.",
    wrong: ["a existência imediata e segura do corpo físico.", "a autoridade da Igreja sobre as questões filosóficas.", "a veracidade dos sentidos em todas as situações.", "a impossibilidade de qualquer conhecimento seguro."],
    explanation: "Mesmo duvidando de tudo, não posso duvidar de que estou duvidando — o cogito.",
    subject: S_CH,
  },
  {
    statement: "Para Aristóteles, a virtude moral se configura como um ponto médio entre dois extremos viciosos, e se alcança por meio de:",
    correct: "o hábito de escolher o justo meio entre o excesso e a falta.",
    wrong: ["um dom natural dado aos nobres desde o nascimento.", "a satisfação ilimitada de todos os desejos materiais.", "a vingança contra aqueles que nos causam dano.", "a memorização mecânica de regras exteriores."],
    explanation: "A ética aristotélica é prática: virtude se adquire repetindo atos moderados.",
    subject: S_CH,
  },
  {
    statement: "Na teoria do contrato social de Hobbes, os indivíduos vivem inicialmente em guerra de todos contra todos. Por isso, abrem mão de parte da liberdade natural em troca de:",
    correct: "segurança e ordem garantidas por um soberano com poder sobre todos.",
    wrong: ["a eliminação de qualquer autoridade comum entre os cidadãos.", "o direito de cada um de julgar o bem e o mal isoladamente.", "a propriedade plena sem leis escritas e sem juízes.", "a distribuição igualitária espontânea de todos os bens."],
    explanation: "Hobbes troca a liberdade ilimitada do estado de natureza pela paz garantida pelo Leviatã.",
    subject: S_CH,
  },
  {
    statement: "A Lei Eusébio de Queirós, de 1850, destinava-se a coibir o tráfico de escravizados para o Brasil. Seu efeito imediato foi:",
    correct: "encerrar legalmente o tráfico atlântico, deslocando a escravização para dentro do país.",
    wrong: ["abolir de imediato a escravização em todo o território imperial.", "declarar livres todos os nascidos a partir da data da lei.", "distribuir terras aos trabalhadores recém-libertados.", "ampliar o voto censitário para os trabalhadores libertos."],
    explanation: "A lei proibiu o tráfico marítimo; a escravidão interna persistiu até 1888.",
    subject: S_CH,
  },
  {
    statement: "Programas de transferência de renda com condicionalidades, como a exigência de frequência escolar, buscam principalmente:",
    correct: "reduzir a pobreza extrema exigindo compromissos com educação e saúde.",
    wrong: ["aumentar o consumo de bens de luxo pelas classes médias.", "substituir integralmente o mercado de trabalho formal.", "financiar empresas privadas de assistência médica.", "ampliar o crédito bancário para importações de consumo."],
    explanation: "Condicionar o benefício a serviços públicos quebra ciclos de desigualdade estrutural.",
    subject: S_CH,
  },
];
// ---- ENEM 2026 · Ciências da Natureza e suas Tecnologias (25 itens) ----
const ITEMS_2026_CN: EnemItem[] = [
  {
    statement: "Numa infecção bacteriana, o organismo produz anticorpos específicos por meio da resposta imunológica adaptativa. Esses anticorpos, sintetizados pelos plasmócitos, desempenham papel central porque:",
    correct: "ligam-se a epítopos específicos do antígeno, neutralizando-o ou marcando-o para destruição.",
    wrong: ["digerem os vírus por ação enzimática direta sobre a cápside.", "substituem as células infectadas na regeneração dos tecidos.", "transportam oxigênio até os sítios de infecção no organismo.", "reproduzem-se dentro das bactérias invasoras do corpo."],
    explanation: "Anticorpos são específicos: reconhecem o antígeno e sinalizam sua destruição.",
    subject: S_CN,
  },
  {
    statement: "Uma doença autossômica recessiva só se manifesta em indivíduos homozigotos (aa). Um casal heterozigoto (Aa × Aa) espera um filho. A probabilidade de o filho ser afetado pela doença é de:",
    correct: "25%, pois a combinação genotípica aa ocorre em um quatro dos casos.",
    wrong: ["50%, fração dos filhos que herdam pelo menos um alelo dominante.", "75%, proporção dos filhos com fenótipo saudável.", "100%, pois ambos os pais carregam o alelo recessivo.", "0%, já que a doença exige dois alelos recessivos dos avós."],
    explanation: "Cruzamento Aa × Aa: AA, Aa, Aa e aa — apenas aa é afetado (1/4 = 25%).",
    subject: S_CN,
  },
  {
    statement: "Após um incêndio que queimou a vegetação de uma área, o solo permaneceu com sementes, microrganismos e matéria orgânica. A recolonização do local é um exemplo de:",
    correct: "sucessão ecológica secundária, pois o solo não foi destruído pelo distúrbio.",
    wrong: ["sucessão primária, já que toda a vegetação desapareceu da área.", "clímax instantâneo, sem intermediários, em poucos dias.", "retrocessão evolutiva, com perda definitiva da biodiversidade.", "sucessão primária, porque o fogo formou rocha nua exposta."],
    explanation: "Quando o solo sobrevive ao distúrbio, chama-se sucessão secundária (mais rápida).",
    subject: S_CN,
  },
  {
    statement: "Após uma refeição rica em carboidratos, a concentração de glicose no sangue aumenta. O pâncreas responde a esse estímulo secretando um hormônio cuja ação principal é:",
    correct: "a insulina, que estimula a captação de glicose pelas células, reduzindo a glicemia.",
    wrong: ["o glucagon, que é secretado para reduzir a glicose após as refeições.", "a insulina, que promove a quebra de glicogênio para elevar o açúcar.", "a adrenalina, que mantém a glicemia estável durante o repouso.", "a glicose, que é convertida em aminoácidos pelas células musculares."],
    explanation: "Insulina hipoglicemiante: capta glicose; glucagon hiperglicemiante: quebra glicogênio.",
    subject: S_CN,
  },
  {
    statement: "As folhas das plantas parecem verdes porque a clorofila interage com a luz visível de modo característico. Essa cor é observada porque:",
    correct: "a luz verde é majoritariamente refletida pela clorofila, chegando aos nossos olhos.",
    wrong: ["a luz vermelha é refletida porque possui baixa energia.", "a luz azul atravessa a folha sem sofrer qualquer absorção.", "a luz ultravioleta é bloqueada totalmente pelo cloroplasto.", "toda a luz visível é absorvida igualmente pelas folhas."],
    explanation: "Clorofila absorve muito bem azul e vermelho; reflete o verde — daí a cor.",
    subject: S_CN,
  },
  {
    statement: "No processo de expressão gênica, a etapa em que a informação do mRNA é decodificada para montar uma cadeia de aminoácidos acontece no:",
    correct: "ribossomo, onde ocorre a tradução do mRNA em proteína.",
    wrong: ["retículo endoplasmático, que produz lipídios na membrana.", "lisossomo, que digere resíduos celulares por enzimas.", "núcleo, que armazena o mRNA até o fim da célula.", "centríolo, que participa apenas da divisão celular."],
    explanation: "Dogma: transcrição no núcleo, tradução no ribossomo.",
    subject: S_CN,
  },
  {
    statement: "No coração humano, o sangue oxigenado deixa o ventrículo esquerdo e atravessa a válvula aórtica. Após passar por essa válvula, esse sangue é encaminhado para:",
    correct: "a circulação sistêmica, distribuindo sangue oxigenado a todo o corpo.",
    wrong: ["a circulação pulmonar, levando o sangue de volta aos pulmões.", "o átrio direito, retornando imediatamente ao coração.", "a veia cava, drenando o sangue de volta do abdômen.", "o ducto arterioso, ligando as duas circulações do embrião."],
    explanation: "Ventrículo esquerdo → aorta → circulação sistêmica (corpo todo).",
    subject: S_CN,
  },
  {
    statement: "A água apresenta calor latente de vaporização elevado em comparação a muitos líquidos. A principal razão molecular para esse fato é:",
    correct: "as pontes de hidrogênio entre moléculas de água exigem muita energia para serem rompidas.",
    wrong: ["as ligações covalentes O–H se quebrarem parcialmente ao ferver.", "a massa molar elevada da molécula de água.", "a ausência de forças intermoleculares no estado líquido.", "as ligações iônicas entre átomos de hidrogênio e oxigênio."],
    explanation: "Superfície de hidrogênio forte exige energia extra para separar moléculas.",
    subject: S_CN,
  },
  {
    statement: "Um laboratório prepara 500 mL de solução de cloreto de sódio (NaCl) com concentração molar de 0,2 mol/L. A quantidade de NaCl dissolvida é de:",
    correct: "0,1 mol, equivalentes a 5,84 g de NaCl na metade do litro.",
    wrong: ["0,2 mol, pois a molaridade independe do volume da solução.", "0,4 mol, já que o NaCl se dissociaria em dois íons.", "58,4 g dissolvidos no volume total de meio litro.", "5,84 g, mas apenas se o volume fosse de um litro."],
    explanation: "n = M × V = 0,2 × 0,5 = 0,1 mol → 0,1 × 58,4 = 5,84 g.",
    subject: S_CN,
  },
  {
    statement: "Um estudante adiciona gotas de ácido clorídrico (HCl) a um recipiente contendo água destilada e mede o pH com um papel indicador. A acidez da solução sofre, então, a seguinte variação:",
    correct: "o pH diminui, pois a concentração de íons H₃O⁺ aumenta na solução.",
    wrong: ["o pH aumenta, porque o HCl retira hidroxilas da água.", "o pH permanece neutro, já que o volume quase não muda.", "a solução fica básica, com pH acima de sete.", "o pH deixa de se aplicar a soluções aquosas diluídas."],
    explanation: "HCl dissociado eleva [H₃O⁺] e, portanto, reduz o pH (escala logarítmica).",
    subject: S_CN,
  },
  {
    statement: "Na tabela periódica, ao percorrer um mesmo grupo do topo para a base, o raio atômico dos elementos apresenta o seguinte comportamento:",
    correct: "aumenta, pois novos níveis de energia são adicionados aos átomos.",
    wrong: ["diminui, devido ao aumento da carga nuclear.", "permanece constante em todos os grupos.", "torna-se nulo nos metais de transição.", "oscila de forma imprevisível, sem padrão."],
    explanation: "Mais camadas eletrônicas > raio maior, mesmo com mais prótons.",
    subject: S_CN,
  },
  {
    statement: "A ferrugem que se forma sobre ferramentas de ferro expostas à chuva é produto de uma reação química de oxidação do metal. Essa ferrugem é formada por:",
    correct: "óxidos hidratados de ferro, resultado da ação combinada de oxigênio e água.",
    wrong: ["sulfetos de ferro produzidos por bactérias marinhas.", "hidróxido de sódio liberado pela reação com a umidade.", "ferro reduzido pela ação de ácidos fortes do ambiente.", "carbonato de ferro evaporado em alta temperatura."],
    explanation: "4Fe + 3O₂ + 2xH₂O → 2Fe₂O₃·xH₂O (oxidação eletroquímica assistida pela água).",
    subject: S_CN,
  },
  {
    statement: "O sódio (número atômico 11) possui um elétron na camada de valência. Para atingir estabilidade eletrônica, o átomo de sódio tende a:",
    correct: "perder esse elétron, formando o cátion Na⁺ com a configuração da neônio.",
    wrong: ["ganhar sete elétrons, formando o ânion Na⁷⁻.", "ganhar um elétron, formando o ânion Na⁻.", "compartilhar oito elétrons com outro átomo de sódio.", "perder onze elétrons, ficando sem nenhuma camada."],
    explanation: "Metais do grupo 1 perdem o elétron de valência e atingem configuração octetal cheia.",
    subject: S_CN,
  },
  {
    statement: "Uma pedra é solta do repouso do alto de um penhasco de 5 m de altura. Desprezando a resistência do ar e adotando g = 10 m/s², sua velocidade ao tocar o solo é de:",
    correct: "10 m/s, obtida por v = raiz de (2 · g · h).",
    wrong: ["20 m/s, valor do dobro da raiz de 2gh.", "7 m/s, cálculo pela raiz de g·h, sem o fator dois.", "5 m/s, altura usada diretamente como velocidade.", "50 m/s, valor de g·h sem extrair a raiz."],
    explanation: "v = √(2 × 10 × 5) = √100 = 10 m/s (conservação de energia).",
    subject: S_CN,
  },
  {
    statement: "Um bloco parado sobre uma mesa horizontal é puxado por uma força de 3 N, mas não se move porque o atrito estático máximo é de 4 N. A força líquida sobre o bloco é de:",
    correct: "nula, pois o atrito estático de 3 N equilibra exatamente a força aplicada.",
    wrong: ["igual à força aplicada, apontada no sentido do movimento.", "igual a 4 N, no sentido contrário ao da força aplicada.", "igual ao peso do bloco, dirigida verticalmente para baixo.", "de 7 N, resultante da soma das forças horizontais."],
    explanation: "Sem movimento, a resultante é zero: atrito estático = força aplicada (3 N).",
    subject: S_CN,
  },
  {
    statement: "Uma pedra desliza sem atrito de um degrau de 5 m de altura até o solo. Adotando g = 10 m/s², a velocidade adquirida no pé do degrau é de:",
    correct: "10 m/s, pois m·g·h converte-se integralmente em energia cinética.",
    wrong: ["20 m/s, valor correspondente ao dobro da velocidade correta.", "7 m/s, cálculo com raiz de g·h, esquecendo o fator dois.", "5 m/s, igual à altura da queda medida em metros.", "50 m/s, resultado de g·h sem a extração da raiz."],
    explanation: "mgh = ½mv² → v = √(2gh) = √(2 × 10 × 5) = 10 m/s.",
    subject: S_CN,
  },
  {
    statement: "Uma onda sonora possui frequência de 200 Hz e comprimento de onda de 1,7 m no ar. A velocidade de propagação dessa onda é de:",
    correct: "340 m/s, resultado do produto entre frequência e comprimento de onda.",
    wrong: ["170 m/s, obtida dividindo o comprimento pela frequência.", "2,7 m/s, razão invertida entre os dois parâmetros medidos.", "200 m/s, valor da frequência confundido com a velocidade.", "1,7 m/s, comprimento de onda lido diretamente como velocidade."],
    explanation: "v = f · λ = 200 × 1,7 = 340 m/s.",
    subject: S_CN,
  },
  {
    statement: "Num condutor metálico, uma carga elétrica total de 5 C atravessa a seção transversal em 10 segundos. A intensidade da corrente elétrica nesse condutor é de:",
    correct: "0,5 A, calculada pela razão entre a carga e o tempo.",
    wrong: ["2 A, razão invertida entre tempo e carga elétrica.", "50 A, produto da carga elétrica pelo tempo.", "0,05 A, divisão da carga por mil unidades de tempo.", "10 A, valor do tempo em segundos lido como corrente."],
    explanation: "I = Q/t = 5/10 = 0,5 A.",
    subject: S_CN,
  },
  {
    statement: "Quando um feixe de luz incide obliquamente da água para o ar, ele se afasta da normal. Esse desvio ocorre porque, na fronteira entre os meios:",
    correct: "a luz aumenta a velocidade no ar e refrata-se afastando-se da normal.",
    wrong: ["a luz é absorvida pela água e desaparece no ponto de incidência.", "a cor da luz se altera obrigatoriamente ao cruzar a fronteira.", "a luz acelera na água e curva-se em direção à normal.", "a luz não sofre desvio em superfícies límpidas e transparentes."],
    explanation: "Da água (n maior) para o ar (n menor), o feixe se afasta da normal (Lei de Snell).",
    subject: S_CN,
  },
  {
    statement: "Num experimento sobre efeito fotoelétrico, aumenta-se a intensidade da luz que incide sobre uma placa metálica, mantendo a frequência da radiação constante. Com isso, observa-se que:",
    correct: "mais fótons chegam ao metal, mas a energia de cada fóton permanece a mesma.",
    wrong: ["cada fóton passa a ter mais energia proporcional à intensidade.", "os elétrons emitidos passam a ter energia negativa.", "nenhum elétron é emitido com luz mais intensa.", "a frequência da luz triplica ao aumentar a lâmpada."],
    explanation: "E do fóton depende só da frequência (E = hf); a intensidade muda o número de fótons.",
    subject: S_CN,
  },
  {
    statement: "Um astronauta com massa de 72 kg na Terra viaja até a Lua, onde a gravidade é de 1,6 m/s². O peso desse astronauta na Lua é de aproximadamente:",
    correct: "115 N, pois a massa se mantém e o peso depende da gravidade local.",
    wrong: ["72 N, por confundir o valor da massa com o do peso.", "432 N, resultado de multiplicar a massa pela gravidade da Terra.", "1.152 N, valor seis vezes maior que o peso correto.", "0 N, pois a Lua não exerce força gravitacional alguma."],
    explanation: "P = m · g = 72 × 1,6 = 115,2 N.",
    subject: S_CN,
  },
  {
    statement: "Para ferver 2 kg de água a 20 °C até atingir 70 °C, considerando calor específico de 4.200 J/(kg·°C), é necessária a energia térmica de:",
    correct: "420 kJ, calculada por Q = m · c · ΔT = 2 × 4.200 × 50.",
    wrong: ["84 kJ, obtida multiplicando massa pelo calor específico apenas.", "140 kJ, razão entre massa e variação de temperatura.", "210 kJ, metade do valor correto por usar ΔT de 25 °C.", "4,2 kJ, valor do calor específico lido como energia total."],
    explanation: "Q = 2 × 4.200 × 50 = 420.000 J = 420 kJ.",
    subject: S_CN,
  },
  {
    statement: "No dogma central da biologia molecular, a informação contida no DNA flui para a síntese de proteínas por meio de duas etapas consecutivas, chamadas:",
    correct: "transcrição, no núcleo, e tradução, no ribossomo.",
    wrong: ["tradução, no núcleo, e transcrição, no ribossomo.", "replicação e transcrição, ocorrendo ambas no citosol.", "tradução e retrotranscrição, direto da proteína ao DNA.", "transcrição e transdução, do DNA ao lipídio da membrana."],
    explanation: "DNA → RNA (transcrição) → proteína (tradução).",
    subject: S_CN,
  },
  {
    statement: "Numa prensa hidráulica, a área do êmbolo menor é 20 vezes menor que a do êmbolo maior. Aplicando-se uma força no êmbolo menor, a força obtida no maior é:",
    correct: "20 vezes maior, pois a pressão se transmite igualmente por todo o fluido.",
    wrong: ["igual à força aplicada, mudando apenas a velocidade do fluido.", "20 vezes menor, dividida pela razão entre as áreas.", "a mesma, já que a pressão diminui ao aumentar a área.", "400 vezes maior, ampliada pelo quadrado da razão de áreas."],
    explanation: "Princípio de Pascal: P = F₁/A₁ = F₂/A₂ → F₂ = F₁ × (A₂/A₁) = 20 F₁.",
    subject: S_CN,
  },
  {
    statement: "Um motor elétrico de uma máquina industrial realiza 200 J de trabalho em um intervalo de 5 segundos. Considerando esse intervalo, a potência média desenvolvida pelo equipamento é de:",
    correct: "40 W, calculada pela razão entre o trabalho e o tempo.",
    wrong: ["25 W, razão invertida entre tempo e trabalho.", "1.000 W, produto do trabalho pelo tempo.", "4 W, divisão do trabalho por cem unidades de tempo.", "100 W, valor da metade do trabalho em joules."],
    explanation: "P = W/t = 200/5 = 40 W.",
    subject: S_CN,
  },
];
// ---- ENEM 2026 · Matemática e suas Tecnologias (25 itens) ----
const ITEMS_2026_MT: EnemItem[] = [
  {
    statement: "Um tênis custa R$ 250,00 e está com 20% de desconto promocional. Um cupom de mais 10% de desconto pode ser aplicado sobre o valor já reduzido. O preço final do tênis é de:",
    correct: "R$ 180,00, pois cada desconto incide sobre o valor já corrigido: 250 × 0,8 × 0,9.",
    wrong: ["R$ 175,00, soma direta dos dois percentuais (20% + 10%).", "R$ 225,00, consideração apenas do cupom de 10% sobre o preço cheio.", "R$ 150,00, aplicação de desconto total de 40% ao valor inicial.", "R$ 205,00, diferença de R$ 45,00 sobre o preço promocional."],
    explanation: "250 × 0,8 = 200; 200 × 0,9 = 180. Descontos sucessivos não se somam.",
    subject: S_MT,
  },
  {
    statement: "Uma cidade tinha 40 mil habitantes e, após um censo, passou a ter 48 mil. O aumento percentual da população nesse período foi de:",
    correct: "20%, calculado pelo aumento de 8 mil sobre a base inicial de 40 mil.",
    wrong: ["8%, diferença absoluta dividida por mil habitantes.", "16,7%, razão calculada com a população final como base.", "25%, aumento de 8 mil sobre a base de 32 mil.", "10%, arredondamento do aumento para a dezena mais próxima."],
    explanation: "(48 − 40)/40 × 100% = 8/40 = 20%.",
    subject: S_MT,
  },
  {
    statement: "Uma aplicação de R$ 1.000,00 rende juros compostos de 10% ao mês. Após dois meses completos, o montante dessa aplicação será de:",
    correct: "R$ 1.210,00, calculado por 1.000 × 1,10².",
    wrong: ["R$ 1.200,00, montante obtido com juros simples dos dois meses.", "R$ 1.100,00, valor correspondente a apenas um mês de rendimento.", "R$ 1.010,00, juro de 10% aplicado sobre os juros do primeiro mês.", "R$ 1.331,00, montante de três meses de aplicação."],
    explanation: "1.000 × 1,10 = 1.100; 1.100 × 1,10 = 1.210.",
    subject: S_MT,
  },
  {
    statement: "Numa feira do bairro, 3 kg de batata custam R$ 9,00. Mantido exatamente o mesmo preço por quilo durante toda a semana, quanto custarão 7 kg de batata?",
    correct: "R$ 21,00, pois o quilo custa R$ 3,00 e 3 × 7 = 21.",
    wrong: ["R$ 63,00, multiplicação direta do preço total pelo número de quilos.", "R$ 18,00, soma de 3 e 7 quilos somada ao preço da batata.", "R$ 27,00, preço por quilo multiplicado novamente por três.", "R$ 12,00, acréscimo de R$ 12,00 sobre o preço original."],
    explanation: "Proporção: 3 kg → R$ 9, logo 1 kg → R$ 3 e 7 kg → R$ 21.",
    subject: S_MT,
  },
  {
    statement: "Pedro dirigiu 540 km em 4 horas e depois fez uma parada de 2 horas. Considerando todo o período desde a partida, sua velocidade média foi de:",
    correct: "90 km/h, pois a distância total foi percorrida em 6 horas.",
    wrong: ["135 km/h, média calculada apenas no tempo de direção.", "108 km/h, média considerando cinco horas de percurso.", "270 km/h, distância dividida pelas duas horas de parada.", "180 km/h, distância dividida por três horas de viagem."],
    explanation: "v média = 540/(4 + 2) = 540/6 = 90 km/h.",
    subject: S_MT,
  },
  {
    statement: "O frete de uma encomenda é composto por taxa fixa de R$ 5,00 mais R$ 2,00 por quilo. O valor total do frete de um pacote de 12 kg é de:",
    correct: "R$ 29,00, calculado por 5 + (2 × 12).",
    wrong: ["R$ 24,00, apenas a taxa variável de R$ 2,00 por quilo.", "R$ 84,00, multiplicação dos quilos pela soma das duas taxas.", "R$ 22,00, inversão das taxas na conta de multiplicação.", "R$ 17,00, soma da taxa fixa com os quilos, sem a taxa variável."],
    explanation: "f(x) = 2x + 5; f(12) = 24 + 5 = 29.",
    subject: S_MT,
  },
  {
    statement: "Uma horta retangular do quintal da escola tem comprimento de (x + 3) metros e largura de x metros. Para x = 5, a área dessa horta é de:",
    correct: "40 m², pois as dimensões são 8 m por 5 m.",
    wrong: ["35 m², produto da largura pelo comprimento sem somar a constante.", "45 m², área calculada com comprimento de 9 m.", "25 m², valor apenas da largura elevada ao quadrado.", "15 m², produto da largura pela constante do comprimento."],
    explanation: "A = x(x + 3) = 5 × 8 = 40 m².",
    subject: S_MT,
  },
  {
    statement: "Um projétil desenhado no plano cartesiano segue a função quadrática y = x² − 6x + 5, cujo gráfico é uma parábola. O eixo de simetria dessa parábola é a reta de equação:",
    correct: "x = 3, obtida por x = −b/(2a) = 6/2.",
    wrong: ["x = 6, valor de −b sem dividir por 2a.", "x = 5, igual ao termo independente da função.", "x = −3, inversão do sinal do resultado correto.", "x = 1,5, divisão extra por dois do resultado."],
    explanation: "eixo de simetria: x = −(−6)/(2 × 1) = 3.",
    subject: S_MT,
  },
  {
    statement: "Uma bandeira triangular de escola, em formato de triângulo retângulo, tem catetas medindo 9 m e 12 m. A área dessa bandeira, em metros quadrados, é de:",
    correct: "54 m², calculada por (base × altura) ÷ 2 = (9 × 12) ÷ 2.",
    wrong: ["108 m², produto das catetas sem dividir por dois.", "10,5 m², metade da soma das duas catetas.", "21 m², soma direta das catetas do triângulo.", "81 m², quadrado da cateta menor."],
    explanation: "A = (9 × 12)/2 = 108/2 = 54 m².",
    subject: S_MT,
  },
  {
    statement: "Uma roda de bicicleta tem diâmetro de 70 cm. A distância percorrida a cada volta completa da roda, considerando π ≈ 3,14, é de aproximadamente:",
    correct: "2,2 m, pois o perímetro vale π vezes o diâmetro (2,20 m).",
    wrong: ["1,1 m, perímetro calculado com o raio da roda.", "0,7 m, valor do diâmetro lido como distância percorrida.", "4,4 m, dobro do perímetro correto da roda.", "7,0 m, diâmetro multiplicado por dez."],
    explanation: "C = π · d = 3,14 × 0,70 ≈ 2,2 m.",
    subject: S_MT,
  },
  {
    statement: "Um drone parte de um ponto e voa 12 m para leste e, em seguida, 5 m para norte, retornando em linha reta à origem. O comprimento desse retorno, em metros, é de:",
    correct: "13 m, hipotenusa do triângulo retângulo formado (raiz de 144 + 25).",
    wrong: ["17 m, soma das duas distâncias percorridas.", "7 m, diferença entre as duas distâncias voadas.", "60 m, produto das duas distâncias percorridas.", "8,5 m, média aritmética das duas distâncias."],
    explanation: "d = √(12² + 5²) = √169 = 13 m (terna 5-12-13).",
    subject: S_MT,
  },
  {
    statement: "Uma pirâmide de papelão, usada em um projeto de matemática, tem base quadrada de lado 6 cm e altura de 9 cm. O volume dessa peça é de:",
    correct: "108 cm³, calculado por (área da base × altura) ÷ 3.",
    wrong: ["324 cm³, produto da área da base pela altura, sem dividir por três.", "162 cm³, metade do produto entre base e altura.", "54 cm³, volume dividido por seis por engano na fórmula.", "216 cm³, dobro do volume correto da pirâmide."],
    explanation: "V = (6² × 9)/3 = 324/3 = 108 cm³.",
    subject: S_MT,
  },
  {
    statement: "Uma caixa retangular de presente mede 3 dm, 4 dm e 12 dm em suas três dimensões. A distância entre dois vértices opostos da caixa, em decímetros, é de:",
    correct: "13 dm, raiz da soma dos quadrados das três dimensões (9 + 16 + 144).",
    wrong: ["19 dm, soma direta das três dimensões da caixa.", "4,4 dm, raiz da soma das dimensões, sem elevá-las ao quadrado.", "26 dm, dobro da soma das duas maiores dimensões.", "7 dm, apenas a soma das duas menores dimensões."],
    explanation: "d = √(3² + 4² + 12²) = √(9 + 16 + 144) = √169 = 13 dm.",
    subject: S_MT,
  },
  {
    statement: "Uma carta é retirada de um baralho francês de 52 cartas embaralhadas. A probabilidade de essa carta NÃO ser um rei é de:",
    correct: "12/13, pois há 48 cartas que não são reis entre as 52.",
    wrong: ["1/13, fração de sair exatamente um rei.", "1/4, fração das cartas de um naipe sobre o total.", "4/13, razão entre o número de reis e o número de naipes.", "12/52, fração das cartas de ouro sobre o baralho."],
    explanation: "Não-reis = 52 − 4 = 48; 48/52 = 12/13.",
    subject: S_MT,
  },
  {
    statement: "Uma urna contém 5 bolas azuis e 3 bolas vermelhas, todas idênticas em tamanho e peso. Sorteando uma bola ao acaso, a probabilidade de sair uma bola azul é de:",
    correct: "5/8, pois há cinco bolas azuis entre as oito da urna.",
    wrong: ["3/8, fração das bolas vermelhas na urna.", "1/2, metade das bolas considerando apenas as cores.", "8/5, razão invertida entre total e bolas azuis.", "5/3, razão entre bolas azuis e vermelhas."],
    explanation: "P(azul) = 5/(5 + 3) = 5/8.",
    subject: S_MT,
  },
  {
    statement: "Um sistema de segurança gera senhas de três dígitos, admitindo repetição dos algarismos de 0 a 9. O total de senhas diferentes que podem ser geradas é de:",
    correct: "1.000 senhas, resultado de 10 × 10 × 10.",
    wrong: ["720 senhas, permutação de dez dígitos sem repetição.", "30 senhas, soma dos algarismos considerando as três posições.", "100 senhas, apenas as combinações de dois dígitos mais um.", "10 senhas, escolha apenas do primeiro dígito."],
    explanation: "Com repetição: 10³ = 1.000 combinações.",
    subject: S_MT,
  },
  {
    statement: "Numa amostra de apenas quatro estudantes, as idades registradas, já ordenadas de forma crescente, são 2, 4, 6 e 10 anos. A mediana desse conjunto é igual a:",
    correct: "5, média aritmética dos dois valores centrais (4 e 6).",
    wrong: ["4, valor do segundo termo do conjunto ordenado.", "6, valor do terceiro termo do conjunto ordenado.", "5,5, média aritmética dos quatro valores do conjunto.", "3, média entre os dois primeiros termos da série."],
    explanation: "Com número par de elementos, mediana = (4 + 6)/2 = 5.",
    subject: S_MT,
  },
  {
    statement: "Dois conjuntos de dados de uma mesma pesquisa são apresentados: {2, 5, 8} e {4, 5, 6}. Ao comparar a variabilidade entre eles, conclui-se que:",
    correct: "{2, 5, 8} é mais disperso, pois seus valores se afastam mais da média comum (5).",
    wrong: ["{4, 5, 6} é mais disperso, pois possui a maior média aritmética.", "ambos apresentam a mesma variabilidade, por terem três elementos.", "{4, 5, 6} é mais disperso, pois sua amplitude é maior.", "{2, 5, 8} é mais disperso apenas se sua média for nula."],
    explanation: "Ambos têm média 5, mas as amplitudes são 6 e 2 — o primeiro é mais variável.",
    subject: S_MT,
  },
  {
    statement: "Numa pesquisa com quatro opções, os votos foram: opção A: 12; opção B: 7; opção C: 15; opção D: 6. A moda dessa pesquisa é:",
    correct: "a opção C, pois concentra o maior número de votos (15).",
    wrong: ["a opção A, por ser a primeira da lista de escolhas.", "a opção B, por ocupar a segunda posição da tabela.", "a opção D, por apresentar o menor número de votos.", "a média entre as opções A e C, por serem as mais votadas."],
    explanation: "Moda é o valor mais frequente: opção C, com 15 votos.",
    subject: S_MT,
  },
  {
    statement: "O preço de quatro produtos subiu assim: arroz de R$ 10,00 para R$ 12,00; feijão de R$ 8,00 para R$ 9,00; óleo de R$ 6,00 para R$ 7,50; açúcar de R$ 4,00 para R$ 4,40. O maior aumento percentual foi o do:",
    correct: "óleo, com alta de 25% sobre o preço anterior.",
    wrong: ["arroz, com alta de 20% sobre o preço anterior.", "feijão, com alta de 12,5% sobre o preço anterior.", "açúcar, com alta de 10% sobre o preço anterior.", "arroz, por terminar com o maior preço final entre os quatro."],
    explanation: "7,5/6 = 1,25 → 25%, maior que os demais aumentos.",
    subject: S_MT,
  },
  {
    statement: "Uma rampa de acesso sustentável sobe 1,5 m de altura a cada 10 m de extensão horizontal. A tangente do ângulo de inclinação dessa rampa é igual a:",
    correct: "0,15, razão entre a altura oposta e a base adjacente.",
    wrong: ["0,10, razão entre a base e a altura oposta.", "6,7, razão invertida entre base e altura.", "1,5, altura usada diretamente como razão.", "0,3, valor da inclinação dobrado por engano."],
    explanation: "tg θ = oposta/adjacente = 1,5/10 = 0,15.",
    subject: S_MT,
  },
  {
    statement: "Num triângulo retângulo, a hipotenusa mede 10 cm e a cateta adjacente a um ângulo agudo mede 8 cm. O cosseno desse ângulo é igual a:",
    correct: "0,8, pois o cosseno é a razão entre a cateta adjacente e a hipotenusa.",
    wrong: ["0,6, razão da cateta oposta (6 cm) com a hipotenusa.", "1,25, razão invertida entre hipotenusa e cateta adjacente.", "1,67, razão entre hipotenusa e cateta oposta.", "0,36, quadrado da razão correta do ângulo."],
    explanation: "cos θ = adjacente/hipotenusa = 8/10 = 0,8 (triângulo 6-8-10).",
    subject: S_MT,
  },
  {
    statement: "Um sistema de duas equações é montado para resolver um quebra-cabeça: x + y = 10 e x − y = 4. O valor de x nesse sistema é:",
    correct: "7, obtido somando as duas equações: 2x = 14.",
    wrong: ["3, valor encontrado para a segunda incógnita.", "5, metade da soma das duas incógnitas.", "14, soma das duas equações sem dividir por dois.", "6, resultado da subtração de 4 em 10."],
    explanation: "Somando: 2x = 14 → x = 7; logo y = 3.",
    subject: S_MT,
  },
  {
    statement: "Para resolver um exercício de álgebra, um estudante substitui a = 4 e b = 3 na expressão algébrica (a + b)². O valor dessa expressão, com os dados informados, é igual a:",
    correct: "49, pois (4 + 3)² = 7² = 49.",
    wrong: ["25, quadrados de a e b somados, sem o dobro do produto.", "14, dobro da soma dos dois valores.", "7, soma simples dos dois valores, sem elevar ao quadrado.", "37, quadrados somados ao produto simples de a e b."],
    explanation: "(a + b)² = a² + 2ab + b² = 16 + 24 + 9 = 49.",
    subject: S_MT,
  },
  {
    statement: "Um funcionário recebia R$ 2.400,00 e passou a ganhar R$ 2.760,00 após reajuste. O percentual de aumento do salário foi de:",
    correct: "15%, calculado pela diferença de R$ 360,00 sobre a base de R$ 2.400,00.",
    wrong: ["13%, razão calculada sobre o salário final recebido.", "36%, valor do aumento em reais lido como percentual.", "12%, aumento dividido por uma base de três mil.", "20%, arredondamento do aumento para o percentual cheio."],
    explanation: "(2.760 − 2.400)/2.400 = 360/2.400 = 15%.",
    subject: S_MT,
  },
];
/** Bancos de itens dos 3 exames completos, por ano e por área. */
const ENEM_ITEMS: Record<EnemYear, Record<EnemAreaCode, EnemItem[]>> = {
  2024: { LC: ITEMS_2024_LC, CH: ITEMS_2024_CH, CN: ITEMS_2024_CN, MT: ITEMS_2024_MT },
  2025: { LC: ITEMS_2025_LC, CH: ITEMS_2025_CH, CN: ITEMS_2025_CN, MT: ITEMS_2025_MT },
  2026: { LC: ITEMS_2026_LC, CH: ITEMS_2026_CH, CN: ITEMS_2026_CN, MT: ITEMS_2026_MT },
};

const ALT_LABELS = ["A", "B", "C", "D", "E"] as const;
const MIN_STATEMENT_LENGTH = 120;
const ITEMS_PER_AREA = 25;
const ITEMS_PER_EXAM = 100;
const EXAMS_COUNT = 3;
const LETTER_MIN_RATIO = 0.1;
const LETTER_MAX_RATIO = 0.4;
const WRONG_MAX_REPEAT_RATIO = 0.05;

/** Remove o rótulo "A) …" de uma alternativa para comparação de conteúdo. */
function stripAlternativeLabel(text: string): string {
  return text.replace(/^[A-Ea-e][).]\s*/, "").trim();
}

/** Normaliza o corpo de uma alternativa (sem rótulo, caixa e espaços extras). */
function normalizeChoice(text: string): string {
  return stripAlternativeLabel(text).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Normaliza um enunciado para comparação entre anos: remove o ano do ENEM
 * (2024/2025/2026), acentos, caixa, pontuação e espaços duplicados — assim
 * "mesmo enunciado trocando o ano" é detectado como duplicata.
 */
function normalizeStatement(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/\b(2024|2025|2026)\b/g, "AAAA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** PRNG determinístico (mulberry32) — mesma sequência em qualquer execução. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Índice (0=A … 4=E) da alternativa correta de cada uma das 300 questões.
 * Embaralhamento determinístico com exatamente 60 ocorrências de cada letra
 * (20% do total — dentro da faixa 10%–40%) e sem ciclo fixo de rotação.
 */
const CORRECT_SLOTS: readonly number[] = (() => {
  const slots: number[] = [];
  for (let slot = 0; slot < ALT_LABELS.length; slot++) {
    for (let i = 0; i < 60; i++) slots.push(slot);
  }
  const rand = mulberry32(0xe3e32026);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = slots[i];
    slots[i] = slots[j];
    slots[j] = tmp;
  }
  return slots;
})();

/** Monta uma questão objetiva validando o item (fail-fast). */
function buildItemQuestion(item: EnemItem, globalIndex: number): SeedMcQuestion {
  const context = `item global #${globalIndex + 1}`;
  const statement = item.statement.trim();
  if (statement.length < MIN_STATEMENT_LENGTH) {
    throw new Error(`${context}: enunciado com ${statement.length} caracteres (mínimo ${MIN_STATEMENT_LENGTH}).`);
  }
  if (item.wrong.length !== 4) {
    throw new Error(`${context}: esperados 4 distratores, obtidos ${item.wrong.length}.`);
  }
  if (!item.explanation.trim()) {
    throw new Error(`${context}: explicação vazia.`);
  }

  const correctSlot = CORRECT_SLOTS[globalIndex];
  let wrongIndex = 0;
  const bodies = ALT_LABELS.map((_label, idx) =>
    idx === correctSlot ? item.correct.trim() : item.wrong[wrongIndex++].trim(),
  );

  const normalized = bodies.map((body) => normalizeChoice(body));
  if (new Set(normalized).size !== ALT_LABELS.length) {
    const duplicated = normalized.find((body, idx) => normalized.indexOf(body) !== idx);
    throw new Error(`${context}: alternativas duplicadas — "${duplicated}".`);
  }

  const alternatives: SeedAlternative[] = bodies.map((body, idx) => ({
    text: `${ALT_LABELS[idx]}) ${body}`,
    isCorrect: idx === correctSlot,
  }));
  const correctCount = alternatives.filter((alt) => alt.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error(`${context}: esperada exatamente 1 alternativa correta, obtidas ${correctCount}.`);
  }

  return {
    type: "MULTIPLE_CHOICE",
    statement,
    alternatives,
    subject: item.subject,
    explanation: item.explanation,
    difficulty: 1 + (globalIndex % 3),
  };
}

function buildAreaQuestions(area: EnemArea, year: EnemYear): SeedMcQuestion[] {
  const items = ENEM_ITEMS[year][area.code as EnemAreaCode];
  if (!items || items.length !== ITEMS_PER_AREA) {
    throw new Error(
      `Banco ENEM ${year}/${area.code} com ${items?.length ?? 0} itens (esperado ${ITEMS_PER_AREA}).`,
    );
  }
  const areaIndex = ENEM_AREAS.indexOf(area);
  return items.map((item, index) => {
    if (item.subject !== area.name) {
      throw new Error(
        `Item ${year}/${area.code} #${index + 1}: subject "${item.subject}" difere da área "${area.name}".`,
      );
    }
    const globalIndex = (year - 2024) * ITEMS_PER_EXAM + areaIndex * ITEMS_PER_AREA + index;
    return buildItemQuestion(item, globalIndex);
  });
}

function buildRedacaoQuestion(year: number): SeedEssayQuestion {
  const theme = REDACAO_THEMES[year];
  return {
    type: "ESSAY",
    statement: [
      "REDACAO — Proposta de Redação do ENEM",
      `Tema: "${theme.tema}"`,
      theme.orientacao,
      "A redação deve ter no mínimo 7 linhas e no máximo 30 linhas.",
    ].join("\n\n"),
    expectedAnswer: theme.tema,
  };
}

function isEnemYear(year: number): year is EnemYear {
  return year === 2024 || year === 2025 || year === 2026;
}

/** Valida a estrutura de um exame completo (101 questões, ordem das áreas, asserts por questão). */
function validateEnemExamShape(exam: SeedFullEnemExam): void {
  const label = exam.slug;
  const mc = exam.questions.filter(
    (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
  );
  const essays = exam.questions.filter((question) => question.type === "ESSAY");

  if (exam.questions.length !== ITEMS_PER_EXAM + 1) {
    throw new Error(`${label}: esperadas ${ITEMS_PER_EXAM + 1} questões, obtidas ${exam.questions.length}.`);
  }
  if (mc.length !== ITEMS_PER_EXAM) {
    throw new Error(`${label}: esperadas ${ITEMS_PER_EXAM} questões objetivas, obtidas ${mc.length}.`);
  }
  if (essays.length !== 1) {
    throw new Error(`${label}: esperada 1 questão dissertativa, obtidas ${essays.length}.`);
  }
  const last = exam.questions[exam.questions.length - 1];
  if (!last || last.type !== "ESSAY") {
    throw new Error(`${label}: a redação deve ser a última questão (posição 101).`);
  }

  ENEM_AREAS.forEach((area, areaIndex) => {
    for (let i = 0; i < ITEMS_PER_AREA; i++) {
      const question = mc[areaIndex * ITEMS_PER_AREA + i];
      if (question.subject !== area.name) {
        throw new Error(
          `${label}: posição ${areaIndex * ITEMS_PER_AREA + i + 1} deveria ser "${area.name}" e é "${question.subject}".`,
        );
      }
    }
  });

  for (const [index, question] of mc.entries()) {
    const context = `${label} · questão ${index + 1}`;
    if (question.statement.trim().length < MIN_STATEMENT_LENGTH) {
      throw new Error(`${context}: enunciado com menos de ${MIN_STATEMENT_LENGTH} caracteres.`);
    }
    if (question.alternatives.length !== 5) {
      throw new Error(`${context}: esperadas 5 alternativas, obtidas ${question.alternatives.length}.`);
    }
    const normalized = question.alternatives.map((alt) => normalizeChoice(alt.text));
    if (new Set(normalized).size !== 5) {
      const duplicated = normalized.find((body, idx) => normalized.indexOf(body) !== idx);
      throw new Error(`${context}: alternativas duplicadas — "${duplicated}".`);
    }
    const correctCount = question.alternatives.filter((alt) => alt.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`${context}: esperada exatamente 1 alternativa correta, obtidas ${correctCount}.`);
    }
  }
}

/**
 * Validações globais dos 3 exames: 300 objetivas únicas (dentro e entre anos,
 * comparando enunciado sem o ano), distribuição da correta em A–E (10%–40%)
 * e ausência de distrator repetido em mais de 5% (indício de pool global).
 */
function validateFullEnemExams(exams: SeedFullEnemExam[]): void {
  if (exams.length !== EXAMS_COUNT) {
    throw new Error(`Esperados ${EXAMS_COUNT} exames completos, obtidos ${exams.length}.`);
  }

  const seenStatements = new Map<string, string>();
  const letterCounts = [0, 0, 0, 0, 0];
  const wrongCounts = new Map<string, number>();
  let totalMc = 0;

  for (const exam of exams) {
    validateEnemExamShape(exam);
    const mc = exam.questions.filter(
      (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
    );
    for (const [index, question] of mc.entries()) {
      totalMc++;
      const key = normalizeStatement(question.statement);
      const previous = seenStatements.get(key);
      if (previous) {
        throw new Error(
          `Enunciado repetido entre exames (ignorando ano): "${previous}" e "${exam.slug}" questão ${index + 1}.`,
        );
      }
      seenStatements.set(key, `${exam.slug} questão ${index + 1}`);

      const correctIndex = question.alternatives.findIndex((alt) => alt.isCorrect);
      letterCounts[correctIndex]++;

      for (const alt of question.alternatives) {
        if (alt.isCorrect) continue;
        const choice = normalizeChoice(alt.text);
        wrongCounts.set(choice, (wrongCounts.get(choice) ?? 0) + 1);
      }
    }
  }

  if (totalMc !== ITEMS_PER_EXAM * EXAMS_COUNT) {
    throw new Error(`Esperadas ${ITEMS_PER_EXAM * EXAMS_COUNT} objetivas no total, obtidas ${totalMc}.`);
  }

  const minLetter = Math.ceil(LETTER_MIN_RATIO * totalMc);
  const maxLetter = Math.floor(LETTER_MAX_RATIO * totalMc);
  letterCounts.forEach((count, index) => {
    if (count < minLetter || count > maxLetter) {
      throw new Error(
        `Alternativa ${ALT_LABELS[index]} concentra ${count} gabaritos de ${totalMc} (faixa permitida ${minLetter}–${maxLetter}).`,
      );
    }
  });

  const totalWrong = totalMc * 4;
  const maxRepeat = Math.floor(WRONG_MAX_REPEAT_RATIO * totalWrong);
  for (const [choice, count] of wrongCounts) {
    if (count > maxRepeat) {
      throw new Error(
        `Distrator repetido ${count}× de ${totalWrong} (máximo ${maxRepeat}): "${choice}" — possível pool global de alternativas.`,
      );
    }
  }
}

export function buildFullEnemExam(year: number): SeedFullEnemExam {
  const redacao = REDACAO_THEMES[year];
  if (!redacao) {
    throw new Error(`Ano ENEM não suportado no seed: ${year}`);
  }
  if (!isEnemYear(year)) {
    throw new Error(`Banco de itens ENEM ausente para o ano: ${year}`);
  }

  const mcQuestions = ENEM_AREAS.flatMap((area) => buildAreaQuestions(area, year));

  const exam: SeedFullEnemExam = {
    title: `ENEM ${year} — Prova Completa (100 questões + Redação)`,
    slug: `enem-${year}-prova-completa`,
    description: [
      `Simulado completo no formato ENEM ${year} para testes da plataforma.`,
      "100 questões objetivas distribuídas em Linguagens (1-25), Humanas (26-50),",
      "Natureza (51-75) e Matemática (76-100), seguidas da Redação (questão 101).",
      "Questões fictícias no estilo ENEM — não são o conteúdo oficial do INEP.",
    ].join(" "),
    examType: "ENEM",
    timeLimit: 330,
    questions: [...mcQuestions, buildRedacaoQuestion(year)],
  };

  validateEnemExamShape(exam);
  return exam;
}

/** Simulados ENEM completos disponíveis no seed */
export const FULL_ENEM_EXAMS: SeedFullEnemExam[] = [
  buildFullEnemExam(2026),
  buildFullEnemExam(2025),
  buildFullEnemExam(2024),
];

validateFullEnemExams(FULL_ENEM_EXAMS);
function mcQuestion(
  statement: string,
  correct: string,
  distractors: string[],
  subject: string,
  explanation: string,
  index: number,
): SeedMcQuestion {
  const choices = [correct, ...distractors];
  const answerIndex = index % choices.length;
  const rotated = choices.map((_, i) => choices[(i - answerIndex + choices.length) % choices.length]);
  return {
    type: "MULTIPLE_CHOICE",
    statement,
    subject,
    explanation,
    difficulty: 1 + (index % 3),
    alternatives: rotated.map((text, i) => ({
      text: `${String.fromCharCode(65 + i)}) ${text}`,
      isCorrect: i === answerIndex,
    })),
  };
}

const MATH_SCENARIOS = [
  ["uma escola", 120, 15], ["uma biblioteca", 240, 20], ["um clube", 360, 25],
  ["uma cooperativa", 480, 10], ["um laboratório", 600, 30], ["uma feira", 800, 5],
  ["um projeto", 900, 40], ["uma turma", 1_200, 35], ["uma campanha", 1_500, 12],
  ["uma associação", 2_000, 18],
] as const;

function buildMathQuestions(): SeedMcQuestion[] {
  const questions: SeedMcQuestion[] = [];
  const subject = "Matemática";
  for (const [place, base, percent] of MATH_SCENARIOS) {
    const result = base * percent / 100;
    questions.push(mcQuestion(`${place} tem ${base} participantes. ${percent}% deles participam de um clube de ciências. Quantas pessoas participam do clube?`, String(result), [String(result + percent), String(base - result), String(base / percent)], subject, `${percent}% de ${base} é ${base} × ${percent}/100 = ${result}.`, questions.length));
  }
  for (const [place, price, percent] of [["livraria", 80, 10], ["papelaria", 120, 25], ["loja", 200, 15], ["mercado", 240, 20], ["feira", 360, 5], ["farmácia", 400, 30], ["brechó", 500, 12], ["oficina", 600, 35], ["curso", 800, 40], ["museu", 1_000, 18]] as const) {
    const finalPrice = price * (100 - percent) / 100;
    questions.push(mcQuestion(`Um ingresso de R$ ${price} em uma ${place} recebe desconto de ${percent}%. Qual é o preço após o desconto?`, `R$ ${finalPrice}`, [`R$ ${price * percent / 100}`, `R$ ${price - percent}`, `R$ ${price + price * percent / 100}`], subject, `O desconto é ${price} × ${percent}/100. Subtraindo-o do preço inicial, o valor final é R$ ${finalPrice}.`, questions.length));
  }
  const proportion = [[3, 5, 20], [4, 7, 28], [6, 4, 18], [5, 8, 24], [2, 9, 45], [7, 3, 21], [8, 5, 25], [9, 4, 12], [10, 6, 30], [12, 5, 15]] as const;
  for (const [a, b, multiplier] of proportion) {
    const result = b * multiplier / a;
    questions.push(mcQuestion(`Uma receita usa ${a} xícaras de farinha para ${multiplier} porções. Mantida a proporção, quantas xícaras são necessárias para ${b} porções?`, String(result), [String(result + a), String(multiplier - b), String(a * b)], subject, `A razão é ${a}/${multiplier}. Para ${b} porções: ${a} × ${b}/${multiplier} = ${result} xícaras.`, questions.length));
  }
  for (const [coefficient, constant, solution] of [[2, 3, 5], [3, 4, 6], [4, 2, 7], [5, 5, 8], [6, 3, 9], [7, 6, 10], [8, 4, 11], [9, 7, 12], [10, 5, 13], [12, 6, 14]] as const) {
    const rhs = coefficient * solution + constant;
    questions.push(mcQuestion(`Resolva a equação ${coefficient}x + ${constant} = ${rhs}.`, String(solution), [String(solution + 1), String(rhs - constant), String((rhs + constant) / coefficient)], subject, `Subtraindo ${constant} dos dois lados e dividindo por ${coefficient}, obtemos x = ${solution}.`, questions.length));
  }
  for (const [width, height] of [[4, 7], [5, 9], [6, 8], [7, 12], [8, 11], [9, 13], [10, 14], [12, 15], [14, 16], [15, 18]] as const) {
    const area = width * height;
    questions.push(mcQuestion(`Um terreno retangular mede ${width} m por ${height} m. Qual é sua área?`, `${area} m²`, [`${2 * (width + height)} m²`, `${area / 2} m²`, `${width + height} m²`], subject, `A área do retângulo é base × altura: ${width} × ${height} = ${area} m².`, questions.length));
  }
  for (const [base, height] of [[6, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 18], [18, 20], [20, 22], [22, 24], [24, 26]] as const) {
    const area = base * height / 2;
    questions.push(mcQuestion(`Uma placa triangular tem base de ${base} cm e altura de ${height} cm. Qual é sua área?`, `${area} cm²`, [`${base * height} cm²`, `${base + height} cm²`, `${area + base} cm²`], subject, `A área do triângulo é (base × altura)/2 = (${base} × ${height})/2 = ${area} cm².`, questions.length));
  }
  for (let i = 1; i <= 10; i++) {
    const values = [i * 2, i * 3, i * 4, i * 5];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    questions.push(mcQuestion(`As notas de uma estudante foram ${values.join(", ")}. Qual foi a média aritmética?`, String(mean), [String(mean - 1), String(mean + 2), String(values[3] - values[0])], subject, `Somamos as quatro notas (${values.reduce((a, b) => a + b, 0)}) e dividimos por 4; a média é ${mean}.`, questions.length));
  }
  for (const [favorable, total] of [[1, 2], [1, 4], [3, 10], [2, 5], [7, 10], [3, 4], [5, 20], [9, 20], [11, 20], [13, 20]] as const) {
    const probability = favorable / total * 100;
    questions.push(mcQuestion(`Em um sorteio justo com ${total} resultados igualmente prováveis, ${favorable} resultado(s) são favoráveis a Ana. Qual é a probabilidade de ela ganhar?`, `${probability}%`, [`${favorable + total}%`, `${100 - probability}%`, `${(favorable / total).toFixed(2)}%`], subject, `A probabilidade é favoráveis/possíveis: ${favorable}/${total} = ${probability}%.`, questions.length));
  }
  for (const [capital, rate, months] of [[500, 2, 3], [800, 1, 5], [1_000, 3, 4], [1_200, 2, 6], [1_500, 4, 2], [2_000, 1, 8], [2_500, 2, 5], [3_000, 3, 3], [4_000, 1, 9], [5_000, 2, 7]] as const) {
    const interest = capital * rate / 100 * months;
    questions.push(mcQuestion(`Um capital de R$ ${capital} rende juros simples de ${rate}% ao mês durante ${months} meses. Qual é o juro total?`, `R$ ${interest}`, [`R$ ${capital * rate / 100}`, `R$ ${capital + interest}`, `R$ ${interest * months}`], subject, `Nos juros simples, J = C × i × t = ${capital} × ${rate}/100 × ${months} = R$ ${interest}.`, questions.length));
  }
  for (const [length, width, height] of [[2, 3, 4], [3, 4, 5], [4, 5, 6], [5, 6, 7], [2, 8, 3], [4, 4, 5], [6, 3, 4], [7, 2, 5], [8, 3, 2], [10, 2, 3]] as const) {
    const volume = length * width * height;
    questions.push(mcQuestion(`Uma caixa retangular mede ${length} dm × ${width} dm × ${height} dm. Qual é o volume?`, `${volume} dm³`, [`${2 * (length * width + length * height + width * height)} dm³`, `${length + width + height} dm³`, `${volume / 2} dm³`], subject, `O volume do paralelepípedo é comprimento × largura × altura = ${length} × ${width} × ${height} = ${volume} dm³.`, questions.length));
  }
  return questions;
}

const PORTUGUESE_ITEMS: Array<{ statement: string; correct: string; wrong: string[]; explanation: string; subject: string }> = [
  { statement: "Assinale a frase com concordância verbal correta.", correct: "Faz dois anos que a biblioteca foi reformada.", wrong: ["Fazem dois anos que a biblioteca foi reformada.", "Houveram mudanças na biblioteca.", "Existe muitos livros novos."], explanation: "O verbo fazer indicando tempo decorrido é impessoal e fica no singular.", subject: "Concordância" },
  { statement: "Assinale a frase com concordância nominal correta.", correct: "As pesquisadoras estavam bastante atentas.", wrong: ["As pesquisadoras estavam bastantes atentas.", "As pesquisadoras estavam bastante atenta.", "As pesquisadoras estavam bastantes atenta."], explanation: "Como advérbio de intensidade, bastante é invariável; atentas concorda com pesquisadoras.", subject: "Concordância" },
  { statement: "Qual alternativa apresenta uso correto da crase?", correct: "A equipe voltou à escola depois do almoço.", wrong: ["A equipe voltou à pé depois do almoço.", "A equipe entregou o relatório à ele.", "A equipe começou à estudar cedo."], explanation: "O verbo voltar rege a preposição a e escola admite artigo feminino: a + a = à.", subject: "Crase" },
  { statement: "Assinale a frase em que a regência está de acordo com a norma-padrão.", correct: "A turma assistiu ao debate sobre educação.", wrong: ["A turma assistiu o debate sobre educação.", "Os alunos preferem mais leitura do que vídeo.", "Ela chegou no auditório às oito horas."], explanation: "No sentido de ver, assistir rege a preposição a: assistir ao debate.", subject: "Regência" },
  { statement: "Em qual frase a colocação pronominal está adequada à norma-padrão formal?", correct: "Nunca se explicou o motivo da mudança.", wrong: ["Nunca explicou-se o motivo da mudança.", "Me entregaram o certificado ontem.", "Não disseram-me a resposta."], explanation: "O advérbio negativo nunca atrai o pronome para antes do verbo (próclise).", subject: "Colocação pronominal" },
  { statement: "Qual alternativa está pontuada corretamente?", correct: "Ao terminar a leitura, os estudantes discutiram o texto.", wrong: ["Ao terminar, a leitura os estudantes discutiram o texto.", "Ao terminar a leitura os estudantes, discutiram o texto.", "Ao terminar a leitura, os estudantes, discutiram o texto."], explanation: "A oração adverbial deslocada pode ser separada por vírgula; não se separa sujeito e predicado.", subject: "Pontuação" },
  { statement: "Assinale a palavra escrita corretamente conforme a ortografia vigente.", correct: "A pesquisa analisou a frequência dos alunos.", wrong: ["A pesquisa analisou a frequencia dos alunos.", "A pesquisa analizou a frequência dos alunos.", "A pesquisa analisou a frequênçia dos alunos."], explanation: "Frequência é escrita com acento circunflexo e com c antes de ia.", subject: "Ortografia" },
  { statement: "Na frase ‘A cidade acordou coberta por um manto de neblina’, qual figura de linguagem predomina?", correct: "Metáfora.", wrong: ["Eufemismo.", "Ironia.", "Onomatopeia."], explanation: "Manto de neblina cria uma associação figurada entre a neblina e uma cobertura, sem conectivo comparativo.", subject: "Figuras de linguagem" },
  { statement: "Em um anúncio que diz ‘Cuide da água: cada gota conta’, qual função da linguagem predomina?", correct: "Conativa ou apelativa, pois busca orientar o leitor.", wrong: ["Metalinguística, pois explica o código.", "Fática, pois testa o canal.", "Poética, pois destaca apenas a forma."], explanation: "O imperativo ‘cuide’ dirige-se ao leitor e procura influenciar sua conduta.", subject: "Funções da linguagem" },
  { statement: "Uma notícia informa fatos recentes, identifica fontes e prioriza clareza. Qual gênero textual é esse?", correct: "Notícia.", wrong: ["Receita culinária.", "Poema lírico.", "Verbete enciclopédico."], explanation: "A notícia relata acontecimentos de interesse público com foco informativo e apuração de fontes.", subject: "Gêneros textuais" },
  { statement: "Na frase ‘Marina estudou bastante; portanto, conseguiu resolver a prova’, o conectivo ‘portanto’ indica:", correct: "Conclusão.", wrong: ["Oposição.", "Condição.", "Explicação de finalidade."], explanation: "Portanto introduz uma conclusão decorrente da informação anterior.", subject: "Coesão textual" },
  { statement: "Em ‘O pesquisador retomou o estudo. Esse trabalho será publicado em junho’, a expressão ‘esse trabalho’ retoma:", correct: "O estudo mencionado na frase anterior.", wrong: ["A publicação de junho.", "O pesquisador como pessoa.", "Uma informação que ainda não apareceu."], explanation: "A expressão demonstrativa recupera anaforicamente o estudo citado antes.", subject: "Coesão textual" },
  { statement: "Em ‘Embora estivesse cansada, Joana terminou o relatório’, a conjunção ‘embora’ expressa:", correct: "Concessão.", wrong: ["Causa.", "Consequência.", "Adição."], explanation: "Embora apresenta um fato que poderia impedir a ação, mas não a impede.", subject: "Semântica" },
  { statement: "Em ‘O conselho aprovou a proposta’, a palavra ‘conselho’ significa:", correct: "Grupo reunido para deliberar.", wrong: ["Aviso dado por uma pessoa.", "Sentimento de pesar.", "Espaço usado para guardar objetos."], explanation: "Nesse contexto, conselho designa um colegiado que toma decisões.", subject: "Semântica" },
  { statement: "Em um editorial, qual característica costuma predominar?", correct: "Defesa argumentada de um ponto de vista sobre tema de interesse público.", wrong: ["Instruções sequenciadas para montar um objeto.", "Relato ficcional exclusivamente em versos.", "Lista de ingredientes e quantidades."], explanation: "O editorial apresenta a posição argumentada de um veículo de comunicação.", subject: "Gêneros textuais" },
  { statement: "Em ‘Ouvi o silêncio da sala vazia’, a combinação de ideias opostas caracteriza:", correct: "Paradoxo.", wrong: ["Pleonasmo.", "Aliteração.", "Comparação."], explanation: "Silêncio normalmente não é ouvido como som; a aproximação de ideias contraditórias forma paradoxo.", subject: "Figuras de linguagem" },
  { statement: "Qual frase usa corretamente ‘por que’ em uma pergunta direta?", correct: "Por que a reunião foi adiada?", wrong: ["A reunião foi adiada por quê motivo?", "Ninguém explicou o por que da mudança.", "A reunião foi adiada porque?"], explanation: "Em pergunta direta no início da frase, usa-se por que separado e sem acento.", subject: "Ortografia" },
  { statement: "Qual alternativa emprega corretamente o verbo haver com sentido de existir?", correct: "Havia três propostas em análise.", wrong: ["Haviam três propostas em análise.", "Houveram três propostas em análise.", "Hão três propostas em análise."], explanation: "Haver com sentido de existir é impessoal e permanece na terceira pessoa do singular.", subject: "Concordância" },
  { statement: "Assinale a frase em que a crase está corretamente empregada.", correct: "O atendimento ocorre das 8h às 17h.", wrong: ["O atendimento ocorre de 8h à 17h.", "O atendimento ocorre à partir das 8h.", "O atendimento ocorre à cada hora."], explanation: "Na correlação de horas, ocorre a preposição a mais o artigo: às 17h.", subject: "Crase" },
  { statement: "Qual frase respeita a regência do verbo obedecer?", correct: "Os candidatos obedeceram às instruções.", wrong: ["Os candidatos obedeceram as instruções.", "Os candidatos obedeceram com as instruções.", "Os candidatos obedeceram pelas instruções."], explanation: "Obedecer rege a preposição a; instruções recebe artigo feminino plural: às instruções.", subject: "Regência" },
];

function buildPortugueseQuestions(): SeedMcQuestion[] {
  const contexts = [
    "Durante a revisão de um comunicado escolar, uma estudante identificou a seguinte dúvida. ",
    "Ao preparar um relatório de pesquisa, a equipe revisou este trecho. ",
    "Na edição de uma notícia para o jornal da comunidade, surgiu esta questão. ",
    "Em uma atividade de leitura e escrita, a turma analisou o seguinte uso da língua. ",
    "Ao redigir uma solicitação formal, um estudante consultou a norma-padrão. ",
  ];
  const extraDistractors: Record<string, string> = {
    Concordância: "Houveram novas proposta para a turma.",
    Crase: "A atividade começa à partir das oito horas.",
    Regência: "A equipe assistiu o debate e chegou no auditório.",
    "Colocação pronominal": "Nunca explicou-se a decisão ao grupo.",
    Pontuação: "Os estudantes, revisaram o texto final.",
    Ortografia: "A frequencia foi analizada pela comissão.",
    "Figuras de linguagem": "A frase apresenta apenas uma instrução literal, sem recurso expressivo.",
    "Funções da linguagem": "A mensagem verifica somente se o canal de comunicação está funcionando.",
    "Gêneros textuais": "O texto tem como objetivo principal apresentar instruções em etapas.",
    "Coesão textual": "O conectivo retoma um termo que ainda será apresentado no texto.",
    Semântica: "A expressão deve ser entendida exclusivamente em sentido literal.",
  };
  return Array.from({ length: 100 }, (_, index) => {
    const item = PORTUGUESE_ITEMS[index % PORTUGUESE_ITEMS.length];
    const cycle = Math.floor(index / PORTUGUESE_ITEMS.length) + 1;
    return mcQuestion(
      `${contexts[(cycle - 1) % contexts.length]}${item.statement}`,
      item.correct,
      [...item.wrong, extraDistractors[item.subject]],
      `Língua Portuguesa — ${item.subject}`,
      item.explanation,
      index,
    );
  });
}

export const SUBJECT_MARATHON_EXAMS: SeedFullEnemExam[] = [
  {
    title: "Simulado de Matemática — 100 questões",
    slug: "maratona-matematica-100",
    description: "Maratona de Matemática com 100 questões objetivas, gabarito e explicações, cobrindo porcentagem, proporcionalidade, álgebra, geometria, estatística, probabilidade e juros.",
    examType: "ENEM",
    timeLimit: 180,
    questions: buildMathQuestions(),
  },
  {
    title: "Simulado de Português — 100 questões",
    slug: "maratona-portugues-100",
    description: "Maratona de Língua Portuguesa com 100 questões objetivas, gabarito e explicações, cobrindo gramática, interpretação, semântica, coesão e gêneros textuais.",
    examType: "ENEM",
    timeLimit: 180,
    questions: buildPortugueseQuestions(),
  },
];

/** Slugs dos simulados parciais antigos — removidos na migração para prova completa */
export const DEPRECATED_PARTIAL_ENEM_SLUGS = [
  "enem-2026-teste-linguagens-e-codigos",
  "enem-2026-teste-matematica-e-suas-tecnologias",
  "enem-2026-teste-ciencias-humanas",
  "enem-2026-teste-ciencias-da-natureza",
  "enem-2026-teste-redacao-e-competencias",
];
