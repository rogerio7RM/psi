import { useEffect } from 'react';
import type { ComponentType } from 'react';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import HomeIntro from './components/HomeIntro';
import AccessGate from './components/AccessGate';
import PlaceholderPage from './pages/PlaceholderPage';
import EducationPage from './pages/EducationPage';
import TradesPage from './pages/TradesPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';

type EditionModule = { default: ComponentType };
type RegisteredEdition = {
  component: ComponentType;
  priority: number;
  label: string;
};

const modules = import.meta.glob<EditionModule>('./editions/*.tsx', { eager: true });
const editions = new Map<string, RegisteredEdition>();

for (const [path, module] of Object.entries(modules)) {
  const match = path.match(/\/(\d{6})(?:-(afterclose|final))?\.tsx$/);
  if (!match) continue;
  const [, date, variant] = match;
  const priority = variant === 'afterclose' ? 3 : variant === 'final' ? 2 : 1;
  const label = variant === 'afterclose' ? 'After Close' : variant === 'final' ? 'Final Pré-Market' : 'Morning Brief';
  const previous = editions.get(date);
  if (!previous || previous.priority < priority) editions.set(date, { component: module.default, priority, label });
}

const dates = [...editions.keys()].sort();
const latestDate = dates[dates.length - 1] ?? '';

function formatEditionDate(code: string) {
  if (!/^\d{6}$/.test(code)) return '';
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const month = Number(code.slice(2, 4));
  const day = Number(code.slice(4, 6));
  const year = `20${code.slice(0, 2)}`;
  return `${day} de ${months[month - 1]} de ${year}`;
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const query = new URLSearchParams(window.location.search);
  const requested = query.get('date') ?? window.location.search.substring(1).split('&')[0];
  const selectedDate = /^\d{6}$/.test(requested) && editions.has(requested) ? requested : latestDate;
  const selected = editions.get(selectedDate);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'PrimeSphere Intelligence | Brief de Wall Street',
      '/quem-somos': 'Quem Somos | PrimeSphere Intelligence',
      '/educacional': 'Educacional | PrimeSphere Intelligence',
      '/trades': 'Trades | PrimeSphere Intelligence',
      '/login': 'Entrar | PrimeSphere Intelligence',
      '/conta': 'Minha Conta | PrimeSphere Intelligence',
      '/admin': 'Administração | PrimeSphere Intelligence',
    };
    document.title = titles[path] ?? 'PrimeSphere Intelligence';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [path]);

  let content;

  if (path === '/') {
    if (!selected) {
      content = <main className='psi-empty-state' role='alert'>Nenhuma edição publicada.</main>;
    } else {
      const Edition = selected.component;
      content = (
        <>
          <HomeIntro
            editionLabel={selected.label}
            editionDate={formatEditionDate(selectedDate)}
            historical={selectedDate !== latestDate}
          />
          <section className='psi-brief-section' id='brief-atual'>
            <div className='psi-section-heading'>
              <div>
                <span className='psi-eyebrow psi-eyebrow-dark'>Inteligência diária</span>
                <h2>Brief atual</h2>
              </div>
              <p>{selectedDate === latestDate ? 'Última edição publicada.' : 'Edição histórica selecionada.'}</p>
            </div>
            <div className='psi-brief-frame'>
              <Edition />
            </div>
          </section>
        </>
      );
    }
  } else if (path === '/quem-somos') {
    content = <PlaceholderPage eyebrow='PrimeSphere' title='Quem Somos' />;
  } else if (path === '/login') {
    content = <LoginPage />;
  } else if (path === '/conta') {
    content = <AccountPage />;
  } else if (path === '/admin') {
    content = <AdminPage />;
  } else if (path === '/educacional') {
    content = <AccessGate permission='education.library'><EducationPage /></AccessGate>;
  } else if (path.startsWith('/educacional/')) {
    const slug = path.slice('/educacional/'.length);
    content = <AccessGate permission={'education.study.' + slug}><EducationPage slug={slug} /></AccessGate>;
  } else if (path === '/trades') {
    content = <TradesPage />;
  } else {
    content = (
      <PlaceholderPage
        eyebrow='404'
        title='Página não encontrada'
        description='Este endereço não existe. Volte ao Brief Atual.'
      />
    );
  }

  return (
    <div className='psi-site'>
      <SiteHeader currentPath={path} />
      {content}
      <SiteFooter />
    </div>
  );
}

export default App;
