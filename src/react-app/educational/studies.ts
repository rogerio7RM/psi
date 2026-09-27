
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
}];

export const categories: Array<'Todos' | StudyCategory> = ['Todos', 'Opções', 'Macroeconomia', 'Indicadores', 'Ações'];
