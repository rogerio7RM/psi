const editionLabel = '17/09/2026';

const marketDashboard = [
  ['S&P 500', '+0,94%'],
  ['Nasdaq', '+1,25%'],
  ['Dow Jones', '+0,59%'],
  ['Russell 2000', '+1,20%'],
  ['VIX', '-2,01 pts'],
  ['DXY', '-0,10%'],
  ['Treasury 10Y', '4,95%'],
  ['WTI', '-1,80%'],
  ['Ouro Spot', '+1,10%'],
  ['Bitcoin', '-0,48%'],
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

function Edition260917() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 border-b border-slate-800 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">PrimeSphere Intelligence</p><h1 className="mt-3 text-3xl font-semibold md:text-5xl">Análise diária — {editionLabel}</h1><p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">A principal mudança desde ontem é que o Fed já aconteceu: elevou os juros em 25 pb para <strong className="text-slate-200">3,75%–4,00%</strong> e sinalizou possibilidade de novas altas. Apesar do tom mais hawkish, o mercado reagiu relativamente bem na manhã de hoje, com alívio nos juros longos e no petróleo.</p></header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Visão macro</p><h2 className="mt-2 text-2xl font-semibold">Resumo geral do mercado</h2><div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 md:text-base"><p>O mercado americano opera em recuperação após a decisão do Fed. A alta de 25 pb para <strong className="text-white">3,75%–4,00%</strong> retirou a incerteza imediata sobre o evento, mas a sinalização de novas altas mantém a trajetória dos juros como principal risco macro.</p><p>Nasdaq e ações de crescimento encontram suporte no alívio dos Treasuries de longo prazo e na queda do petróleo. Ao mesmo tempo, o ouro recupera terreno, mostrando que a procura por proteção continua relevante mesmo com uma política monetária mais restritiva.</p><p><strong className="text-white">Pontos de atenção:</strong> Treasury de 10 anos, expectativa para a próxima decisão do Fed, dólar, petróleo, volatilidade e amplitude da alta no Nasdaq. Uma nova aceleração dos juros longos pode voltar a pressionar tecnologia, enquanto dólar mais fraco e riscos geopolíticos tendem a oferecer suporte ao ouro.</p><p><strong className="text-white">Mudança principal desde ontem:</strong> o risco deixou de ser a decisão do Fed em si e passou a ser a velocidade e a extensão do novo ciclo de aperto monetário.</p></div></section>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Snapshot do mercado</p><h2 className="mt-2 text-2xl font-semibold">Market Dashboard</h2></div>
            <p className="text-xs text-slate-500">17/09/2026 · snapshot intraday</p>
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

        <section className="mt-6 rounded-2xl border border-cyan-900/60 bg-cyan-950/10 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Subitem da análise diária</p><h2 className="mt-2 text-2xl font-semibold">0DTE — análise intraday por ticker</h2><p className="mt-4 text-sm leading-7 text-slate-300">Esta execução foi feita após o fechamento. Sem confirmação simultânea de vencimento no mesmo dia, VWAP, faixa de abertura, volume, IV, Greeks e preços executáveis, não publicamos estruturas como se fossem operações reais.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','AMD','QQQ','SPY','GLD'].map(ticker => <div key={ticker} className="rounded-xl border border-slate-700 bg-slate-950/50 p-5"><p className="text-xs uppercase tracking-wider text-cyan-400">{ticker} — 0DTE</p><h3 className="mt-2 text-lg font-semibold">Sem operação</h3><p className="mt-2 text-sm leading-6 text-slate-400">Sem dados executáveis suficientes confirmados nesta simulação.</p></div>)}</div><p className="mt-5 text-sm leading-7 text-slate-400"><strong className="text-slate-200">Regra para a execução das 16:00:</strong> primeiro confirmar vencimento no mesmo dia. Somente tickers elegíveis seguem para VWAP, opening range, força relativa, volume e cadeia de opções. Setup confirmado poderá mostrar Bull Put Spread ou Bear Call Spread com pernas, strikes, crédito, risco máximo, break-even e invalidação. Caso contrário: Sem operação.</p></section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"><h2 className="text-2xl font-semibold">Síntese da execução</h2><div className="mt-5 space-y-3 text-sm leading-7 text-slate-300"><p>A fotografia de 17/09 mostra ambiente mais favorável a risco: tecnologia liderou, Nasdaq avançou mais que o S&P 500 e a volatilidade recuou. AMD apresentou o maior movimento diário do grupo (+6,36%), enquanto NVDA, TSLA e AMZN também avançaram mais de 2%.</p><p><strong className="text-white">Objetivo para amanhã:</strong> comparar cada ticker com esta fotografia e destacar o que realmente mudou em preço, notícias, macro, força relativa e 0DTE, evitando repetir uma análise estática.</p><p className="border-t border-slate-800 pt-4"><strong className="text-white">Dados:</strong> execução manual de teste com dados disponíveis em 17/09/2026 via Bigdata.com/FMP e calendário macro da FXStreet. Dados executáveis de opções não foram confirmados nesta simulação.</p></div></section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold">Arquivo de análises</h2><div className="mt-4 flex flex-wrap gap-3">{['260918', '260917'].map(code => <a key={code} href={`?${code}`} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">?{code}</a>)}</div></section>

        <footer className="mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500">PrimeSphere Intelligence · Conteúdo de pesquisa para fins informativos. Dados de mercado e métricas de opções devem ser confirmados em fontes ao vivo antes de qualquer execução.</footer>
      </div>
    </main>
  );
}

export default Edition260917;
