const editionLabel = '18/09/2026';

const marketDashboard = [
  ['S&P 500', '7.650,50 · +0,17%'],
  ['Nasdaq', '26.522,55 · +0,40%'],
  ['Dow Jones', '51.682,64 · -0,18%'],
  ['Russell 2000', '2.860,40 · -0,49%'],
  ['VIX', '15,51 · +0,45%'],
  ['DXY', '100,22 · -0,03%'],
  ['Treasury 10Y', '≈5,00% · intraday'],
  ['WTI', 'US$ 97,81 · -4,02%'],
  ['Ouro futuro', 'US$ 4.390,40 · -0,21%'],
  ['Bitcoin', 'US$ 80.255,73 · +5,11%'],
];

const summary = [
  ['NVDA', '+2,54%', 'Força acima do mercado', 'Positivo'],
  ['AAPL', '+1,38%', 'Participou da recuperação de tecnologia', 'Neutro/Positivo'],
  ['MSFT', '+1,52%', 'Cloud e IA seguem como catalisadores', 'Positivo'],
  ['GOOGL', '+1,30%', 'Preço subiu apesar de sentimento noticioso mais fraco', 'Positivo'],
  ['AMZN', '+2,13%', 'AWS/IA e recuperação de tecnologia', 'Positivo'],
  ['META', '+1,34%', 'Preço e sentimento mostram sinais divergentes', 'Neutro'],
  ['TSLA', '+2,22%', 'Força de curto prazo com risco elevado', 'Neutro/Positivo'],
  ['AMD', '+6,36%', 'Maior movimento do grupo nesta sessão', 'Positivo'],
  ['QQQ', '+1,73%', 'Tecnologia liderou a recuperação', 'Positivo'],
  ['SPY', '+1,15%', 'Recuperação ampla do mercado', 'Positivo'],
  ['GLD', '+1,70%', 'Recuperação forte do ouro', 'Neutro/Positivo'],
];

function AssetSection({ title, rating, children }: { title: string; rating: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"><div className="flex flex-col gap-2 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-semibold">{title}</h2><span className="text-sm font-semibold text-slate-200">{rating}</span></div><div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 md:text-base">{children}</div></article>;
}

function Edition260918() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 border-b border-slate-800 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">PrimeSphere Intelligence</p><h1 className="mt-3 text-3xl font-semibold md:text-5xl">Análise diária — {editionLabel}</h1><p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">Edição atualizada após o fechamento de 18/09. A principal mudança desde a análise intraday é que S&P 500 e Nasdaq conseguiram terminar modestamente positivos, enquanto o Dow e o Russell 2000 fecharam em queda. O Treasury de 10 anos permaneceu na região de 5%, e semicondutores ajudaram a sustentar tecnologia.</p></header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Visão macro</p><h2 className="mt-2 text-2xl font-semibold">Resumo geral do mercado</h2><div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 md:text-base"><p>Wall Street encerrou uma semana turbulenta de forma mista nesta sexta: o S&P 500 fechou em 7.650,50 (+0,17%), o Nasdaq em 26.522,55 (+0,40%), o Dow em 51.682,64 (-0,18%) e o Russell 2000 em 2.860,40 (-0,49%). A liderança de semicondutores ajudou S&P e Nasdaq, mas a amplitude permaneceu negativa, mostrando uma sessão menos forte do que os índices de tecnologia sugerem.</p><p>O Fed elevou a taxa para <strong className="text-white">4,00%</strong> em 16/09, primeira alta em mais de três anos, e as projeções reforçaram a possibilidade de juros altos por mais tempo. O Treasury de 10 anos voltou à região de 5% nesta sessão, mantendo pressão sobre múltiplos de growth e ajudando a explicar a divergência entre a resiliência de tecnologia e a fraqueza do mercado mais amplo.</p><p>O WTI recua cerca de 4,0% para US$ 97,81 e o Brent permanece acima de US$ 100, mas abaixo dos picos recentes, reduzindo parte do choque inflacionário. Ouro futuro gira em US$ 4.390,40 e Bitcoin sobe cerca de 5,1% para US$ 80,3 mil. O DXY está praticamente estável perto de 100,22.</p><p>Os dados recentes continuam mistos: CPI de agosto em 3,4% a/a, vendas no varejo de agosto +1,2% m/m e pedidos iniciais de seguro-desemprego em 196 mil. Para o restante do dia, o calendário dos EUA é leve, com contagem de sondas Baker Hughes e posições CFTC. <strong className="text-white">Mudança principal desde ontem:</strong> o Treasury de 10 anos voltou à região de 5% e a amplitude deteriorou, enquanto tecnologia — apoiada por semicondutores — resiste melhor que o mercado amplo. O vencimento trimestral de derivativos ('triple witching') adiciona potencial de volatilidade e volume.</p></div></section>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Snapshot do mercado</p><h2 className="mt-2 text-2xl font-semibold">Market Dashboard</h2></div>
            <p className="text-xs text-slate-500">18/09/2026 · fechamento dos índices; demais mercados conforme último snapshot disponível</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {marketDashboard.map(([name, change]) => {
              const positive = change.startsWith('+');
              const negative = change.startsWith('-');
              return <div key={name} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4"><p className="text-xs text-slate-500">{name}</p><p className={`mt-1 text-lg font-semibold ${positive ? 'text-emerald-400' : negative ? 'text-rose-400' : 'text-slate-100'}`}>{change}</p></div>;
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Leitura rápida do cenário antes da análise dos ativos. Treasury 10Y é mostrado pelo yield; VIX pela variação em pontos. Valores representam o snapshot disponível durante a elaboração desta edição.</p>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-slate-800 bg-slate-900"><tr>{['Ativo', 'Viés hoje', 'Mudança principal', 'Classificação'].map(h => <th key={h} className="px-5 py-4 font-semibold text-slate-300">{h}</th>)}</tr></thead><tbody>{summary.map(row => <tr key={row[0]} className="border-b border-slate-800/70 last:border-0">{row.map((cell, i) => <td key={cell} className={`px-5 py-4 ${i === 0 ? 'font-semibold text-white' : 'text-slate-300'}`}>{cell}</td>)}</tr>)}</tbody></table></section>

        <section className="mt-6 space-y-6">
          <AssetSection title="NVDA — US$ 219,34 | +2,54%" rating="POSITIVO"><p>NVIDIA voltou a mostrar força junto com tecnologia. O último EPS disponível foi US$ 2,22, com surpresa positiva de aproximadamente 6,2%. A exposição à infraestrutura de IA continua sendo o principal catalisador, enquanto expectativas elevadas e juros longos são os principais riscos.</p><p><strong className="text-white">Mudança hoje:</strong> avanço superior ao SPY.</p></AssetSection>
          <AssetSection title="AAPL — US$ 337,00 | +1,38%" rating="NEUTRO/POSITIVO"><p>Apple participou da recuperação, mas com movimento menos agressivo que várias empresas diretamente ligadas à infraestrutura de IA. O último EPS disponível foi US$ 2,02, aproximadamente 6,9% acima da expectativa registrada na base.</p></AssetSection>
          <AssetSection title="MSFT — US$ 497,75 | +1,52%" rating="POSITIVO"><p>Microsoft mantém a combinação de software recorrente, cloud e infraestrutura de IA. O último EPS disponível foi US$ 4,74, com surpresa positiva de aproximadamente 11,8%. O retorno sobre o forte investimento em infraestrutura de IA continua sendo o ponto central de acompanhamento.</p></AssetSection>
          <AssetSection title="GOOGL — US$ 347,33 | +1,30%" rating="POSITIVO"><p>Alphabet avançou junto com tecnologia. Search, Cloud e IA sustentam a tese, enquanto CAPEX, juros e riscos regulatórios seguem no radar. Nesta execução, o preço subiu enquanto o indicador agregado de sentimento noticioso do Bigdata estava mais fraco, uma divergência importante para acompanhar.</p></AssetSection>
          <AssetSection title="AMZN — US$ 251,19 | +2,13%" rating="POSITIVO"><p>Amazon apresentou uma das recuperações mais fortes entre as megacaps acompanhadas. O último EPS registrado foi US$ 5,75. AWS e infraestrutura de IA continuam como catalisadores, enquanto CAPEX elevado permanece como contraponto.</p></AssetSection>
          <AssetSection title="META — US$ 682,31 | +1,34%" rating="NEUTRO"><p>Meta acompanhou a recuperação, mas os dados desta execução mostram sinais mistos. O último EPS disponível foi US$ 6,18, com surpresa negativa de aproximadamente 14% na base consultada, enquanto o preço avançou no dia.</p></AssetSection>
          <AssetSection title="TSLA — US$ 366,02 | +2,22%" rating="NEUTRO/POSITIVO"><p>Tesla subiu mais que o mercado, mas permanece altamente sensível a expectativas. O último EPS disponível foi US$ 0,33, aproximadamente 34% abaixo da expectativa registrada, contrastando com a força do preço nesta sessão.</p></AssetSection>
          <AssetSection title="AMD — US$ 545,09 | +6,36%" rating="POSITIVO"><p>AMD foi o maior movimento da lista nesta execução. O último EPS registrado foi US$ 1,66, com pequena surpresa positiva. A próxima edição deve verificar se essa força relativa continua após a abertura, em vez de assumir continuação apenas pela alta de hoje.</p></AssetSection>
          <AssetSection title="QQQ — US$ 716,92 | +1,73%" rating="POSITIVO"><p>QQQ fechou acima da média móvel de 50 dias, aproximadamente US$ 709,88, e da média de 200 dias, US$ 661,59. O RSI diário disponível estava perto de 53. Tecnologia representa aproximadamente 59,9% do ETF.</p></AssetSection>
          <AssetSection title="SPY — US$ 762,70 | +1,15%" rating="POSITIVO"><p>SPY teve recuperação ampla e encerrou acima das médias de 50 e 200 dias, aproximadamente US$ 759,19 e US$ 715,48. Sua volatilidade realizada de 20 dias estava em aproximadamente 9,65%.</p></AssetSection>
          <AssetSection title="GLD — US$ 398,40 | +1,70%" rating="NEUTRO/POSITIVO"><p>GLD avançou com força. O preço ficou acima da média de 50 dias, aproximadamente US$ 392,04, mas abaixo da média de 200 dias, cerca de US$ 416,11. A volatilidade realizada de 20 dias estava em aproximadamente 24,4%.</p></AssetSection>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-900/60 bg-cyan-950/10 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Subitem da análise diária</p><h2 className="mt-2 text-2xl font-semibold">0DTE — análise intraday por ticker</h2><p className="mt-4 text-sm leading-7 text-slate-300">O vencimento de opções em <strong className="text-white">18/09/2026 permanece confirmado para os 11 tickers acompanhados</strong>. Na atualização intraday, o IBKR mostra NVDA a US$ 219,30, faixa US$ 218,03–220,07, abertura US$ 219,45, volume de ~28,5 milhões e IV anualizada do underlying de ~30,2%; AAPL está em US$ 335,23, faixa US$ 334,79–338,49, abertura US$ 338,35, volume de ~13,1 milhões e IV anualizada de ~22,6%. Apesar disso, não há neste snapshot um conjunto completo e simultâneo de VWAP, Greeks, bid/ask e crédito líquido confirmado para validar spreads em todos os tickers. Portanto, a decisão responsável continua sendo Sem operação, sem inventar strikes ou preços executáveis.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','AMD','QQQ','SPY','GLD'].map(ticker => <div key={ticker} className="rounded-xl border border-slate-700 bg-slate-950/50 p-5"><p className="text-xs uppercase tracking-wider text-cyan-400">{ticker} — 0DTE</p><h3 className="mt-2 text-lg font-semibold">Elegível · Sem operação</h3><p className="mt-2 text-sm leading-6 text-slate-400">Vencimento 18/09 confirmado. Sem conjunto completo e simultâneo de VWAP, força relativa, IV/Greeks, bid/ask e crédito executável para validar Bull Put Spread ou Bear Call Spread com risco definido.</p></div>)}</div><p className="mt-5 text-sm leading-7 text-slate-400"><strong className="text-slate-200">Critério:</strong> Bull Put Spread somente com suporte/VWAP/força relativa confirmados; Bear Call Spread somente com resistência/rejeição/fraqueza confirmadas. Strikes, crédito, risco máximo e break-even só serão publicados quando a cadeia fornecer preços confirmados.</p></section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"><h2 className="text-2xl font-semibold">Síntese da execução</h2><div className="mt-5 space-y-3 text-sm leading-7 text-slate-300"><p>O fechamento de 18/09 confirmou uma sessão seletiva: S&P 500 e Nasdaq terminaram modestamente positivos, enquanto Dow e Russell 2000 recuaram. O destaque estrutural foi a resiliência do complexo de IA/semicondutores, mesmo com yields longos elevados e amplitude negativa.</p><p>O contraponto é macro: o Fed iniciou novo aperto e o Treasury de 10 anos ainda está perto de 5%. A queda forte do petróleo nesta manhã ajuda growth; ouro também sobe, mostrando que proteção macro continua demandada. META segue com a leitura mais mista do grupo pelo sentimento noticioso mais fraco.</p><p className="border-t border-slate-800 pt-4"><strong className="text-white">Dados:</strong> Bigdata.com para notícias/catalisadores; Reuters, AP e fontes públicas recentes para fechamento e macro. Os dados de opções necessários para uma estrutura 0DTE executável não ficaram completos e simultaneamente confirmados; por isso, nenhum strike, crédito ou Greek foi inferido ou inventado. A seção 0DTE não publica strikes, créditos ou Greeks não confirmados.</p></div></section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold">Arquivo de análises</h2><div className="mt-4 flex flex-wrap gap-3">{['260918', '260917'].map(code => <a key={code} href={`?${code}`} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">?{code}</a>)}</div></section>

        <footer className="mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500">PrimeSphere Intelligence · Conteúdo de pesquisa para fins informativos. Dados de mercado e métricas de opções devem ser confirmados em fontes ao vivo antes de qualquer execução.</footer>
      </div>
    </main>
  );
}

export default Edition260918;
