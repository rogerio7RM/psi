const links = [
  ['/', 'Brief'],
  ['/quem-somos', 'Quem Somos'],
  ['/educacional', 'Educacional'],
  ['/trades', 'Trades'],
];

export default function SiteFooter() {
  return (
    <footer className='psi-footer'>
      <div className='psi-footer-inner'>
        <img className='psi-footer-logo' src='/primesphere-logo.jpg' alt='PrimeSphere Portfolio Intelligence' />
        <div className='psi-footer-copy'>
          <strong>PrimeSphere Intelligence</strong>
          <p>Informação, contexto e educação para quem acompanha o mercado americano.</p>
        </div>
        <nav className='psi-footer-nav' aria-label='Links do rodapé'>
          {links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
        </nav>
      </div>
      <div className='psi-footer-legal'>
        Conteúdo informativo e educacional. Não constitui recomendação individual de investimento.
      </div>
    </footer>
  );
}
