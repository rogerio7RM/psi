import MorningBrief from './261005';

const market = [
  ['S&P 500', '7.773,95', '+0,66%'],
  ['Nasdaq', '27.477,31', '+1,05%'],
  ['Dow', '51.267,90', '+0,18%'],
  ['Russell 2000', '2.847,14', '+0,50%'],
  ['VIX', '15,51', '+1,31%'],
  ['US 10Y', '5,31%', 'yield'],
  ['WTI', 'US$ 89,36', '-1,92%'],
  ['Ouro', 'US$ 4.166,30', '+0,10%'],
  ['Bitcoin', 'US$ 85.708', '-0,93%'],
  ['USD/BRL', '4,99', '-4,40%'],
];

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"><h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">{title}</h2><div className="space-y-3 text-base leading-7 text-slate-200">{children}</div></section>;
}

export default function Edition261005AfterClose() {
  return <main className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
    <header className="border-b border-slate-800 pb-7">
      <p className="uppercase tracking-widest text-cyan-400">PrimeSphere Intelligence</p>
      <h1 className="mt-3 text-4xl font-bold md:text-6xl">AFTER CLOSE</h1>
      <p className="mt-3 text-xl">Fechamento · 05/10/2026</p>
      <p className="mt-2 text-cyan-300">Atualizado às 22:16 Madrid · Europe/Madrid (CEST)</p>
      <p className="mt-4 max-w-4xl text-lg leading-8">Wall Street fechou em alta nesta segunda-feira, com o Nasdaq em novo recorde. Megacaps de tecnologia avançaram, o petróleo caiu e o ISM Services mostrou atividade ainda em expansão, porém com preços pagos mais fortes. O Treasury de 10 anos em 5,31% continua sendo o principal contraponto à alta das ações.</p>
    </header>

    <Box title="Timeline editorial de hoje">
      <p><strong>12:26 Madrid · Morning Brief:</strong> futuros perto da estabilidade, ISM Services no centro da agenda e 10Y acima de 5,2%.</p>
      <p><strong>22:16 Madrid · After Close:</strong> Nasdaq em recorde, índices positivos, WTI abaixo de US$ 90 e ISM de setembro confirmado.</p>
      <p className="text-xs text-slate-500">Não existe arquivo Final Pré-Market de 05/10 no repositório; nenhuma atualização intermediária foi fabricada.</p>
    </Box>

    <Box title="Fechamento em 30 segundos">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{market.map(([name,value,change])=><div key={name} className="rounded-xl bg-slate-950 p-4"><p className="text-sm text-slate-400">{name}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className={'mt-1 text-sm font-semibold '+(change.startsWith('+')?'text-emerald-400':change.startsWith('-')?'text-rose-400':'text-slate-400')}>{change}</p></div>)}</div>
      <p className="text-xs text-slate-400">Snapshot Bigdata.com após o fechamento. Reuters reportou S&P 500 +0,67%, Nasdaq +1,06% e Dow +0,18%; pequenas diferenças refletem horário/fonte do corte.</p>
    </Box>

    <div className="grid gap-4 md:grid-cols-3">
      <Box title="01 · Nasdaq renova recorde"><p><strong>NÚMERO/FATO:</strong> Nasdaq +1,05% no snapshot Bigdata; Reuters confirmou fechamento recorde, com Nvidia e Microsoft entre os suportes.</p><p><strong>IMPACTO:</strong> tecnologia sustentou o risco mesmo com o Treasury de 10 anos em 5,31%.</p></Box>
      <Box title="02 · ISM desacelera, preços sobem"><p><strong>NÚMERO/FATO:</strong> ISM Services 54,9 vs. 55,0 consenso e 55,4 anterior; emprego 50,1 e preços pagos 74,0.</p><p><strong>IMPACTO:</strong> expansão um pouco mais lenta, mas preços fortes mantêm o risco inflacionário e os yields elevados.</p></Box>
      <Box title="03 · Petróleo cai"><p><strong>NÚMERO/FATO:</strong> WTI US$ 89,36 (-1,92%) no corte Bigdata.</p><p><strong>IMPACTO:</strong> energia mais barata oferece contraponto à alta de preços do ISM e alivia marginalmente a pressão de custos.</p></Box>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <Box title="Setores e temas">
        <p><strong>Materiais:</strong> +1,31% · <strong>Comunicação:</strong> +1,17% · <strong>Energia:</strong> +0,99% · <strong>Financeiro:</strong> +0,73%.</p>
        <p><strong>Saúde:</strong> +0,72% · <strong>Tecnologia:</strong> +0,56% · <strong>Consumo discricionário:</strong> +0,35% · <strong>Industriais:</strong> +0,09%.</p>
      </Box>

      <Box title="Movers · catalisadores confirmados">
        <p><strong>PTC:</strong> Reuters registrou +34,6% intraday após a Schneider Electric anunciar aquisição em dinheiro avaliada em US$ 22,6 bilhões.</p>
        <p><strong>RXO:</strong> cerca de +22,5% intraday após acordo de compra pela C.H. Robinson por US$ 5,8 bilhões; C.H. Robinson caiu cerca de 11,8% no mesmo recorte.</p>
        <p><strong>Cerebras Systems:</strong> cerca de +9,5% intraday após comentário público de Sam Altman sobre a parceria com a empresa.</p>
        <p><strong>Nvidia e Microsoft:</strong> Reuters apontou ambas como suportes do recorde do Nasdaq; não usamos percentual de fechamento sem confirmação equivalente no corte.</p>
      </Box>

      <Box title="Dados econômicos e reação observável">
        <p><strong>S&P Global Composite PMI:</strong> 58,4, em linha com consenso e anterior.</p>
        <p><strong>ISM Services:</strong> 54,9 vs. 55,0 consenso e 55,4 anterior.</p>
        <p><strong>ISM Employment:</strong> 50,1 vs. 47,8 anterior. <strong>New Orders:</strong> 59,8 vs. 60,9. <strong>Prices Paid:</strong> 74,0 vs. 72,6.</p>
        <p>A atividade veio ligeiramente abaixo do esperado, mas os yields permaneceram elevados. A leitura de preços mais forte impede tratar o dado como desinflacionário de forma simples.</p>
      </Box>

      <Box title="Earnings After Close">
        <p>Não foi identificado balanço pós-fechamento de grande capitalização relevante no calendário corporativo Bigdata para 05/10. O evento confirmado do dia foi Ennis (EBF), com call às 12:00 UTC, fora do bloco after close.</p>
      </Box>

      <Box title="Próximo pregão · terça-feira, 06/10">
        <p><strong>14:15 Madrid:</strong> ADP Employment Change — média de 4 semanas; anterior 20 mil.</p>
        <p><strong>15:05 Madrid:</strong> discurso de John Williams, do Fed. <strong>16:45 Madrid:</strong> discurso de Michelle Bowman, do Fed.</p>
        <p><strong>US 10Y:</strong> acompanhar se 5,31% começa a limitar a liderança de tecnologia.</p>
        <p><strong>Earnings/calls:</strong> Lamb Weston, Apogee, RPM, Neogen e Penguin Solutions aparecem confirmadas no calendário Bigdata de 06/10.</p>
      </Box>

      <Box title="Brasil → EUA">
        <p className="text-3xl font-bold">USD/BRL 4,99 <span className="text-xl text-emerald-400">-4,40%</span></p>
        <p>O real teve forte valorização no snapshot Bigdata. Para o investidor brasileiro, a queda do dólar reduz o retorno convertido para reais de ativos americanos, mantidas as demais variáveis constantes.</p>
      </Box>
    </div>

    <Box title="Conclusão do fechamento">
      <p><strong>O que aconteceu hoje?</strong> O Nasdaq renovou máxima de fechamento com apoio de megacaps; S&P 500, Dow e Russell também avançaram. O ISM confirmou expansão dos serviços, mas com preços pagos mais altos, enquanto o petróleo caiu abaixo de US$ 90.</p>
      <p><strong>O que importa para a próxima sessão?</strong> Treasury de 10 anos em 5,31%, falas do Fed e continuidade da liderança de tecnologia serão os testes centrais de terça-feira.</p>
    </Box>

    <Box title="Fontes e método">
      <p>Bigdata.com / Financial Modeling Prep: índices, setores, Treasury 10Y, WTI, ouro, Bitcoin e USD/BRL. Calendários Bigdata.com: ISM, PMI, agenda macro e calls. Reuters via Bigdata.com: fechamento, megacaps, M&A e movers.</p>
      <p className="text-xs text-slate-400">Dados de mercado em snapshot. Fato e interpretação editorial são separados. Material informativo e educacional; não constitui recomendação individual de investimento.</p>
    </Box>

    <details className="rounded-2xl border border-slate-700 bg-slate-900/60"><summary className="cursor-pointer p-5 text-lg font-semibold text-cyan-300">Consultar Morning Brief original de 12:26 Madrid</summary><MorningBrief /></details>
  </div></main>;
}
