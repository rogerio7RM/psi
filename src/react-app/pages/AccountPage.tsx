import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AccessGate from '../components/AccessGate';
import './Subscriber.css';

function AccountContent() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  if (!user) return null;

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || 'Não foi possível alterar a senha.');
    setCurrentPassword('');
    setNewPassword('');
    setMessage('Senha alterada com sucesso.');
  }

  return (
    <main className='subscriber-page'>
      <div className='subscriber-shell'>
        <section className='subscriber-card'>
          <span className='subscriber-kicker'>MINHA CONTA</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className='subscriber-account-grid'>
            <div><span>Plano</span><strong>{user.role === 'admin' ? 'Administrador' : (user.planName || 'Sem plano')}</strong></div>
            <div><span>Status</span><strong>{user.accessActive ? 'Ativo' : 'Sem acesso ativo'}</strong></div>
            <div><span>Assinatura</span><strong>{user.subscriptionStatus}</strong></div>
            <div><span>Validade</span><strong>{user.accessExpiresAt ? new Date(user.accessExpiresAt).toLocaleDateString('pt-BR') : 'Sem vencimento definido'}</strong></div>
          </div>
          <div className='subscriber-permissions'>
            <h2>Acessos liberados</h2>
            {user.role === 'admin'
              ? <span>Administrador · acesso total</span>
              : user.permissions.length
                ? user.permissions.map((permission) => <span key={permission}>{permission}</span>)
                : <p>Nenhum conteúdo protegido liberado.</p>}
          </div>
          <div className='subscriber-actions'>
            {user.role === 'admin' && <a href='/admin'>Gerenciar assinaturas</a>}
            <button className='secondary' type='button' onClick={() => void logout()}>Sair</button>
          </div>
        </section>

        <section className='subscriber-card'>
          <span className='subscriber-kicker'>SEGURANÇA</span>
          <h2>Alterar senha</h2>
          <form className='subscriber-form' onSubmit={changePassword}>
            <label>Senha atual<input type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
            <label>Nova senha<input type='password' minLength={12} maxLength={128} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
            {message && <div className='subscriber-alert'>{message}</div>}
            <button type='submit'>Alterar senha</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return <AccessGate><AccountContent /></AccessGate>;
}
