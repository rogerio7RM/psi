
export type StudyCategory = 'Opções' | 'Macroeconomia' | 'Indicadores' | 'Ações';

export type Study = {
  slug: string;
  title: string;
  tagline: string;
  category: StudyCategory;
  description: string;
  pdf: string;
  pageCount: number;
  pages: { title: string; caption: string; image: string }[];
  chapters: { title: string; pageIndex: number }[];
};

const pageMetadata: Array<[string, string]> = [
  ['Introdução e escolha dos strikes', 'Objetivos da lição e relação entre posições ATM e OTM.'],
  ['Movimento esperado', 'VIX, VIX 1D e IVX como apresentados pelo material.'],
  ['Comparação visual das métricas', 'Gráficos com as referências de movimento esperado.'],
  ['Fórmula e horizonte temporal', 'A apresentação discute as janelas do VIX e do VIX 1D.'],
  ['IVX e mapa dos strikes', 'Diagramas sobre o IVX e a distância dos strikes.'],
  ['Metodologia e drawdown', 'Parâmetros do estudo e distinção entre perda contratual e drawdown acumulado.'],
  ['Metas de 10% e 25%', 'Resultados e exemplos apresentados nas tabelas do estudo.'],
  ['Risco de direção e de tempo', 'Quadro comparativo e conclusões da apresentação original.'],
  ['Metodologia e resumo visual', 'Descrição do backtest e resumo executivo.'],
  ['Principais aprendizados', 'Síntese do texto: ATM, OTM, IVX e alvos de lucro.'],
];


const secondPageMetadata: Array<[string, string]> = [
  ['O estudo dos Put Spreads 0 DTE', 'Visão geral do estudo e dos dados apresentados no material.'],
  ['O dilema do OTM', 'A apresentação compara o prêmio inicial com a taxa de acerto ao afastar os strikes.'],
  ['Parâmetros da pesquisa', 'Método declarado no material: SPX 0 DTE, spreads de $20 e observações a cada 10 minutos.'],
  ['O drawdown máximo', 'Distinção ilustrada entre risco de uma operação e séries de perdas.'],
  ['As quatro medidas do Expected Move', 'VIX, VIX 1D, Half VIX, Half VIX 1D e IVX conforme a comparação do material.'],
  ['Matemática do movimento', 'Fórmulas de movimento esperado com base em índices e preços das opções.'],
  ['Strikes extremos', 'Tabela visual do material com taxa de acerto e lucro médio em strikes OTM.'],
  ['Strikes próximos e alvo de 25%', 'Exemplo apresentado para strikes próximos e realização parcial do prêmio.'],
  ['Strikes distantes e alvo de 50%', 'Exemplo do material para spreads mais afastados do dinheiro.'],
  ['Síntese: distância versus lucro', 'Curva ilustrativa que relaciona a distância do strike ao alvo de lucro.'],
  ['Resultados apresentados para IVX', 'Comparação quantitativa e interpretação apresentadas pela pesquisa original.'],
  ['Playbook executivo', 'Resumo visual das principais conclusões atribuídas ao estudo.'],
];

export const studies: Study[] = [{
  slug: 'matematica-zero-dte',
  title: 'A Matemática do Zero DTE',
  tagline: 'Estratégias com opções que vencem no mesmo dia',
  category: 'Opções',
  description: 'Estudo ilustrado de 10 páginas sobre movimento esperado, VIX, VIX 1D, IVX, escolha de strikes, alvos de lucro e risco.',
  pdf: '/estudos/matematica-zero-dte/estudo-0-dte.pdf',
  pageCount: 10,
  pages: pageMetadata.map(([title, caption], index) => ({
    title, caption,
    image: '/estudos/matematica-zero-dte/slide-' + String(index + 1).padStart(2, '0') + '.webp',
  })),
  chapters: [
    { title: 'Introdução', pageIndex: 0 },
    { title: 'Movimento esperado', pageIndex: 1 },
    { title: 'Estratégias e riscos', pageIndex: 4 },
    { title: 'Metodologia e alvos', pageIndex: 5 },
    { title: 'Conclusões', pageIndex: 8 },
  ],
}, {
  slug: 'analise-quantitativa-put-spreads-0-dte',
  title: 'Análise Quantitativa de Put Spreads 0 DTE',
  tagline: 'Distância dos strikes, alvos de lucro e drawdown',
  category: 'Opções',
  description: 'Segundo estudo: apresentação visual de 12 páginas sobre SPX 0 DTE, Expected Move, strikes OTM, metas de 25% e 50% e drawdown.',
  pdf: '/estudos/analise-quantitativa-put-spreads-0-dte/estudo-put-spreads-0-dte.pdf',
  pageCount: 12,
  pages: secondPageMetadata.map(([title, caption], index) => ({
    title, caption,
    image: '/estudos/analise-quantitativa-put-spreads-0-dte/slide-' + String(index + 1).padStart(2, '0') + '.webp',
  })),
  chapters: [
    { title: 'Introdução', pageIndex: 0 },
    { title: 'Metodologia e risco', pageIndex: 2 },
    { title: 'Movimento esperado', pageIndex: 4 },
    { title: 'Strikes e alvos', pageIndex: 6 },
    { title: 'Conclusões', pageIndex: 9 },
  ],
}];

export const categories: Array<'Todos' | StudyCategory> = ['Todos', 'Opções', 'Macroeconomia', 'Indicadores', 'Ações'];
