import { useState } from 'react';

type Props = {
  currentPath: string;
};

const links = [
  ['/', 'Brief'],
  ['/quem-somos', 'Quem Somos'],
  ['/educacional', 'Educacional'],
  ['/trades', 'Trades'],
];

export default function SiteHeader({ currentPath }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className='psi-header'>
      <div className='psi-header-inner'>
        <a className='psi-brand' href='/' aria-label='PrimeSphere Intelligence — página inicial'>
          <img src='/primesphere-logo.jpg' alt='PrimeSphere Portfolio Intelligence' />
        </a>

        <nav className='psi-nav-desktop' aria-label='Navegação principal'>
          {links.map(([href, label]) => (
            <a className={(currentPath === href || (href !== '/' && currentPath.startsWith(href + '/'))) ? 'is-active' : ''} href={href} key={href}>{label}</a>
          ))}
        </nav>

        <a className='psi-header-cta' href='/#brief-atual'>Brief atual</a>

        <button
          className='psi-menu-button'
          type='button'
          aria-expanded={open}
          aria-controls='psi-mobile-nav'
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className={`psi-nav-mobile ${open ? 'is-open' : ''}`} id='psi-mobile-nav' aria-label='Navegação móvel'>
        {links.map(([href, label]) => (
          <a className={currentPath === href ? 'is-active' : ''} href={href} key={href}>{label}</a>
        ))}
        <a className='psi-mobile-brief' href='/#brief-atual'>Ver Brief Atual</a>
      </nav>
    </header>
  );
}
