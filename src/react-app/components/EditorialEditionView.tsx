import type { ReactNode } from 'react';

export type EditorialEdition = {
  schemaVersion: 2;
  date: string;
  kind: 'morning' | 'afterclose';
  label: string;
  title: string;
  updatedAtMadrid: string;
  summary: string;
  markets: Array<{ name?: string; index?: string; value?: string | null; change?: string | null; futuro?: string | null; indice?: string | null }>;
  drivers: Array<{ title?: string; number: string | number; reason: string; impact: string }>;
  sections: Array<{ title?: string; name?: string; items?: string[]; content?: string }>;
  agenda: Array<{ name: string; officialDate: string; timeNewYork: string; timeMadrid: string; status: 'FUTURO' | 'JÁ DIVULGADO'; consensus: string; previous: string; result?: string }>;
  sources: string[];
};

const Box=({title,children}:{title:string;children:ReactNode})=><section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"><h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-400">{title}</h2><div className="space-y-3 text-base leading-7 text-slate-200">{children}</div></section>;

// Highlight signed percentage movements without changing any market data.
const SignedPercentages=({value}:{value:string | number | null | undefined})=><>{String(value ?? 'Não verificado').split(/([+-]\s?\d+(?:[.,]\d+)?\s?%)/g).map((part,i)=>/^[+]\s?\d/.test(part)
  ? <span key={i} className="text-emerald-400">{part}</span>
  : /^-\s?\d/.test(part)
    ? <span key={i} className="text-red-400">{part}</span>
    : part)}</>;

export default function EditorialEditionView({edition}:{edition:EditorialEdition}) {
  return <main className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
    <header className="border-b border-slate-800 pb-7"><p className="text-cyan-400 uppercase tracking-widest">PrimeSphere Intelligence</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">{edition.title}</h1><p className="mt-3 text-xl">{edition.label}</p><p className="mt-2 text-cyan-300">{edition.updatedAtMadrid}</p><p className="mt-4 text-lg leading-8">{edition.summary}</p></header>
    <Box title={edition.kind === 'morning' ? 'Wall Street em 30 segundos' : 'Fechamento em 30 segundos'}><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{edition.markets.map((m)=><div key={m.name ?? m.index} className="rounded-lg bg-slate-950 p-4"><p className="text-sm text-slate-400">{m.name ?? m.index}</p><p className="mt-2 text-2xl font-semibold"><SignedPercentages value={m.value ?? m.change ?? m.indice ?? m.futuro} /></p></div>)}</div></Box>
    <div className="grid gap-4 md:grid-cols-3">{edition.drivers.map((d,i)=><Box key={i} title={String(i+1).padStart(2,'0')+(d.title ? ' · '+d.title : ' · Driver de mercado')}><p><strong>NÚMERO:</strong> <SignedPercentages value={d.number} /></p><p><strong>MOTIVO:</strong> <SignedPercentages value={d.reason} /></p><p><strong>IMPACTO:</strong> <SignedPercentages value={d.impact} /></p></Box>)}</div>
    <div className="grid gap-4 md:grid-cols-2">{edition.sections.map((s,i)=><Box key={s.title ?? s.name ?? i} title={s.title ?? s.name ?? 'Análise'}>{(s.items ?? (s.content ? [s.content] : [])).map((x,j)=><p key={j}><SignedPercentages value={x} /></p>)}</Box>)}
    <Box title="Agenda do dia">{edition.agenda.length ? edition.agenda.map((e,i)=><p key={i}><strong>{e.timeMadrid} Madrid / {e.timeNewYork} New York · {e.status}:</strong> {e.name}. Consenso {e.consensus}; anterior {e.previous}{e.result ? '; resultado '+e.result : ''}.</p>) : <p>Não há eventos com dados completos verificados neste pacote editorial.</p>}</Box></div>
    <Box title="Fontes e método"><p>{edition.sources.join(' · ')}</p><p className="text-xs text-slate-400">Material informativo e educacional. Não constitui recomendação individual de investimento.</p></Box>
  </div></main>;
}
