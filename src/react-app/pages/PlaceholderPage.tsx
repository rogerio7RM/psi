type Props = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function PlaceholderPage({ eyebrow, title, description = 'Conteúdo em preparação.' }: Props) {
  return (
    <main className='psi-placeholder-page'>
      <div className='psi-placeholder-inner'>
        <span className='psi-eyebrow'>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className='psi-placeholder-line' />
        <a className='psi-primary-button' href='/#brief-atual'>Voltar ao Brief Atual</a>
      </div>
    </main>
  );
}
