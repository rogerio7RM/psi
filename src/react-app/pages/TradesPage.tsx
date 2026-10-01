import { useEffect, useMemo, useState } from 'react';
import './TradesPage.css';

type AccountCode = 'RM' | 'EB' | 'DC';
type TradeStatus = 'closed' | 'open';

type Trade = {
  sourceRow: number;
  date: string | null;
  asset: string;
  strike: string;
  quantity: number;
  strategy: string;
  rawAmount: number;
  status: TradeStatus;
};
type Snapshot = {
  schemaVersion: number;
  source: string;
  sourceModifiedAt: string;
  syncedAt: string;
  currencyAssumption: string;
  rows: Trade[];
};
type FlowFilter = 'todos' | 'entradas' | 'custos';
type PeriodFilter = 'day' | 'week' | 'mtd' | 'ytd';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const showCash = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '') + '$' + number.format(Math.abs(value));
const showDate = (date: string | null) => date ? date.slice(8, 10) + '/' + date.slice(5, 7) + '/' + date.slice(2, 4) : 'Sem data';
const formatUpdate = (iso: string) => {
  if (!iso) return 'Não disponível';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? iso : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }).format(date) + ' (Nova York)';
};

const todayInNewYork = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
};
const shiftIsoDate = (iso: string, days: number) => {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const periodBounds = (period: PeriodFilter) => {
  const today = todayInNewYork();
  if (period === 'day') return { from: today, to: today, label: 'Operações de hoje' };
  if (period === 'week') {
    const [year, month, day] = today.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return { from: shiftIsoDate(today, -((weekday + 6) % 7)), to: today, label: 'Semana' };
  }
  if (period === 'mtd') return { from: today.slice(0, 8) + '01', to: today, label: 'MTD' };
  return { from: today.slice(0, 4) + '-01-01', to: today, label: 'YTD' };
};

function CashChart({ rows }: { rows: Trade[] }) {
  const daily = useMemo(() => {
    const byDate = new Map<string, number>();
    rows.forEach(row => { if (row.date) byDate.set(row.date, (byDate.get(row.date) ?? 0) - row.rawAmount); });
    let cumulative = 0;
    return [...byDate].sort((a, b) => a[0].localeCompare(b[0])).map(([date, amount]) => ({ date, amount, total: cumulative += amount }));
  }, [rows]);

  if (!daily.length) return <p className='trades-muted'>O gráfico aparecerá quando existirem lançamentos com data.</p>;
  const vals = daily.map(p => p.total);
  const low = Math.min(0, ...vals);
  const high = Math.max(0, ...vals);
  const spread = Math.max(1, high - low);
  const min = low - spread * 0.13;
  const max = high + spread * 0.13;
  const x = (i: number) => 53 + (i / Math.max(1, daily.length - 1)) * 708;
  const y = (v: number) => 209 - ((v - min) / (max - min)) * 186;
  const line = daily.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(p.total).toFixed(1)).join(' ');
  const area = line + ' L' + x(daily.length - 1) + ',209 L53,209 Z';
  const labels = daily.map((_, i) => i).filter(i => i === 0 || i === daily.length - 1 || i % Math.max(1, Math.ceil(daily.length / 5)) === 0);
  return (
    <div className='trades-chart-wrap'>
      <svg viewBox='0 0 800 252' role='img' aria-label='Fluxo de caixa acumulado por dia. Não representa lucro realizado.' preserveAspectRatio='xMidYMid meet'>
        <defs><linearGradient id='trades-area' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stopColor='#35d4ed' stopOpacity='.32'/><stop offset='1' stopColor='#35d4ed' stopOpacity='0'/></linearGradient></defs>
        {[0, 1, 2, 3, 4].map(i => {
          const value = min + ((max - min) / 4) * i;
          return <g key={i}><line x1='53' x2='761' y1={y(value)} y2={y(value)} stroke='#31465c' strokeDasharray='4 7' /><text x='46' y={y(value) + 4} textAnchor='end' fill='#91a7c3' fontSize='12'>{Math.round(value).toLocaleString('pt-BR')}</text></g>;
        })}
        <path d={area} fill='url(#trades-area)' />
        <path d={line} fill='none' stroke='#44d8f1' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
        {daily.map((point, i) => (i === daily.length - 1 || i === 0 || point.amount < -1000) ? <circle key={point.date} cx={x(i)} cy={y(point.total)} r='4' fill='#47d9f0' stroke='#0e1b2c' strokeWidth='2'><title>{showDate(point.date) + ': ' + showCash(point.total)}</title></circle> : null)}
        {labels.map(i => <text key={i} x={x(i)} y='239' textAnchor='middle' fill='#90a5c0' fontSize='12'>{daily[i].date.slice(8,10) + '/' + daily[i].date.slice(5,7)}</text>)}
      </svg>
    </div>
  );
}

export default function TradesPage({ account = 'RM' }: { account?: AccountCode }) {
  const dataPath = `/api/content/trades/${account.toLowerCase()}`;
  const hiddenAccount = account !== 'RM';
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);
  const [term, setTerm] = useState('');
  const [asset, setAsset] = useState('');
  const [flow, setFlow] = useState<FlowFilter>('todos');
  const [status, setStatus] = useState('todos');
  const [visible, setVisible] = useState(15);
  const [period, setPeriod] = useState<PeriodFilter>('ytd');

  useEffect(() => {
    let mounted = true;
    fetch(dataPath + '?v=' + Date.now(), { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Arquivo indisponível');
      return response.json() as Promise<Snapshot>;
    }).then(data => {
      if (!Array.isArray(data.rows)) throw new Error('Estrutura inválida');
      if (mounted) setSnapshot(data);
    }).catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, [dataPath]);

  const allRows = useMemo(() => snapshot?.rows ?? [], [snapshot]);
  const bounds = useMemo(() => periodBounds(period), [period]);
  const rows = useMemo(() => allRows.filter(row => row.date !== null && row.date >= bounds.from && row.date <= bounds.to), [allRows, bounds]);
  const inflow = rows.reduce((total, row) => total + Math.max(0, -row.rawAmount), 0);
  const outflow = rows.reduce((total, row) => total + Math.max(0, row.rawAmount), 0);
  const net = inflow - outflow;
  const undated = rows.filter(row => !row.date).length;
  const assets = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach(row => counts.set(row.asset, (counts.get(row.asset) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const allAssets = useMemo(() => [...new Set(allRows.map(row => row.asset))].sort(), [allRows]);
  const filtered = useMemo(() => rows.filter(row => {
    if (flow === 'entradas' && row.rawAmount >= 0) return false;
    if (flow === 'custos' && row.rawAmount <= 0) return false;
    if (asset && row.asset !== asset) return false;
    if (status !== 'todos' && row.status !== status) return false;
    const needle = term.trim().toLowerCase();
    return !needle || [row.asset, row.strategy, row.strike].join(' ').toLowerCase().includes(needle);
  }).reverse(), [rows, asset, flow, status, term]);
  const changeFilter = (next: FlowFilter) => { setFlow(next); setVisible(15); };

  return (
    <main className='trades-page'>
      <div className='trades-container'>
        <div className='trades-crumb'><a href='/'>PrimeSphere</a><span>›</span> Portfólio <span>›</span> <strong>Trades</strong>{hiddenAccount && <><span>›</span><strong>{account}</strong></>}</div>
        <div className='trades-hero'>
          <div>
            <div className='trades-overline'>PRIMESPHERE / PORTFOLIO INTELLIGENCE</div>
            <h1>Trading Logbook <span className='trades-head-accent'>↗</span></h1>
            <p>Movimentações de opções, histórico de estratégias e acompanhamento incremental.</p>
          </div>
          <div className='trades-hero-actions'><span className='trades-pill'>{hiddenAccount ? `CONTA ${account}` : 'HISTÓRICO REAL'}</span><a className='trades-button' href='#historico'>Ver operações ↓</a></div>
        </div>

        {error && <div className='trades-error' role='alert'>Não foi possível carregar os lançamentos. Atualize a página para tentar novamente.</div>}
        {!snapshot && !error && <div className='trades-loading' role='status'>Carregando histórico de operações…</div>}

        {snapshot && <>
          <section className='trades-period-filter' aria-label='Recorte do relatório'>
            <div className='trades-period-intro'>
              <span className='trades-overline'>RECORTE DO RELATÓRIO</span>
              <h2>Período</h2>
              <p>Escolha uma visão rápida das operações.</p>
            </div>
            <div className='trades-tabs trades-period-tabs' role='group' aria-label='Período do relatório'>
              {([
                ['day', 'Hoje'],
                ['week', 'Semana'],
                ['mtd', 'MTD'],
                ['ytd', 'YTD'],
              ] as [PeriodFilter, string][]).map(([key, label]) => <button type='button' key={key} className={period === key ? 'selected' : ''} aria-pressed={period === key} onClick={() => { setPeriod(key); setVisible(15); }}>{label}</button>)}
            </div>
            <div className='trades-period-summary' aria-live='polite'>{bounds.label} · {showDate(bounds.from)} até {showDate(bounds.to)} · {rows.length} lançamentos</div>
          </section>
          <section className='trades-metrics' aria-label='Resumo das movimentações'>
            <div className='trades-metric featured'><div className='trades-metric-label'>Saldo das movimentações <span>↗</span></div><strong className={net >= 0 ? 'trades-green' : 'trades-red'}>{showCash(net)}</strong><small>Entradas menos custos registrados</small></div>
            <div className='trades-metric'><div className='trades-metric-label'>Entradas recebidas <span>＋</span></div><strong className='trades-green'>{showCash(inflow)}</strong><small>{rows.filter(row => row.rawAmount < 0).length} lançamentos de crédito</small></div>
            <div className='trades-metric'><div className='trades-metric-label'>Custos pagos <span>↗</span></div><strong className='trades-red'>{showCash(-outflow)}</strong><small>{rows.filter(row => row.rawAmount > 0).length} lançamentos de débito</small></div>
            <div className='trades-metric'><div className='trades-metric-label'>Lançamentos <span>▦</span></div><strong>{number.format(rows.length)}</strong><small>{rows.filter(row => row.status === 'closed').length} CLOSED · {rows.filter(row => row.status === 'open').length} OPEN</small></div>
          </section>
          <section className='trades-overview'>
            <div className='trades-panel chart-panel'><div className='trades-panel-heading'><div><h2>Evolução do caixa</h2><p>Fluxo acumulado dos registros com data</p></div><span className='trades-pill muted'>HISTÓRICO</span></div><div className='trades-chart-number'>{showCash(rows.filter(row => row.date).reduce((a, row) => a - row.rawAmount, 0))} <small>Com data</small></div><CashChart rows={rows} /><div className='trades-chart-note'><strong>Leitura do gráfico:</strong> representa movimentações registradas, não rentabilidade ou P&amp;L realizado. {undated ? String(undated) + ' lançamentos sem data não entram nesta curva.' : ''}</div></div>
            <div className='trades-panel'><div className='trades-panel-heading'><div><h2>Ativos mais negociados</h2><p>Quantidade de lançamentos</p></div></div><div className='trades-asset-bars'>{!assets.length && <p className='trades-muted'>Nenhum lançamento neste período.</p>}{assets.slice(0, 7).map(([ticker, count]) => <div className='trades-bar-row' key={ticker}><span>{ticker}</span><div className='trades-bar-track'><div className='trades-bar-fill' style={{ width: String(count / assets[0][1] * 100) + '%' }} /></div><small>{count}</small></div>)}</div><div className='trades-updated'>Arquivo atualizado: {formatUpdate(snapshot.sourceModifiedAt)}</div></div>
          </section>
          <section className='trades-panel trades-ledger' id='historico'>
            <div className='trades-panel-heading'><div><div className='trades-overline'>HISTÓRICO</div><h2>Registro de operações</h2><p>Valores negativos na planilha são entradas; positivos representam custos.</p></div><span className='trades-pill muted'>{rows.length} REGISTROS</span></div>
            <div className='trades-filters'>
              <div className='trades-tabs' role='group' aria-label='Tipo de movimentação'>
                {(['todos', 'entradas', 'custos'] as FlowFilter[]).map(kind => <button type='button' className={flow === kind ? 'selected' : ''} aria-pressed={flow === kind} key={kind} onClick={() => changeFilter(kind)}>{kind === 'todos' ? 'Todos' : kind === 'entradas' ? 'Entradas' : 'Custos'}</button>)}
              </div>
              <div className='trades-filter-fields'><input aria-label='Buscar ativo ou estratégia' placeholder='Buscar ativo ou estratégia…' value={term} onChange={event => { setTerm(event.target.value); setVisible(15); }} /><select aria-label='Filtrar por ativo' value={asset} onChange={event => { setAsset(event.target.value); setVisible(15); }}><option value=''>Todos os ativos</option>{allAssets.map(ticker => <option key={ticker} value={ticker}>{ticker}</option>)}</select><select aria-label='Filtrar por status' value={status} onChange={event => { setStatus(event.target.value); setVisible(15); }}><option value='todos'>Todos os status</option><option value='closed'>CLOSED</option><option value='open'>OPEN</option></select></div>
            </div>
            <div className='trades-table-scroll'><table className='trades-table'><thead><tr><th>Data</th><th>Ativo</th><th>Estratégia</th><th>Strike / vencimento</th><th>Qtd.</th><th>Status</th><th className='trades-align-right'>Fluxo de caixa</th></tr></thead><tbody>{filtered.slice(0, visible).map(row => <tr key={row.sourceRow}><td>{showDate(row.date)}</td><td className='trades-ticker'>{row.asset}</td><td>{row.strategy}</td><td className='trades-strike'>{row.strike || '—'}</td><td>{row.quantity}</td><td><span className={'trades-status ' + row.status}>{row.status === 'closed' ? 'CLOSED' : 'OPEN'}</span></td><td className={'trades-amount trades-align-right ' + (row.rawAmount <= 0 ? 'trades-green' : 'trades-red')}>{showCash(-row.rawAmount)}</td></tr>)}</tbody></table>{!filtered.length && <p className='trades-empty'>Nenhum lançamento corresponde aos filtros.</p>}</div>
            <div className='trades-table-footer'><span>Mostrando {Math.min(visible, filtered.length)} de {filtered.length} lançamentos filtrados.</span>{visible < filtered.length && <button type='button' onClick={() => setVisible(v => v + 15)}>Carregar mais ↓</button>}</div>
          </section>
          <div className='trades-disclaimer'><span>ⓘ</span><p><strong>Transparência:</strong> os valores são fluxos de caixa, não retornos realizados. Rolagens e ajustes aparecem como lançamentos individuais; toda operação que não estiver marcada como CLOSED no Excel é exibida como OPEN. Unidade monetária exibida como USD, a confirmar na planilha. As observações internas do Excel não são publicadas.</p></div>
          <div className='trades-footer-meta'>Conta: {account} · Fonte: {snapshot.source} · Sincronização: {formatUpdate(snapshot.syncedAt)} · Atualização programada após o fechamento regular de Wall Street.</div>
        </>}
      </div>
    </main>
  );
}
