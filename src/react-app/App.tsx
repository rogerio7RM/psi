import { useEffect } from 'react';
import type { ComponentType } from 'react';
import EditorialEditionView from './components/EditorialEditionView';
import historicalMorningTest from './test-editions/261015.json';
import goldenSimulation27 from './test-editions/261027-golden.json';
import comparison13 from './editions/261013.json';
import comparison19 from './editions/261019.json';
import type { EditorialEdition } from './components/EditorialEditionView';
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
type JsonEditionModule = { default: EditorialEdition };

const modules = import.meta.glob<EditionModule>('./editions/*.tsx', { eager: true });
const editions = new Map<string, RegisteredEdition>();
const jsonModules = import.meta.glob<JsonEditionModule>('./editions/*.json', { eager: true });

for (const [path, module] of Object.entries(modules)) {
  const match = path.match(/\/(\d{6})(?:-(afterclose|final))?\.tsx$/);
  if (!match) continue;
  const [, date, variant] = match;
  const priority = variant === 'afterclose' ? 3 : variant === 'final' ? 2 : 1;
  const label = variant === 'afterclose' ? 'After Close' : variant === 'final' ? 'Final Pré-Market' : 'Morning Brief';
  const previous = editions.get(date);
  if (!previous || previous.priority < priority) editions.set(date, { component: module.default, priority, label });
}

for (const [path, module] of Object.entries(jsonModules)) {
  const match = path.match(/\/(\d{6})(?:-(afterclose))?\.json$/);
  if (!match || module.default.schemaVersion !== 2) continue;
  const [, date, variant] = match;
  const data = module.default;
  if (data.date !== date) continue;
  const priority = variant === 'afterclose' || data.kind === 'afterclose' ? 30 : 20;
  const label = data.kind === 'afterclose' ? 'After Close' : 'Morning Brief';
  const component = () => <EditorialEditionView edition={data} />;
  const previous = editions.get(date);
  if (!previous || previous.priority < priority) editions.set(date, { component, priority, label });
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
      '/comparativo-editorial': 'Comparativo Editorial | PrimeSphere Intelligence',
      '/teste-golden-27': 'Teste Golden Standard 27/10 | PrimeSphere Intelligence',
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

  if (path === '/teste-golden-27') {
    content = <main className='psi-brief-section'><div className='psi-section-heading'><div><span className='psi-eyebrow psi-eyebrow-dark'>Simulação offline · não publicada</span><h2>Golden Standard — 27/10</h2></div><p>Dados do JSON de 27/10 reorganizados no padrão aprovado de 13/10; afirmações sem evidência foram omitidas.</p></div><div className='psi-brief-frame'><EditorialEditionView edition={goldenSimulation27 as EditorialEdition} /></div></main>;
  } else if (path === '/comparativo-editorial') {
    const samples: Record<string, EditorialEdition> = {
      '261013': comparison13 as EditorialEdition,
      '261015': historicalMorningTest as EditorialEdition,
      '261019': comparison19 as unknown as EditorialEdition,
    };
    const chosen = query.get('edicao') || '261013';
    const active = samples[chosen] ? chosen : '261013';
    content = (
      <main className='psi-brief-section'>
        <div className='psi-section-heading'>
          <div><span className='psi-eyebrow psi-eyebrow-dark'>Arquivo de comparação · não é notícia atual</span><h2>Comparativo editorial</h2></div>
          <p>Versões históricas originais, preservadas para avaliar conteúdo e apresentação. Nenhuma substitui o Morning Brief atual.</p>
        </div>
        <nav aria-label='Selecionar edição histórica' style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:24}}>
          {Object.keys(samples).map((date) => (
            <a key={date} href={'/comparativo-editorial?edicao=' + date} aria-current={date === active ? 'page' : undefined} style={{padding:'12px 18px',borderRadius:10,border:'1px solid #c7a34c',background:date === active ? '#071a2d' : '#fff',color:date === active ? '#fff' : '#071a2d',fontWeight:700}}>{date.slice(4,6)}/{date.slice(2,4)}/2026</a>
          ))}
        </nav>
        <p style={{marginBottom:20,color:'#65758a'}}>O protótipo de oito cards de 18/10 é um artefato separado, não uma edição de Morning Brief; será avaliado independentemente.</p>
        <div className='psi-brief-frame'><EditorialEditionView edition={samples[active]} /></div>
      </main>
    );
  } else if (path === '/teste-editorial') {
    content = <><main className='psi-brief-section'><div className='psi-section-heading'><div><span className='psi-eyebrow psi-eyebrow-dark'>Ambiente de validação</span><h2>TESTE HISTÓRICO — 15/10/2026</h2></div><p>Somente verificação visual. Não é um boletim atual.</p></div><div className='psi-brief-frame'><EditorialEditionView edition={historicalMorningTest as EditorialEdition} /></div></main></>;
  } else if (path === '/') {
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
