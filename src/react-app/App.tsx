import type { ComponentType } from 'react';

type EditionModule = { default: ComponentType };
type RegisteredEdition = { component: ComponentType; priority: number };
const modules = import.meta.glob<EditionModule>('./editions/*.tsx', { eager: true });
const editions = new Map<string, RegisteredEdition>();

for (const [path, module] of Object.entries(modules)) {
  const match = path.match(/\/(\d{6})(?:-(afterclose|final))?\.tsx$/);
  if (!match) continue;
  const [, date, variant] = match;
  const priority = variant === 'afterclose' ? 3 : variant === 'final' ? 2 : 1;
  const previous = editions.get(date);
  if (!previous || previous.priority < priority) editions.set(date, { component: module.default, priority });
}

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const requested = query.get('date') ?? window.location.search.substring(1).split('&')[0];
  const dates = [...editions.keys()].sort();
  const selected = editions.get(/^\d{6}$/.test(requested) ? requested : '') ?? editions.get(dates[dates.length - 1]);
  if (!selected) return <main role='alert'>Nenhuma edição publicada.</main>;
  const Edition = selected.component;
  return <Edition />;
}
