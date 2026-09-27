const snapshot = [
  ['S&P 500','7.704,13','-0,02%'],['Nasdaq','26.939,37','+0,01%'],['Dow','51.349,98','-0,31%'],['Russell 2000','2.835,57','-0,11%'],
  ['VIX','15,67','+3,23%'],['US 10Y','5,18%','yield'],['WTI','US$ 94,99','+3,07%'],['Ouro','US$ 4.301,80','-0,38%'],
  ['Bitcoin','US$ 84.251,86','-0,14%'],['USD/BRL','5,20','+0,66%'],
];
const drivers = [
  { title: 'Juros longos continuam elevados', number: '10Y: 5,18%', body: 'O Treasury de 10 anos terminou o dia em nível elevado. A curva longa segue como referência importante para ações de crescimento e custos de financiamento.', impact: 'O que importa: acompanhar a reação das empresas de maior duration e as próximas falas do Fed.' },
  { title: 'Petróleo volta a subir', number: 'WTI: +3,07%', body: 'WTI em US$ 94,99 e Brent em US$ 107,23 no corte de 22:36 Madrid. A incerteza geopolítica no Oriente Médio esteve no radar, conforme noticiário da Reuters.', impact: 'O que importa: petróleo mais caro pode reabrir preocupações com inflação e favorecer energia em relação a setores consumidores de combustível.' },
  { title: 'Wall Street recupera terreno intraday', number: 'S&P: -0,02%', body: 'Apesar da fraqueza na abertura, S&P 500 e Nasdaq terminaram praticamente estáveis; o Dow encerrou em queda de 0,31%. O fechamento misto não confirmou integralmente a pressão do pré-market.', impact: 'O que importa: dispersão por setores e manutenção de juros elevados merecem mais atenção do que a variação isolada dos grandes índices.' },
];
const sectorData = [
  ['Comunicação (XLC)','+1,27%'],['Saúde (XLV)','+0,63%'],['Energia (XLE)','+0,37%'],['Tecnologia (XLK)','-0,34%'],
  ['Industriais (XLI)','-0,75%'],['Utilities (XLU)','-0,98%'],['Materiais (XLB)','-1,19%'],
];
const Card = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-8'>
    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400'>{title}</p>
    <div className='mt-5'>{children}</div>
  </section>
);
function Edition260924() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8 md:py-12'>
        <header className='border-b border-slate-800 pb-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400'>PrimeSphere Intelligence</p>
          <h1 className='mt-4 text-4xl font-bold md:text-6xl'>AFTER CLOSE</h1>
          <p className='mt-3 text-lg text-slate-300'>Wall Street · 24/09/2026</p>
          <p className='mt-5 inline-block rounded-lg border border-cyan-900/60 bg-cyan-950/30 px-4 py-3 font-semibold text-cyan-200'>Atualizado às 22:36 Madrid · corte Bigdata.com / FMP</p>
          <p className='mt-5 max-w-4xl text-base leading-7 text-slate-300'>Após um início negativo, o S&P 500 e o Nasdaq fecharam perto da estabilidade. O Dow recuou, enquanto Treasury de 10 anos e petróleo continuaram elevados. Dados de mercado indicativos do corte pós-fechamento; instrumentos contínuos seguem negociando.</p>
        </header>
        <Card title='Timeline da edição de hoje'>
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl bg-slate-950/70 p-4'><strong>12:30 · Morning Brief</strong><p className='mt-2 text-sm leading-6 text-slate-400'>Yields acima de 5%, petróleo firme e atenção à cúpula EUA–China.</p></div>
            <div className='rounded-xl bg-slate-950/70 p-4'><strong>15:00 · Final Pré-Market</strong><p className='mt-2 text-sm leading-6 text-slate-400'>Futuros em queda; Nasdaq -1,0%, S&P -0,5%, 10Y a 5,15% e WTI US$ 93,93 naquele corte.</p></div>
            <div className='rounded-xl border border-cyan-800 bg-cyan-950/30 p-4'><strong className='text-cyan-300'>22:36 · After Close</strong><p className='mt-2 text-sm leading-6 text-slate-300'>S&P e Nasdaq perto do zero; 10Y a 5,18%, petróleo em alta e setores divergentes.</p></div>
          </div>
        </Card>
        <Card title='Fechamento em 30 segundos'>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>{snapshot.map(([name,value,change]) => <div key={name} className='rounded-xl border border-slate-800 bg-slate-950/70 p-4'><p className='text-xs text-slate-400'>{name}</p><p className='mt-2 text-xl font-bold'>{value}</p><p className={'mt-1 text-sm ' + (change.startsWith('+') ? 'text-emerald-400' : change.startsWith('-') ? 'text-rose-400' : 'text-slate-400')}>{change}</p></div>)}</div>
          <p className='mt-4 text-xs leading-5 text-slate-500'>Índices: corte 22:34 Madrid; demais ativos: corte aproximado 22:36 Madrid. FMP via Bigdata.com. Commodities, cripto e câmbio podem variar após o fechamento de ações.</p>
        </Card>
        <section className='grid gap-4 lg:grid-cols-3'>{drivers.map((d,i) => <article key={d.title} className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-sm font-bold text-cyan-400'>0{i+1} · O que moveu o mercado</p><h2 className='mt-3 text-2xl font-bold'>{d.title}</h2><p className='mt-3 text-xl font-bold text-white'>{d.number}</p><p className='mt-4 text-sm leading-7 text-slate-300'>{d.body}</p><p className='mt-4 border-t border-slate-800 pt-4 text-sm leading-7 text-cyan-100'>{d.impact}</p></article>)}</section>
        <Card title='O que mudou durante o pregão'>
          <p className='text-base leading-8 text-slate-300'>Às 15:00 Madrid, os futuros indicavam quedas expressivas para tecnologia. No corte após o fechamento, o Nasdaq estava em +0,01% e o S&P em -0,02%. O petróleo seguiu em alta, mas a trajetória dos índices mostrou recuperação em relação à abertura. Essa comparação é descritiva e não atribui a reversão a uma única notícia.</p>
        </Card>
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card title='Setores e temas'>
            <div className='space-y-3'>{sectorData.map(([name,change]) => <div key={name} className='flex items-center justify-between gap-3 border-b border-slate-800 pb-2'><span className='text-sm text-slate-300'>{name}</span><strong className={change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{change}</strong></div>)}</div>
            <p className='mt-4 text-sm leading-6 text-slate-400'>ETFs setoriais às 22:00 Madrid. Comunicação e saúde tiveram desempenho positivo, enquanto materiais e utilities ficaram para trás.</p>
          </Card>
          <Card title='Movers e catalisadores'>
            <p className='text-base leading-7 text-slate-300'><strong className='text-white'>MGM Resorts:</strong> notícia confirmada da retirada de proposta de aquisição pressionou o papel durante a sessão. <strong className='text-white'>Setor de energia:</strong> ETF XLE subiu 0,37% no contexto de avanço do WTI. Não há cotação de fechamento individual validada para MGM neste corte; evitamos atribuir uma variação de pré-market ao fechamento.</p>
            <p className='mt-4 text-xs leading-5 text-slate-500'>Fonte: Reuters, 24/09, para MGM e contexto geopolítico; Bigdata.com/FMP para ETFs setoriais.</p>
          </Card>
        </section>
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card title='Agenda e indicadores'>
            <p className='text-base leading-7 text-slate-300'><strong className='text-white'>Initial Jobless Claims:</strong> 197 mil, abaixo do consenso de 201 mil, conforme a atualização anterior. Continuing Claims: 1,719 milhão, ante 1,750 milhão esperado. Pedidos menores que o previsto são compatíveis com um mercado de trabalho resiliente; não demonstram, isoladamente, a causa dos movimentos dos ativos.</p>
            <p className='mt-3 text-sm leading-6 text-slate-400'>New Home Sales: resultado efetivo não suficientemente confirmado neste corte; não publicamos estimativa como realizado.</p>
          </Card>
          <Card title='Earnings After Close'>
            <p className='text-base leading-7 text-slate-300'><strong className='text-white'>Costco:</strong> divulgação de resultados prevista para depois do fechamento. No corte desta edição, sem números efetivos validados. Acompanhar receita, lucro por ação, vendas comparáveis e comentários sobre margens quando o release estiver disponível.</p>
            <p className='mt-3 text-sm leading-6 text-slate-400'>Não confundir consenso prévia e resultado reportado.</p>
          </Card>
        </section>
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card title='Amanhã no radar · 25/09'>
            <ol className='list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-300'>
              <li><strong>14:30 Madrid:</strong> pedidos de bens duráveis dos EUA, incluindo núcleo sem transportes.</li>
              <li><strong>16:00 Madrid:</strong> índice final de sentimento da Universidade de Michigan e expectativas de inflação.</li>
              <li><strong>Fed:</strong> novas falas de dirigentes, com atenção à trajetória esperada dos juros.</li>
              <li><strong>US 10Y:</strong> verificar se yields permanecem acima de 5%.</li>
              <li><strong>Petróleo e geopolítica:</strong> acompanhar WTI, Brent e desdobramentos EUA–Irã e EUA–China.</li>
            </ol>
          </Card>
          <Card title='Brasil → EUA'>
            <p className='text-3xl font-bold'>USD/BRL 5,20 <span className='text-xl text-rose-400'>+0,66%</span></p>
            <p className='mt-4 text-base leading-7 text-slate-300'>O dólar mais forte frente ao real aumenta, em reais, o valor de posições dolarizadas, mantidas constantes as demais variáveis. Para novos aportes, eleva o custo de comprar a mesma quantidade de dólares. Cotação indicativa do corte, não taxa de câmbio para operações de varejo.</p>
          </Card>
        </section>
        <Card title='Fontes e validação'>
          <p className='text-sm leading-7 text-slate-300'>Bigdata.com / Financial Modeling Prep: índices, setores, US Treasury yields, commodities, ouro, Bitcoin e USD/BRL; atualização entre 22:00 e 22:36 Madrid de 24/09/2026. Reuters (24/09): cenário geopolítico, petróleo, Fed e MGM. Agenda de 25/09: calendário econômico semanal da Kiplinger e conferência de mercado. Os horários seguem Europe/Madrid (CEST, UTC+2 nesta data).</p>
          <div className='mt-3 space-y-2 text-sm text-cyan-300'><p><a href='https://www.fidelity.com/news/article/us-markets/202609241021RTRSNEWSCOMBINED_L4N45G144_1' target='_blank' rel='noreferrer'>Reuters via Fidelity — 24/09</a></p><p><a href='https://www.kiplinger.com/investing/economy/this-weeks-economic-calendar' target='_blank' rel='noreferrer'>Calendário econômico semanal — 21 a 25/09</a></p></div>
          <p className='mt-4 text-xs text-slate-500'>Conteúdo informativo e educacional; não constitui recomendação individual de investimento.</p>
        </Card>
        <Card title='Arquivo de análises'><div className='flex flex-wrap gap-2'>{['260924','260923','260922','260921','260918','260917'].map(code => <a key={code} href={'?' + code} className='rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-600'>{code.slice(4,6) + '/' + code.slice(2,4)}</a>)}</div></Card>
        <footer className='border-t border-slate-800 pt-5 text-xs text-slate-500'>PrimeSphere Intelligence · Wall Street explicado em português para o investidor brasileiro.</footer>
      </div>
    </main>
  );
}
export default Edition260924;
