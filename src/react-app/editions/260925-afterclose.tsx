import FinalPremarket from './260925-final';

const market = [
  ['S&P 500', '7.743,41', '+0,51%'],
  ['Nasdaq', '27.068,72', '+0,48%'],
  ['Dow', '51.828,62', '+0,93%'],
  ['Russell 2000', '2.837,55', '+0,07%'],
  ['VIX', '14,90', '-4,91%'],
  ['US 10Y', '5,17%', 'yield'],
  ['WTI', 'US$ 92,66', '-2,06%'],
  ['Ouro', 'US$ 4.327,40', '+0,68%'],
  ['Bitcoin', 'US$ 83.989,66', '-0,46%'],
  ['USD/BRL', '5,18', '-0,01%'],
];
const sectors = [
  ['Industriais (XLI)', '+0,94%'],
  ['Tecnologia (XLK)', '+0,79%'],
  ['Financeiro (XLF)', '+0,57%'],
  ['Saúde (XLV)', '+0,50%'],
  ['Comunicação (XLC)', '-0,93%'],
  ['Energia (XLE)', '-0,86%'],
];
const drivers = [
  ['01', 'Petróleo devolve parte da alta', 'WTI US$ 92,66 (-2,06%); Brent US$ 104,49 (-1,98%) no corte Bigdata/FMP.', 'A queda ajudou a aliviar o receio de nova pressão inflacionária. O noticiário da AP relacionou a sessão às perspectivas de normalização do fluxo pelo Estreito de Hormuz, ainda incertas.'],
  ['02', 'Juros oscilam após Michigan', 'US 10Y em 5,17% no fechamento indicativo do Bigdata/FMP; a AP registrou pico intradiário próximo de 5,22%.', 'A pesquisa apontou expectativas de inflação de 4,6% em um ano. Juros longos elevados continuam sendo um limite para a valorização das ações.'],
  ['03', 'Ações encerram semana em recuperação', 'S&P 500 +0,51%; Dow +0,93%; Nasdaq +0,48%.', 'Segundo a AP, o alívio do petróleo e resultados corporativos deram suporte à sessão. Tecnologia e industriais avançaram; energia e comunicação ficaram para trás.'],
];
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-7'>
      <h2 className='text-xs font-bold uppercase tracking-[0.18em] text-cyan-400'>{title}</h2>
      <div className='mt-4'>{children}</div>
    </section>
  );
}
export default function AfterClose260925() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-6xl space-y-5 px-4 py-8 md:px-8 md:py-12'>
        <header className='border-b border-slate-800 pb-7'>
          <p className='text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400'>PrimeSphere Intelligence · 25/09/2026</p>
          <h1 className='mt-3 text-4xl font-bold md:text-6xl'>AFTER CLOSE</h1>
          <p className='mt-4 text-base font-semibold text-cyan-200'>Dados validados até 22:20 Madrid (CEST) · 16:20 Nova York (EDT)</p>
          <p className='mt-4 max-w-4xl text-base leading-8 text-slate-300'>Wall Street recuperou terreno e fechou em alta após o recuo do petróleo. O mercado de títulos continuou sensível às expectativas de inflação: o Treasury de 10 anos chegou perto de 5,22% durante a sessão, mas o snapshot pós-fechamento marcou 5,17%. Commodities, cripto e câmbio continuam negociando após o sino.</p>
        </header>
        <Section title='Timeline editorial · mesma edição'>
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-4'>
              <p className='font-semibold'>12:34 Madrid · Morning Brief</p>
              <p className='mt-2 text-sm leading-6 text-slate-400'>Futuros positivos e IA em foco, com petróleo e juros longos como contrapeso.</p>
            </div>
            <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-4'>
              <p className='font-semibold'>15:15 Madrid · Final Pré-Market</p>
              <p className='mt-2 text-sm leading-6 text-slate-400'>Bens duráveis divulgados; foco na notícia sobre Hormuz e na abertura de Wall Street.</p>
            </div>
            <div className='rounded-xl border border-cyan-700 bg-cyan-950/40 p-4'>
              <p className='font-semibold text-cyan-200'>22:20 Madrid · After Close</p>
              <p className='mt-2 text-sm leading-6 text-slate-300'>Índices em alta, petróleo em queda e dispersão setorial. Dados de mercado até o corte indicado.</p>
            </div>
          </div>
        </Section>
        <Section title='Fechamento em 30 segundos'>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
            {market.map(([name, price, change]) => (
              <div key={name} className='rounded-xl border border-slate-800 bg-slate-950/80 p-4'>
                <p className='text-xs text-slate-400'>{name}</p>
                <p className='mt-2 break-words text-xl font-bold'>{price}</p>
                <p className={'mt-1 text-sm font-semibold ' + (change.startsWith('+') ? 'text-emerald-400' : change.startsWith('-') ? 'text-rose-400' : 'text-slate-400')}>{change}</p>
              </div>
            ))}
          </div>
          <p className='mt-4 text-xs leading-6 text-slate-500'>Fonte: Bigdata.com / Financial Modeling Prep, 25/09/2026, corte 20:20 UTC (22:20 Madrid). O rendimento do Treasury 10Y é uma taxa, não uma variação diária.</p>
        </Section>
        <section className='grid gap-4 lg:grid-cols-3'>
          {drivers.map(([num, title, fact, impact]) => (
            <article key={num} className='rounded-2xl border border-slate-800 bg-slate-900/70 p-6'>
              <span className='text-3xl font-bold text-cyan-400'>{num}</span>
              <h2 className='mt-3 text-xl font-bold'>{title}</h2>
              <p className='mt-4 text-sm leading-7 text-slate-200'><strong>NÚMERO / FATO:</strong> {fact}</p>
              <p className='mt-3 text-sm leading-7 text-slate-300'><strong>LEITURA / IMPACTO:</strong> {impact}</p>
            </article>
          ))}
        </section>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Section title='Setores e temas'>
            <div className='space-y-3'>{sectors.map(([name, change]) => (
              <div className='flex items-center justify-between gap-3 border-b border-slate-800 pb-2 text-sm' key={name}>
                <span>{name}</span><strong className={change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{change}</strong>
              </div>
            ))}</div>
            <p className='mt-4 text-sm leading-7 text-slate-400'>Variações dos ETFs setoriais ao fechamento regular dos EUA. Comunicação e energia recuaram, apesar da alta dos principais índices.</p>
          </Section>
          <Section title='Movers do dia'>
            <div className='space-y-4 text-sm leading-7 text-slate-300'>
              <p><strong className='text-white'>Akamai (AKAM) +3,2%:</strong> a AP destacou o avanço após o anúncio de contrato plurianual de US$ 11,6 bilhões com a Anthropic. A alta de aproximadamente 21% citada no pré-market não deve ser confundida com o fechamento.</p>
              <p><strong className='text-white'>Costco (COST) +2,9%:</strong> reagiu a lucro trimestral acima das estimativas, de acordo com a AP.</p>
              <p><strong className='text-white'>Zscaler (ZS):</strong> Benzinga registrou baixa próxima de 9% no fim da sessão e noticiou a nomeação de Ross Tackett como diretor de receitas. A cotação citada é intradiária, não fechamento validado.</p>
              <p><strong className='text-white'>Scholastic (SCHL):</strong> queda próxima de 8% no levantamento da Benzinga, após resultados trimestrais abaixo das expectativas; a variação é intradiária.</p>
            </div>
          </Section>
          <Section title='Dados econômicos e reação'>
            <div className='space-y-4 text-sm leading-7 text-slate-300'>
              <p><strong className='text-white'>Bens duráveis:</strong> 0,0% ante -0,4% esperado. Ex-transportes +0,3% ante +0,6%; core capex +1,6% ante +0,5%.</p>
              <p><strong className='text-white'>Michigan:</strong> sentimento final 48,1 ante consenso 47,6. Expectativas de inflação para um ano: 4,6%, em linha com o consenso do calendário Bigdata; a AP registrou aumento em relação à leitura de 4,0% do mês anterior.</p>
              <p><strong className='text-white'>Reação observada:</strong> segundo a AP, o 10Y chegou perto de 5,22% após a pesquisa e cedeu durante a tarde. Movimentos de mercado não são atribuídos exclusivamente a um indicador.</p>
            </div>
          </Section>
          <Section title='Earnings After Close'>
            <p className='text-sm leading-7 text-slate-300'>O principal balanço relevante desta edição já foi divulgado: <strong className='text-white'>Costco</strong> apresentou lucro trimestral acima do esperado e suas ações subiram 2,9% na sessão, segundo a AP. Não foram identificados nesta consulta outros resultados pós-fechamento de grande capitalização com números confirmados para reprodução.</p>
          </Section>
          <Section title='Próxima sessão no radar · segunda, 28/09'>
            <ol className='list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-300'>
              <li><strong>16:30 Madrid:</strong> Dallas Fed Manufacturing Index; anterior 11,6, sem consenso validado no calendário.</li>
              <li><strong>17:30 Madrid:</strong> leilões de Treasury Bills de 3 e 6 meses; acompanhar demanda e taxas.</li>
              <li><strong>US 10Y:</strong> observar se os yields permanecem na faixa de 5% após a volatilidade provocada pelos dados de inflação esperada.</li>
              <li><strong>WTI e Hormuz:</strong> acompanhar notícias sobre negociações e eventual normalização do tráfego marítimo.</li>
              <li><strong>IA e balanços:</strong> observar continuidade da reação da Akamai e Costco, distinguindo movimentos intradiários dos fechamentos efetivos.</li>
            </ol>
          </Section>
          <Section title='Brasil → EUA'>
            <p className='text-3xl font-bold'>USD/BRL 5,18 <span className='text-xl text-rose-400'>-0,01%</span></p>
            <p className='mt-4 text-sm leading-7 text-slate-300'>O câmbio ficou praticamente estável no corte do Bigdata/FMP. Para quem investe nos EUA e mede retornos em reais, a variação da carteira em dólares tende a explicar a maior parte da mudança diária, antes de taxas e impostos.</p>
          </Section>
        </div>
        <Section title='Fontes e transparência'>
          <div className='space-y-3 text-sm leading-7 text-slate-300'>
            <p><strong>Mercados:</strong> Bigdata.com / FMP, snapshot de 25/09 às 20:20 UTC. Os números de commodities, Bitcoin e câmbio são indicativos do corte.</p>
            <p><strong>Noticiário:</strong> Associated Press, matéria publicada em 25/09 às 20:19 UTC; Benzinga, matéria de 25/09 às 18:32 UTC. O movimento dos preços e as explicações editoriais são distinguidos.</p>
            <p><strong>Agenda:</strong> calendário econômico Bigdata.com, eventos de 25 a 29/09, convertidos para Europe/Madrid (UTC+2 nesta semana).</p>
            <p><a className='text-cyan-300 underline' href='https://app.bigdata.com/documents/541420A415FB7688BABC3FDA2DF1F012'>Associated Press via Bigdata</a> · <a className='text-cyan-300 underline' href='https://app.bigdata.com/documents/049F21BB47DB9E328F475035D49A766D'>Benzinga via Bigdata</a></p>
            <p className='text-xs text-slate-500'>Material informativo e educacional, não recomendação individual de investimento.</p>
          </div>
        </Section>
        <details className='rounded-2xl border border-slate-700 bg-slate-900/60'>
          <summary className='cursor-pointer p-5 text-lg font-bold text-cyan-300'>Consultar atualizações anteriores de 25/09 (15:15 e 12:34 Madrid)</summary>
          <FinalPremarket />
        </details>
        <nav className='flex flex-wrap gap-2 text-sm' aria-label='Arquivo de edições'>
          {['260925','260924','260923','260922','260921','260918','260917'].map(code => (
            <a key={code} href={'?' + code} className='rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-cyan-500'>{code.slice(4,6) + '/' + code.slice(2,4)}</a>
          ))}
        </nav>
      </div>
    </main>
  );
}
