import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import LoginPage from '../pages/LoginPage';
import '../pages/Subscriber.css';

export default function AccessGate({ permission, children, admin = false }: { permission?: string; children: ReactNode; admin?: boolean }) {
  const { loading, user, hasPermission } = useAuth();
  if (loading) return <main className='subscriber-gate'><section className='subscriber-card'><p>Validando acesso…</p></section></main>;
  if (!user) return <LoginPage embedded returnTo={window.location.pathname + window.location.search} />;
  const allowed = admin ? user.role === 'admin' : (!permission || hasPermission(permission));
  if (!allowed) {
    return (
      <main className='subscriber-gate'>
        <section className='subscriber-card'>
          <span className='subscriber-kicker'>ACESSO RESTRITO</span>
          <h1>Conteúdo não incluído no seu acesso</h1>
          <p>Seu usuário está autenticado, mas este conteúdo não está liberado para o plano ou permissões atuais.</p>
          <div className='subscriber-actions'><a href='/conta'>Ver minha conta</a><a className='secondary' href='/'>Voltar ao Brief</a></div>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}
