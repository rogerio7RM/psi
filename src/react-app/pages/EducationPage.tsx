
import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { categories, studies } from '../educational/studies';
import type { Study } from '../educational/studies';
import './EducationPage.css';

function StudyViewer({ study }: { study: Study }) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = study.pages.length;
  const selected = study.pages[current];
  const change = (delta: number) => setCurrent((value) => Math.max(0, Math.min(total - 1, value + delta)));

  useEffect(() => {
    setCurrent(0);
    setFullscreen(false);
  }, [study.slug]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.key === 'Escape') { setFullscreen(false); return; }
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); change(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [total]);

  function touchBegin(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = event.touches[0]?.clientX ?? null;
  }
  function touchFinish(event: TouchEvent<HTMLDivElement>) {
    if (touchStart.current === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart.current;
    const diff = touchStart.current - end;
    if (Math.abs(diff) > 55) change(diff > 0 ? 1 : -1);
    touchStart.current = null;
  }

  const activeChapter = study.chapters.filter((item) => item.pageIndex <= current).at(-1)?.title;

  return (
    <section className={'edu-viewer' + (fullscreen ? ' edu-fullscreen' : '')} id='apresentacao' aria-label={'Apresentação: ' + study.title}>
      <div className='edu-viewer-header'>
        <div>
          <span className='edu-overline'>APRESENTAÇÃO · {study.category.toUpperCase()}</span>
          <h2>{study.title}</h2>
          <p>{study.tagline}</p>
        </div>
        <div className='edu-viewer-actions'>
          <a className='edu-pdf-button' href={study.pdf} target='_blank' rel='noopener noreferrer'>Abrir PDF ↗</a>
          <button type='button' className='edu-expand-button' onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? '✕ Fechar' : '⛶ Tela cheia'}
          </button>
        </div>
      </div>

      <div className='edu-slide-stage' onTouchStart={touchBegin} onTouchEnd={touchFinish}>
        <button type='button' className='edu-arrow edu-arrow-left' onClick={() => change(-1)} disabled={current === 0} aria-label='Página anterior'>‹</button>
        <img src={selected.image} alt={'Página ' + (current + 1) + ' do estudo: ' + selected.title} className='edu-slide-image' decoding='async' />
        <button type='button' className='edu-arrow edu-arrow-right' onClick={() => change(1)} disabled={current === total - 1} aria-label='Próxima página'>›</button>
      </div>

      <div className='edu-slide-bottom' aria-live='polite'>
        <div>
          <span className='edu-overline'>PÁGINA {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <h3>{selected.title}</h3>
          <p>{selected.caption}</p>
        </div>
        <div className='edu-slide-buttons'>
          <button type='button' onClick={() => change(-1)} disabled={current === 0} aria-label='Voltar'>←</button>
          <button type='button' onClick={() => change(1)} disabled={current === total - 1} aria-label='Avançar'>→</button>
        </div>
      </div>

      <div className='edu-progress' role='progressbar' aria-label='Progresso do estudo' aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
        <span style={{ width: (100 * (current + 1) / total) + '%' }} />
      </div>

      <div className='edu-chapters' role='group' aria-label='Capítulos do estudo'>
        {study.chapters.map((chapter) => (
          <button type='button' key={chapter.title} className={activeChapter === chapter.title ? 'is-current' : ''} onClick={() => setCurrent(chapter.pageIndex)}>
            {chapter.title}
          </button>
        ))}
      </div>

      <div className='edu-thumbnails' role='group' aria-label='Índice de páginas'>
        {study.pages.map((item, index) => (
          <button type='button' key={item.image} onClick={() => setCurrent(index)} className={'edu-thumbnail' + (index === current ? ' is-current' : '')} aria-label={'Ir para página ' + (index + 1) + ': ' + item.title} aria-current={index === current ? 'step' : undefined}>
            <img src={item.image} alt='' loading='lazy' decoding='async' />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
      <div className='edu-viewer-hint'>
        Use as setas, deslize no celular ou escolha uma página pelo índice. Para ampliar o texto, <a href={study.pdf} target='_blank' rel='noopener noreferrer'>abra o PDF original</a>.
      </div>
    </section>
  );
}

export default function EducationPage({ slug }: { slug?: string }) {
  const [category, setCategory] = useState<string>('Todos');
  const [term, setTerm] = useState('');
  const study = studies.find((item) => item.slug === slug) ?? (!slug ? studies[0] : null);

  useEffect(() => {
    document.title = (study ? study.title : 'Educacional') + ' | PrimeSphere Intelligence';
  }, [study]);

  const filtered = studies.filter((item) =>
    (category === 'Todos' || item.category === category)
    && (item.title + ' ' + item.description).toLowerCase().includes(term.trim().toLowerCase())
  );

  if (!study) {
    return <main className='edu-not-found'><h1>Estudo não encontrado</h1><p>Esse material não está disponível na biblioteca.</p><a href='/educacional'>Voltar à biblioteca</a></main>;
  }

  return (
    <main className='edu-page'>
      <header className='edu-hero'>
        <div className='edu-hero-inner'>
          <span className='edu-overline'>PRIMESPHERE INTELLIGENCE / EDUCACIONAL</span>
          <h1>O mercado americano, explicado em profundidade.</h1>
          <p>Explore estudos visuais sobre opções e Wall Street. Apresentações por capítulos, com navegação simples no computador e no celular.</p>
          <div className='edu-hero-tags'><span>{studies.length} estudo disponível</span><span>Biblioteca em expansão</span><a href='/#brief-atual'>Ir para o Brief atual ↗</a></div>
        </div>
      </header>

      <div className='edu-content'>
        <nav className='edu-breadcrumb' aria-label='Navegação estrutural'>
          <a href='/'>Início</a><span>›</span><a href='/educacional'>Educacional</a><span>›</span><span>{study.title}</span>
        </nav>

        <div className='edu-feature-header'>
          <span>ESTUDO EM DESTAQUE</span>
          <span>10 páginas · Conteúdo educacional</span>
        </div>

        <StudyViewer study={study} />

        <aside className='edu-disclaimer'>
          <strong>Nota sobre o estudo</strong>
          <p>As figuras, os resultados e as conclusões são reproduzidos do PDF fornecido. Os dados e o backtest descritos no material não foram verificados independentemente. Conteúdo educativo; não constitui recomendação individual de investimento.</p>
        </aside>

        <section className='edu-library' id='biblioteca'>
          <div className='edu-library-title'>
            <div><span className='edu-overline'>EXPLORE OUTROS MATERIAIS</span><h2>Biblioteca de estudos</h2><p>Escolha um estudo ou filtre por tema. Novos materiais aparecerão nesta área.</p></div>
            <span className='edu-study-total'>{studies.length} disponível</span>
          </div>

          <div className='edu-library-controls'>
            <div className='edu-filters' role='group' aria-label='Categorias da biblioteca'>
              {categories.map((item) => (
                <button type='button' key={item} className={category === item ? 'is-selected' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
            <input className='edu-search' type='search' aria-label='Buscar estudos' placeholder='Buscar estudos...' value={term} onChange={(event) => setTerm(event.target.value)} />
          </div>

          {filtered.length ? (
            <div className='edu-study-grid'>
              {filtered.map((item) => (
                <a className={'edu-study-card' + (item.slug === study.slug ? ' is-selected' : '')} key={item.slug} href={'/educacional/' + item.slug + '#apresentacao'}>
                  <div className='edu-card-image'><img src={item.pages[0].image} alt={'Capa de ' + item.title} loading='lazy'/><span>{item.category}</span></div>
                  <div className='edu-card-copy'><small>{item.pageCount} PÁGINAS · APRESENTAÇÃO</small><h3>{item.title}</h3><p>{item.description}</p><b>{item.slug === study.slug ? 'Estudo selecionado ↑' : 'Abrir estudo →'}</b></div>
                </a>
              ))}
            </div>
          ) : (
            <div className='edu-empty-results'>Nenhum estudo disponível com esse filtro. <button type='button' onClick={() => { setTerm(''); setCategory('Todos'); }}>Ver todos</button></div>
          )}

          <div className='edu-next-study'><span>＋</span><div><strong>Mais estudos em preparação</strong><p>Esta estrutura permite adicionar apresentações de opções, macroeconomia, indicadores e ações sem alterar a página inicial da PrimeSphere.</p></div></div>
        </section>
      </div>
    </main>
  );
}
