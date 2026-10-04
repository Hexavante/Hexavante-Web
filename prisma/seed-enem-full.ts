/**
 * Gera simulados ENEM completos para ambiente de teste:
 * - 100 questões objetivas (25 por área do conhecimento)
 * - 1 questão dissertativa de Redação ao final (tipo ESSAY)
 *
 * As questões são fictícias, no estilo ENEM, para fins de desenvolvimento e QA.
 * Não reproduzem o conteúdo oficial do INEP.
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

const DISTRACTOR_POOL = [
  "Afirmação que contradiz o contexto apresentado no enunciado.",
  "Interpretação literal inadequada do texto-base.",
  "Generalização indevida sem respaldo nos dados.",
  "Confusão entre causa e consequência no raciocínio.",
];

function buildAlternatives(correctText: string, number: number): SeedAlternative[] {
  const labels = ["A", "B", "C", "D", "E"];
  const correctIndex = number % 5;
  const options = labels.map((label, idx) => {
    if (idx === correctIndex) {
      return { text: `${label}) ${correctText}`, isCorrect: true };
    }
    const distractor = DISTRACTOR_POOL[(number + idx) % DISTRACTOR_POOL.length];
    return { text: `${label}) ${distractor}`, isCorrect: false };
  });
  return options;
}

function buildAreaQuestions(area: EnemArea, year: number): SeedMcQuestion[] {
  const questions: SeedMcQuestion[] = [];

  for (let i = 0; i < 25; i++) {
    const number = area.start + i;
    const topic = area.topics[i % area.topics.length];
    const statement = [
      `Questão ${number} — ${area.name} (ENEM ${year})`,
      `Com base em ${topic}, analise a situação apresentada e assinale a alternativa correta.`,
      `Considere os dados do contexto e a abordagem interdisciplinar típica da prova do ENEM.`,
    ].join(" ");

    const correctText = `Resposta coerente com ${topic} no contexto da questão ${number}.`;

    questions.push({
      type: "MULTIPLE_CHOICE",
      statement,
      alternatives: buildAlternatives(correctText, number),
      subject: area.name,
      explanation: `Esta questão trabalha ${topic}. A alternativa correta articula o conceito ao contexto do enunciado, evitando interpretações literais ou generalizações sem respaldo.`,
      difficulty: 1 + (i % 3),
    });
  }

  return questions;
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

export function buildFullEnemExam(year: number): SeedFullEnemExam {
  const redacao = REDACAO_THEMES[year];
  if (!redacao) {
    throw new Error(`Ano ENEM não suportado no seed: ${year}`);
  }

  const mcQuestions = ENEM_AREAS.flatMap((area) => buildAreaQuestions(area, year));

  return {
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
}

/** Simulados ENEM completos disponíveis no seed */
export const FULL_ENEM_EXAMS: SeedFullEnemExam[] = [
  buildFullEnemExam(2026),
  buildFullEnemExam(2025),
  buildFullEnemExam(2024),
];

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
