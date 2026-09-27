const pulse = [
  ['Nasdaq-100', '30.732,40 · +0,82%'],
  ['S&P 500', 'alta moderada · perto do recorde'],
  ['Dow', 'fechamento misto / abaixo do Nasdaq'],
  ['US 10Y', '4,966%'],
  ['WTI', 'queda pelo 5º dia'],
  ['Bitcoin', 'acima de US$ 84 mil'],
];

const movers = [
  ['Tecnologia / IA', '↑', 'Nasdaq renovou recorde, com liderança de tecnologia e IA.'],
  ['Bancos', '↓', 'Financeiras ficaram sob pressão e limitaram o Dow durante a sessão.'],
  ['Energia', '↓', 'Petróleo mais fraco pressionou o complexo de energia.'],
  ['Homebuilders / varejo', '↑', 'Grupos domésticos apareceram entre os bolsões de força fora de tecnologia.'],
  ['DGX / LH', '↓', 'Diagnósticos seguiram pressionados após proposta preliminar do CMS para reembolsos laboratoriais.'],
];

function Edition260922() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12'>
        <header className='mb-8 border-b border-slate-800 pb-7'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400'>PrimeSphere Intelligence</p>
          <h1 className='mt-3 text-4xl font-semibold md:text-6xl'>AFTER CLOSE</h1>
          <p className='mt-3 text-xl text-slate-300'>Fechamento de Wall Street · 22/09/2026</p>
          <div className='mt-5 inline-block rounded-xl border border-cyan-900/60 bg-cyan-950/20 px-4 py-3 text-sm'>
            <strong className='text-cyan-300'>Atualizado após o fechamento · Madrid</strong>
            <p className='mt-1 text-slate-400'>Sessão regular encerrada às 22:00 Madrid</p>
          </div>
          <p className='mt-5 max-w-4xl text-sm leading-7 text-slate-400 md:text-base'>Wall Street terminou com liderança clara de tecnologia: o Nasdaq renovou máximas, enquanto o restante do mercado ficou mais misto. Petróleo caiu novamente e o Treasury de 10 anos terminou em 4,966%, mantendo o debate entre alívio energético e juros ainda altos.</p>
          <div className='mt-6 grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl border border-slate-800 bg-slate-900/50 p-4'><p className='font-semibold'>12:30 Madrid · Morning Brief</p><p className='mt-2 text-sm text-slate-400'>IA forte, petróleo e juros no centro da leitura macro.</p></div>
            <div className='rounded-xl border border-slate-800 bg-slate-900/50 p-4'><p className='font-semibold'>15:00 Madrid · Final Pré-Market</p><p className='mt-2 text-sm text-slate-400'>Petróleo e 10Y recuavam; futuros chegavam mais equilibrados à abertura.</p></div>
            <div className='rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4'><p className='font-semibold text-cyan-300'>After Close · Madrid</p><p className='mt-2 text-sm text-slate-300'>Nasdaq confirmou liderança e fechou em novo recorde; energia e bancos ficaram mais fracos.</p></div>
          </div>
        </header>

        <section className='mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Fechamento em 30 segundos</p>
          <div className='mt-5 grid grid-cols-2 gap-3 md:grid-cols-3'>{pulse.map(([a, b]) => <div key={a} className='rounded-xl border border-slate-800 bg-slate-950/70 p-4'><p className='text-xs text-slate-500'>{a}</p><p className='mt-2 text-lg font-semibold'>{b}</p></div>)}</div>
          <div className='mt-5 rounded-xl border border-cyan-900/50 bg-cyan-950/15 p-4 text-sm leading-6 text-slate-300'><strong className='text-white'>Leitura:</strong> tecnologia ganhou a sessão, mas a participação foi desigual. Nasdaq-100 fechou em 30.732,40, +0,82%, enquanto bancos e energia limitaram a amplitude do movimento. Números de S&P 500, Dow, Russell 2000, VIX, ouro e USD/BRL não são exibidos quando não há confirmação suficientemente recente no corte.</div>
        </section>

        <section className='mb-6 grid gap-4 lg:grid-cols-3'>
          {[
            ['01', 'Tecnologia sustentou o índice', 'Nasdaq-100 +0,82% e novo recorde, com ações ligadas a IA novamente entre as líderes.', 'Impacto: o apetite por growth continua forte, mas a concentração da alta merece atenção.'],
            ['02', 'Petróleo caiu novamente', 'WTI estendeu a queda pelo quinto dia em meio a sinais de possível avanço diplomático envolvendo EUA e Irã.', 'Impacto: petróleo mais baixo reduz pressão inflacionária marginal e pesa sobre energia.'],
            ['03', 'Juros seguem perto de 5%', 'Treasury de 10 anos terminou em 4,966%, ainda em nível elevado apesar do alívio observado em parte do dia.', 'Impacto: yields altos continuam sendo o principal contrapeso para valuations de tecnologia.'],
          ].map(([n, t, b, i]) => <article key={n} className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-3xl font-semibold text-cyan-400'>{n}</p><h2 className='mt-4 text-2xl font-semibold'>{t}</h2><p className='mt-3 text-sm leading-7 text-slate-300'>{b}</p><p className='mt-4 border-t border-slate-800 pt-4 text-sm text-slate-200'>{i}</p></article>)}
        </section>

        <section className='mb-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]'>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Setores e movers do dia</p>
            <h2 className='mt-2 text-2xl font-semibold'>Liderança estreita, mas suficiente para novo recorde</h2>
            <div className='mt-5 divide-y divide-slate-800'>{movers.map(([a, b, c]) => <div key={a} className='grid gap-2 py-4 md:grid-cols-[180px_60px_1fr]'><strong>{a}</strong><span className='text-cyan-300'>{b}</span><span className='text-sm leading-6 text-slate-400'>{c}</span></div>)}</div>
          </div>
          <aside className='space-y-6'>
            <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Dados / macro</p><h2 className='mt-2 text-xl font-semibold'>Mercado voltou ao eixo juros + petróleo</h2><p className='mt-4 text-sm leading-7 text-slate-400'>A sessão teve petróleo mais fraco, Treasury de 10 anos em 4,966% no fechamento e continuidade do debate sobre política monetária. Não atribuímos a alta das ações a um único dado econômico quando a causalidade não está confirmada.</p></div>
            <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Earnings After Close</p><h2 className='mt-2 text-xl font-semibold'>Sem mega cap validada como evento dominante</h2><p className='mt-4 text-sm leading-7 text-slate-400'>A busca de fechamento não confirmou resultado after-hours de mega cap com relevância suficiente para dominar a edição. Mantemos o bloco sem preencher nomes por estimativa.</p></div>
          </aside>
        </section>

        <section className='mb-6 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>O que mudou durante o pregão</p><h2 className='mt-2 text-2xl font-semibold'>O Nasdaq confirmou o que o pré-market não mostrava</h2><p className='mt-4 text-sm leading-7 text-slate-400'>Às 15:00 Madrid, o Nasdaq-100 futuro estava praticamente estável. No fechamento, o índice terminou +0,82% e em novo recorde. A sessão, portanto, evoluiu de uma abertura equilibrada para uma liderança mais clara de tecnologia.</p></div>
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Brasil → EUA</p><h2 className='mt-2 text-2xl font-semibold'>USD/BRL sem cotação confirmada no corte</h2><p className='mt-4 text-sm leading-7 text-slate-400'>Não exibimos número de USD/BRL porque a busca de fechamento não retornou cotação suficientemente recente e verificável. Para o investidor brasileiro, a variação cambial continua alterando o retorno em reais mesmo quando o ativo americano não muda em dólares.</p></div>
        </section>

        <section className='mb-6 rounded-2xl border border-cyan-900/50 bg-cyan-950/10 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Amanhã no radar</p>
          <div className='mt-5 grid gap-3 md:grid-cols-4'>
            {[
              ['US 10Y', '4,966%', 'A proximidade de 5% continua crítica para growth e valuations.'],
              ['Nasdaq-100', '30.732,40', 'Observar se o novo recorde atrai continuidade ou realização.'],
              ['Petróleo', '5º dia de queda', 'Qualquer mudança nas negociações EUA–Irã pode inverter rapidamente o movimento.'],
              ['Amplitude', 'Tech > mercado amplo', 'Checar se bancos, small caps e setores cíclicos passam a acompanhar a alta.'],
              ['IA', 'liderança mantida', 'A sustentabilidade do rali depende de a força deixar de ficar concentrada em poucos nomes.'],
            ].map(([a, b, c]) => <div key={a} className='rounded-xl border border-slate-800 bg-slate-950/60 p-4'><p className='text-xs text-slate-500'>{a}</p><p className='mt-2 font-semibold'>{b}</p><p className='mt-3 text-xs leading-5 text-slate-400'>{c}</p></div>)}
          </div>
        </section>

        <section className='mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400'>Conclusão PrimeSphere</p>
          <h2 className='mt-2 text-2xl font-semibold'>O que aconteceu hoje?</h2>
          <p className='mt-4 text-sm leading-7 text-slate-300'>Tecnologia voltou a liderar e levou o Nasdaq a novo recorde, enquanto petróleo caiu e bancos ficaram para trás. O 10Y perto de 5% impediu que o pano de fundo macro se tornasse totalmente favorável.</p>
          <h2 className='mt-6 text-2xl font-semibold'>O que já importa para amanhã?</h2>
          <p className='mt-4 text-sm leading-7 text-slate-300'>A combinação entre continuidade da IA, Treasury perto de 5%, petróleo em queda e amplitude estreita. Se a alta se espalhar para além de tecnologia, o sinal melhora; se yields voltarem acima de 5%, o risco para growth aumenta.</p>
        </section>

        <section className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8'>
          <h2 className='text-xl font-semibold'>Fontes e validação</h2>
          <div className='mt-4 space-y-2 text-sm leading-6 text-slate-400'>
            <p>Bigdata.com: fechamento do Nasdaq-100 em 30.732,40 (+0,82%); notícias de fechamento confirmando novo recorde do Nasdaq e liderança de IA.</p>
            <p>Bigdata.com / Data Talk: Treasury de 10 anos em 4,966% no fechamento.</p>
            <p>Bigdata.com: WTI em queda pelo quinto dia, com notícias relacionando o movimento às expectativas sobre diplomacia EUA–Irã.</p>
            <p>Campos sem confirmação recente suficiente — Russell 2000, VIX, ouro e USD/BRL — foram mantidos sem número em vez de estimados.</p>
            <p className='pt-2 text-xs text-slate-500'>Conteúdo informativo e educacional; não constitui recomendação individual de investimento.</p>
          </div>
        </section>

        <section className='mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6'><h2 className='text-xl font-semibold'>Arquivo de análises</h2><div className='mt-4 flex flex-wrap gap-3'>{['260922', '260921', '260918', '260917'].map(code => <a key={code} href={'?' + code} className='rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500'>?{code}</a>)}</div></section>
        <footer className='mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500'>PrimeSphere Intelligence · Wall Street explicado em português para o investidor brasileiro.</footer>
      </div>
    </main>
  );
}

export default Edition260922;
