import MorningBrief from './261002';

const market = [
  ['S&P 500', '7.722,72', '+0,73%'],
  ['Nasdaq', '27.190,86', '+1,19%'],
  ['Dow', '51.176,96', '+0,49%'],
  ['Russell 2000', '2.832,90', '+0,94%'],
  ['VIX', '15,31', '-6,59%'],
  ['US 10Y', '5,28%', 'yield'],
  ['WTI', 'US$ 91,40', '-1,58%'],
  ['Ouro', 'US$ 4.173,00', '-0,70%'],
  ['Bitcoin', 'US$ 84.430', '-0,49%'],
  ['USD/BRL', '5,21', '-0,29%'],
];

const drivers = [
  {
    number: '01',
    title: 'Payroll fraco reduz pressão imediata por alta do Fed',
    fact: 'Payrolls: +29 mil em setembro vs. +90 mil consenso; desemprego 4,2% vs. 4,1% esperado; salários +0,1% m/m e +3,0% a/a.',
    impact: 'A leitura enfraqueceu a tese de novo aperto imediato e ajudou ações de crescimento, embora o Treasury de 10 anos tenha voltado a 5,28% no fim do dia.',
  },
  {
    number: '02',
    title: 'Tecnologia lidera a alta',
    fact: 'Nasdaq +1,19%; XLK +1,03%. HPE avançou cerca de 7%, ON Semiconductor cerca de 6% e Synaptics cerca de 14% no noticiário de fechamento.',
    impact: 'A combinação de menor pressão sobre juros no início da sessão e catalisadores corporativos manteve tecnologia entre os líderes.',
  },
  {
    number: '03',
    title: 'Petróleo recua e reduz pressão inflacionária marginal',
    fact: 'WTI: US$ 91,40 (-1,58%) no corte pós-fechamento.',
    impact: 'Energia mais barata retirou parte do estresse inflacionário que vinha afetando bonds e equities, mas o nível de juros longos continua elevado.',
  },
];

const sectors = [
  ['Consumo discricionário (XLY)', '+1,14%'],
  ['Tecnologia (XLK)', '+1,03%'],
  ['Industriais (XLI)', '+0,78%'],
  ['Materiais (XLB)', '+0,66%'],
  ['Energia (XLE)', '+0,40%'],
  ['Comunicação (XLC)', '+0,35%'],
  ['Saúde (XLV)', '-0,02%'],
];

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-2xl border border-slate-800 bg-slate-900/80 p-6'>
      <h2 className='mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400'>{title}</h2>
      <div className='space-y-3 text-base leading-7 text-slate-200'>{children}</div>
    </section>
  );
}

export default function Edition261002AfterClose() {
  return (
    <main className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-6xl space-y-5 px-4 py-8'>
        <header className='border-b border-slate-800 pb-7'>
          <p className='uppercase tracking-widest text-cyan-400'>PrimeSphere Intelligence</p>
          <h1 className='mt-3 text-4xl font-bold md:text-6xl'>AFTER CLOSE</h1>
          <p className='mt-3 text-xl'>Fechamento · 02/10/2026</p>
          <p className='mt-2 text-cyan-300'>Atualizado às 22:31 Madrid · Europe/Madrid (CEST)</p>
          <p className='mt-4 max-w-4xl text-lg leading-8'>
            Wall Street fechou em alta depois de um payroll bem abaixo do esperado reduzir a pressão por novo aperto imediato do Fed.
            O Nasdaq liderou, o VIX caiu e o petróleo recuou. O Treasury de 10 anos, porém, voltou a 5,28% no corte pós-fechamento,
            mantendo o custo de capital no centro do radar.
          </p>
        </header>

        <Box title='Timeline editorial de hoje'>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='rounded-xl border border-slate-800 bg-slate-950 p-4'>
              <p className='font-semibold'>12:26 Madrid · Morning Brief</p>
              <p className='mt-2 text-sm text-slate-400'>Futuros positivos antes do payroll, com juros e petróleo em queda no início do dia.</p>
            </div>
            <div className='rounded-xl border border-cyan-800 bg-cyan-950/30 p-4'>
              <p className='font-semibold text-cyan-200'>22:31 Madrid · After Close</p>
              <p className='mt-2 text-sm text-slate-300'>Fechamento confirmado com índices em alta e leitura atualizada de emprego, yields, setores e movers.</p>
            </div>
          </div>
          <p className='text-xs text-slate-500'>Não há arquivo Final Pré-Market de 15:00 para 02/10 no repositório; nenhum histórico inexistente foi fabricado.</p>
        </Box>

        <Box title='Fechamento em 30 segundos'>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
            {market.map(([name, value, change]) => (
              <div key={name} className='rounded-xl bg-slate-950 p-4'>
                <p className='text-sm text-slate-400'>{name}</p>
                <p className='mt-2 text-2xl font-semibold'>{value}</p>
                <p className={'mt-1 text-sm font-semibold ' + (change.startsWith('+') ? 'text-emerald-400' : change.startsWith('-') ? 'text-rose-400' : 'text-slate-400')}>{change}</p>
              </div>
            ))}
          </div>
          <p className='text-xs text-slate-400'>Bigdata.com/FMP, corte 20:31 UTC / 22:31 Madrid. Commodities, cripto e câmbio seguem negociando após o fechamento das ações.</p>
        </Box>

        <div className='grid gap-4 md:grid-cols-3'>
          {drivers.map((driver) => (
            <Box key={driver.number} title={driver.number + ' · ' + driver.title}>
              <p><strong>NÚMERO / FATO:</strong> {driver.fact}</p>
              <p><strong>IMPACTO:</strong> {driver.impact}</p>
            </Box>
          ))}
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Box title='Setores e temas'>
            <div className='space-y-2'>
              {sectors.map(([name, change]) => (
                <div key={name} className='flex justify-between gap-4 border-b border-slate-800 pb-2'>
                  <span>{name}</span>
                  <strong className={change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{change}</strong>
                </div>
              ))}
            </div>
            <p className='text-sm text-slate-400'>Todos os grandes setores ficaram positivos ou praticamente estáveis; consumo discricionário e tecnologia lideraram.</p>
          </Box>

          <Box title='Movers do dia · catalisadores confirmados'>
            <p><strong>HPE ~+7%:</strong> alta após upgrade de preço-alvo pela Susquehanna, segundo cobertura de fechamento recuperada pelo Bigdata.</p>
            <p><strong>ON Semiconductor ~+6% / Synaptics ~+14%:</strong> reação ao acordo para aquisição da Synaptics por US$ 123 por ação em dinheiro.</p>
            <p><strong>Seagate e Western Digital ~-10%:</strong> pressão após notícias de que a Toshiba planeja dobrar capacidade de produção de discos rígidos.</p>
            <p><strong>Nike ~-4%:</strong> pressionada por projeções de lucro para 2027 abaixo das expectativas.</p>
            <p className='text-xs text-slate-500'>Percentuais de movers são os valores reportados pela fonte de fechamento e podem diferir alguns décimos do último negócio oficial.</p>
          </Box>

          <Box title='Dados econômicos e reação observável'>
            <p><strong>Payrolls:</strong> +29 mil vs. +90 mil esperado; agosto revisado para +133 mil.</p>
            <p><strong>Desemprego:</strong> 4,2% vs. 4,1% esperado.</p>
            <p><strong>Salários:</strong> +0,1% m/m vs. +0,3% consenso; +3,0% a/a vs. +3,2% consenso.</p>
            <p><strong>Factory Orders:</strong> +0,1% m/m, em linha com o consenso.</p>
            <p>O mercado inicialmente reduziu apostas de aperto e os yields caíram; o 10Y depois devolveu parte do movimento e terminou o corte em 5,28%. Essa é uma reação observada, não uma causalidade única.</p>
          </Box>

          <Box title='Earnings After Close'>
            <p>Não houve balanço pós-fechamento de grande capitalização identificado como relevante para esta edição. O calendário Bigdata registra SU Group Holdings com call às 20:00 UTC, empresa de menor relevância sistêmica.</p>
          </Box>

          <Box title='Próxima sessão · segunda-feira, 05/10'>
            <p><strong>15:45 Madrid:</strong> S&P Global Composite PMI, consenso 58,4; Services PMI, consenso 58,7.</p>
            <p><strong>16:00 Madrid:</strong> ISM Services PMI, consenso 55,7; acompanhar também emprego, novos pedidos e preços pagos.</p>
            <p><strong>US 10Y:</strong> observar se o yield sustenta a região de 5,28% ou retoma a queda vista logo após o payroll.</p>
            <p><strong>Petróleo:</strong> acompanhar o WTI após a queda desta sexta e os desdobramentos geopolíticos.</p>
            <p><strong>Tecnologia:</strong> verificar continuidade da liderança após Nasdaq +1,19%.</p>
          </Box>

          <Box title='Brasil → EUA'>
            <p className='text-3xl font-bold'>USD/BRL 5,21 <span className='text-xl text-emerald-400'>-0,29%</span></p>
            <p>O real ganhou terreno no corte do dia. Para uma carteira americana medida em reais, o câmbio reduziu marginalmente o retorno convertido, mantidas as demais variáveis constantes.</p>
          </Box>
        </div>

        <Box title='Conclusão do fechamento'>
          <p><strong>O que aconteceu hoje?</strong> Payroll e salários mais fracos aliviaram a preocupação com nova alta imediata do Fed e favoreceram ações, especialmente tecnologia, enquanto petróleo e VIX recuaram.</p>
          <p><strong>O que já importa para a próxima sessão?</strong> ISM Services, comportamento do Treasury de 10 anos e a continuidade da liderança do Nasdaq serão os principais testes na segunda-feira.</p>
        </Box>

        <Box title='Fontes e método'>
          <p>Bigdata.com / Financial Modeling Prep: índices, setores, Treasury 10Y, WTI, ouro, Bitcoin e USD/BRL. Calendário econômico Bigdata.com: payroll, desemprego, salários, Factory Orders e agenda de 05/10. Noticiário recuperado pelo Bigdata.com para os drivers e movers.</p>
          <p className='text-xs text-slate-400'>Dados de mercado em snapshot. Fato e interpretação editorial são separados. Material informativo e educacional; não constitui recomendação individual de investimento.</p>
        </Box>

        <details className='rounded-2xl border border-slate-700 bg-slate-900/60'>
          <summary className='cursor-pointer p-5 text-lg font-semibold text-cyan-300'>Consultar Morning Brief original de 12:26 Madrid</summary>
          <MorningBrief />
        </details>
      </div>
    </main>
  );
}
