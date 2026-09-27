type Props = {
  editionLabel: string;
  editionDate: string;
  historical: boolean;
};

const quickLinks = [
  ['/quem-somos', '01', 'Quem Somos', 'Conheça a proposta PrimeSphere'],
  ['/educacional', '02', 'Educacional', 'Mercado americano sem complicação'],
  ['/trades', '03', 'Trades', 'Estratégias e acompanhamento'],
];

export default function HomeIntro({ editionLabel, editionDate, historical }: Props) {
  return (
    <>
      <section className='psi-hero'>
        <div className='psi-hero-inner'>
          <div className='psi-hero-copy'>
            <span className='psi-eyebrow'>Portfolio Intelligence</span>
            <h1>Wall Street, com contexto para o investidor brasileiro.</h1>
            <p>Briefs diários, leitura de mercado, educação financeira e acompanhamento de estratégias em uma experiência única.</p>
            <div className='psi-hero-actions'>
              <a className='psi-primary-button' href='#brief-atual'>Ler brief atual</a>
              <a className='psi-secondary-button' href='/educacional'>Explorar educacional</a>
            </div>
          </div>

          <aside className='psi-status-card' aria-label='Edição em exibição'>
            <div className='psi-live-dot'><span />{historical ? 'Edição histórica' : 'Edição mais recente'}</div>
            <strong>{editionLabel}</strong>
            <p>{editionDate}</p>
            <div className='psi-status-grid'>
              <div><b>Wall Street</b><small>Contexto & leitura</small></div>
              <div><b>Radar</b><small>Macro, movers e setores</small></div>
            </div>
          </aside>
        </div>
      </section>

      <section className='psi-quick-links' aria-label='Atalhos'>
        {quickLinks.map(([href, number, title, description]) => (
          <a href={href} key={href}>
            <span>{number}</span>
            <div><b>{title}</b><small>{description}</small></div>
            <i aria-hidden='true'>→</i>
          </a>
        ))}
      </section>
    </>
  );
}
