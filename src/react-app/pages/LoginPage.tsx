import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './Subscriber.css';

export default function LoginPage({ embedded = false, returnTo }: { embedded?: boolean; returnTo?: string }) {
  const { bootstrapRequired, configured, login, bootstrap } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setWorking(true);
    try {
      if (bootstrapRequired) await bootstrap(setupKey, name, email, password);
      else await login(email, password);
      window.location.href = returnTo || new URLSearchParams(window.location.search).get('return') || '/conta';
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className={embedded ? 'subscriber-gate' : 'subscriber-page'}>
      <section className='subscriber-card subscriber-login-card'>
        <span className='subscriber-kicker'>PRIMESPHERE INTELLIGENCE</span>
        <h1>{bootstrapRequired ? 'Criar administrador' : 'Área de assinantes'}</h1>
        <p>
          {bootstrapRequired
            ? 'Configuração inicial: crie o primeiro administrador usando a chave administrativa já protegida no Cloudflare.'
            : 'Entre para acessar os conteúdos liberados para o seu plano.'}
        </p>

        {!configured && <div className='subscriber-alert error'>A infraestrutura de assinaturas ainda não está disponível.</div>}
        {error && <div className='subscriber-alert error'>{error}</div>}

        <form className='subscriber-form' onSubmit={submit}>
          {bootstrapRequired && <>
            <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} autoComplete='name' required /></label>
            <label>Chave administrativa<input type='password' value={setupKey} onChange={(e) => setSetupKey(e.target.value)} autoComplete='off' required /></label>
          </>}
          <label>E-mail<input type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' required /></label>
          <label>Senha<input type='password' minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={bootstrapRequired ? 'new-password' : 'current-password'} required /></label>
          {bootstrapRequired && <small>A senha inicial deve ter pelo menos 12 caracteres.</small>}
          <button type='submit' disabled={working || !configured}>{working ? 'Processando…' : bootstrapRequired ? 'Criar administrador' : 'Entrar'}</button>
        </form>
      </section>
    </main>
  );
}
