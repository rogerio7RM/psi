const snapshot = [
  ['S&P 500', '7.764,70', '+1,49%', 'positive'],
  ['Nasdaq', '27.122,09', '+2,26%', 'positive'],
  ['Nasdaq-100', '30.482,35', '+2,83%', 'positive'],
  ['Dow', '52.048,83', '+0,71%', 'positive'],
  ['Russell 2000', '2.875,36', '+0,52%', 'positive'],
  ['VIX', '14,80', '-0,07%', 'positive'],
  ['Treasury 10Y', '4,96%', 'queda no dia', 'positive'],
  ['WTI', 'US$ 91,90', '-4,35%', 'positive'],
  ['Ouro', 'US$ 4.380,70', '-1,00%', 'neutral'],
  ['Bitcoin', 'US$ 86,9 mil', '+7,09%', 'positive'],
  ['USD/BRL', '5,11', '-0,71%', 'positive'],
];

const movers = [
  ['INTC', 'forte alta', 'Semicondutores lideraram a sessão; Intel esteve entre os destaques do Russell 1000.'],
  ['AMD', '~+9%', 'Avanço ligado ao apetite por IA e à valorização do complexo de chips.'],
  ['META', 'forte alta', 'Ações de comunicação/IA ajudaram a puxar o setor de Communication Services.'],
  ['WBD', '~+10%', 'Notícias sobre o processo ligado à combinação com Paramount impulsionaram o papel.'],
  ['Energia', 'pressão', 'WTI caiu 4,35%; XLE recuou 2,89% no fechamento.'],
];

function Tone({ tone }: { tone: string }) {
  const c = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : 'text-amber-300';
  return <span className={'text-xs font-semibold uppercase tracking-wider ' + c}>{tone === 'positive' ? 'favorável' : tone === 'negative' ? 'pressão' : 'atenção'}</span>;
}

function Edition260921() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12'>
        <header className='mb-8 border-b border-slate-800 pb-7'>
          <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400'>PrimeSphere Intelligence</p>
              <h1 className='mt-3 text-4xl font-semibold md:text-6xl'>AFTER CLOSE</h1>
              <p className='mt-3 text-xl text-slate-300'>Wall Street · 21/09/2026</p>
            </div>
            <div className='rounded-xl border border-cyan-900/60 bg-cyan-950/20 px-4 py-3 text-sm text-slate-300'>
              <p className='font-semibold text-cyan-300'>Atualizado às 22:25 Madrid</p>
              <p className='mt-1'>16:25 ET</p>
              <p className='mt-1 text-xs text-slate-500'>Terceira atualização do dia</p>
            </div>
          </div>
          <p className='mt-5 max-w-4xl text-sm leading-7 text-slate-400 md:text-base'>Wall Street encerrou em forte alta, com tecnologia e semicondutores liderando. A queda do petróleo e o recuo do Treasury de 10 anos aliviaram parte da pressão inflacionária e ajudaram o Nasdaq a registrar novo recorde.</p>
        </header>

        <section className='mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Timeline de hoje · horário de Madrid</p>
          <div className='mt-4 grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl border border-slate-800 bg-slate-950/60 p-4'><p className='font-semibold'>14:37 · Morning Brief manual</p><p className='mt-2 text-sm leading-6 text-slate-400'>Futuros positivos, petróleo e yields recuando, IA recuperando liderança.</p></div>
            <div className='rounded-xl border border-slate-800 bg-slate-950/60 p-4'><p className='font-semibold'>15:00 · Final Pré-Market</p><p className='mt-2 text-sm leading-6 text-slate-400'>Tecnologia manteve liderança antes da abertura e o 10Y ficou abaixo de 5%.</p></div>
            <div className='rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4'><p className='font-semibold text-cyan-300'>22:25 · After Close</p><p className='mt-2 text-sm leading-6 text-slate-300'>Nasdaq +2,26%, S&P +1,49%; petróleo -4,35% e tecnologia liderou.</p></div>
          </div>
        </section>

        <section className='mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Fechamento em 30 segundos</p>
          <div className='mt-5 grid grid-cols-2 gap-3 md:grid-cols-3'>
            {snapshot.map(([name, value, change, tone]) => <div key={name} className='rounded-xl border border-slate-800 bg-slate-950/70 p-4'><p className='text-xs text-slate-500'>{name}</p><p className='mt-2 text-xl font-semibold text-white'>{value}</p><p className='mt-1 text-sm font-semibold text-slate-300'>{change}</p><div className='mt-2'><Tone tone={tone} /></div></div>)}
          </div>
        </section>

        <section className='mb-6 grid gap-4 lg:grid-cols-3'>
          {[
            ['01', 'Tecnologia confirmou a liderança', 'Nasdaq +2,26% e Nasdaq-100 +2,83%. Technology subiu 2,76% e Communication Services 3,56%.', 'Por que importa: o movimento pré-market não só se manteve como ganhou força durante o pregão.'],
            ['02', 'Petróleo virou alívio macro', 'WTI fechou em US$ 91,90, queda de 4,35%, e Brent recuou 3,75%.', 'Por que importa: energia mais barata reduz parte da pressão inflacionária que vinha elevando yields e comprimindo valuations.'],
            ['03', 'Treasury abaixo de 5%', 'O Treasury de 10 anos terminou em 4,96%, enquanto títulos de maior duração avançaram.', 'Por que importa: yields menores reduziram a pressão sobre ações de crescimento e favoreceram o rally de tecnologia.'],
          ].map(([n,title,body,why]) => <article key={n} className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-3xl font-semibold text-cyan-400'>{n}</p><h2 className='mt-4 text-2xl font-semibold'>{title}</h2><p className='mt-3 text-sm leading-7 text-slate-300'>{body}</p><p className='mt-4 border-t border-slate-800 pt-4 text-sm font-medium text-slate-200'>{why}</p></article>)}
        </section>

        <section className='mb-6 rounded-2xl border border-cyan-900/50 bg-cyan-950/10 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>O que mudou durante o pregão</p>
          <h2 className='mt-2 text-2xl font-semibold'>O cenário do pré-market foi confirmado — e ampliado</h2>
          <p className='mt-4 text-sm leading-7 text-slate-300'>Na abertura, a tese era IA forte + petróleo em queda + Treasury abaixo de 5%. No fechamento, os três elementos continuaram presentes: tecnologia terminou como uma das lideranças, energia foi o pior setor do S&P 500 e o 10Y permaneceu em 4,96%. O Nasdaq Composite fechou em novo recorde.</p>
        </section>

        <section className='mb-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]'>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Setores e temas</p>
            <h2 className='mt-2 text-2xl font-semibold'>Growth venceu; energia ficou para trás</h2>
            <div className='mt-5 grid gap-3 sm:grid-cols-2'>
              {[
                ['Communication Services', '+3,56%', 'Liderança entre os setores.'],
                ['Technology', '+2,76%', 'Semicondutores e IA sustentaram o rally.'],
                ['Consumer Discretionary', '+1,08%', 'Participou da alta, mas atrás de tech.'],
                ['Energy', '-2,89%', 'Pressionada pela queda do petróleo.'],
                ['Consumer Staples', '-1,06%', 'Defensivos ficaram para trás.'],
                ['Utilities', '-1,07%', 'Também perdeu força em sessão risk-on.'],
              ].map(([name,value,body]) => <div key={name} className='rounded-xl border border-slate-800 bg-slate-950/60 p-4'><p className='text-sm font-semibold'>{name}</p><p className={'mt-2 text-xl font-semibold ' + (value.startsWith('-') ? 'text-rose-400' : 'text-emerald-400')}>{value}</p><p className='mt-2 text-xs leading-5 text-slate-400'>{body}</p></div>)}
            </div>
          </div>
          <aside className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Brasil → EUA</p>
            <h2 className='mt-2 text-2xl font-semibold'>USD/BRL 5,11</h2>
            <p className='mt-2 text-lg font-semibold text-emerald-400'>-0,71%</p>
            <p className='mt-4 text-sm leading-7 text-slate-400'>O real se fortaleceu frente ao dólar no dia. Para o brasileiro com ativos dolarizados, a queda do USD/BRL reduz parte do ganho em reais quando o patrimônio é convertido para BRL, mesmo com as bolsas americanas em alta.</p>
          </aside>
        </section>

        <section className='mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Movers do dia</p>
          <div className='mt-5 divide-y divide-slate-800'>{movers.map(([ticker,change,why]) => <div key={ticker} className='grid gap-2 py-4 md:grid-cols-[130px_120px_1fr] md:items-center'><strong>{ticker}</strong><span className='font-semibold text-slate-200'>{change}</span><span className='text-sm leading-6 text-slate-400'>{why}</span></div>)}</div>
          <p className='mt-4 text-xs leading-5 text-slate-500'>Movimentos individuais são apresentados de forma aproximada quando a fonte consultada não fornece um fechamento oficial consolidado no mesmo snapshot.</p>
        </section>

        <section className='mb-6 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Earnings After Close</p>
            <h2 className='mt-2 text-xl font-semibold'>Agenda limitada</h2>
            <p className='mt-4 text-sm leading-7 text-slate-400'>O calendário corporativo consultado lista AnaptysBio (ANAB) às 22:00 Madrid. Não há uma mega-cap confirmada como catalisador central do after-hours desta segunda.</p>
          </div>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Amanhã no radar · 22/09</p>
            <h2 className='mt-2 text-xl font-semibold'>Earnings ganham espaço</h2>
            <p className='mt-4 text-sm leading-7 text-slate-400'>O calendário consultado não retornou eventos econômicos dos EUA classificados como HIGH/MEDIUM para terça-feira. Entre os resultados: MillerKnoll às 14:30 Madrid, Thor Industries às 15:30, AutoZone às 16:00 e KB Home às 23:00.</p>
          </div>
        </section>

        <section className='mb-6 rounded-2xl border border-cyan-900/50 bg-cyan-950/10 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Bottom line</p>
          <h2 className='mt-2 text-2xl font-semibold'>O que aconteceu hoje?</h2>
          <p className='mt-4 text-sm leading-7 text-slate-300'>Wall Street teve uma sessão claramente risk-on: petróleo e yields recuaram, tecnologia ampliou os ganhos e o Nasdaq renovou máxima histórica. A força foi concentrada em growth, enquanto energia e setores defensivos ficaram para trás.</p>
          <h2 className='mt-6 text-2xl font-semibold'>O que importa para amanhã?</h2>
          <p className='mt-4 text-sm leading-7 text-slate-300'>A continuidade depende principalmente de o Treasury 10Y permanecer abaixo de 5%, de o petróleo não devolver a queda e de o momentum em semicondutores sobreviver ao forte movimento desta segunda. AutoZone é um dos resultados relevantes da terça-feira.</p>
        </section>

        <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <h2 className='text-xl font-semibold'>Fontes e atualização</h2>
          <div className='mt-4 space-y-2 text-sm leading-6 text-slate-400'>
            <p>Índices, setores, yields, commodities, cripto e câmbio: Bigdata.com Market Tearsheet / FMP, snapshot de 21/09/2026 às 20:23 UTC.</p>
            <p>Contexto de fechamento: Associated Press via Bigdata.com, publicada após o fechamento.</p>
            <p>Movers e narrativa de semicondutores: fontes financeiras agregadas pelo Bigdata.com; valores individuais aproximados quando indicado.</p>
            <p>Agenda de 22/09: Bigdata.com Economic Calendar e Corporate Calendar.</p>
            <p className='pt-2 text-xs text-slate-500'>Conteúdo informativo e educacional. Não constitui recomendação individual de investimento.</p>
          </div>
        </section>

        <section className='mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><h2 className='text-xl font-semibold'>Arquivo de análises</h2><div className='mt-4 flex flex-wrap gap-3'>{['260921','260918','260917'].map(code => <a key={code} href={'?' + code} className='rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500'>?{code}</a>)}</div></section>
        <footer className='mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500'>PrimeSphere Intelligence · Wall Street explicado em português para o investidor brasileiro.</footer>
      </div>
    </main>
  );
}

export default Edition260921;
