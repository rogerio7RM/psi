import { useEffect, useState } from 'react';
import AccessGate from '../components/AccessGate';
import './Subscriber.css';

type Permission = { code: string; label: string };
type Plan = { id: string; code: string; name: string; description: string; active: boolean; permissions: string[] };
type User = {
  id: string; email: string; name: string; role: string; status: string; subscription_status: string;
  access_expires_at: string | null; last_login_at: string | null; plan_code: string | null; plan_name: string | null;
  permissions: string[]; trade_account: 'EB' | 'DC' | null;
};

function AdminContent() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', password: '', planCode: 'PREMIUM', role: 'member', tradeAccount: '' });

  async function api(path: string, init?: RequestInit) {
    const response = await fetch(path, { credentials: 'same-origin', ...init });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Falha na operação.');
    return data;
  }

  async function load() {
    const [permissionData, planData, userData] = await Promise.all([
      api('/api/admin/permissions'),
      api('/api/admin/plans'),
      api('/api/admin/users'),
    ]);
    setPermissions(permissionData.permissions || []);
    setPlans(planData.plans || []);
    setUsers(userData.users || []);
  }

  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setMessage('');
    try {
      await api('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          status: 'active',
          subscriptionStatus: draft.role === 'admin' ? 'internal' : 'active',
        }),
      });
      setDraft({ name: '', email: '', password: '', planCode: 'PREMIUM', role: 'member', tradeAccount: '' });
      setMessage('Usuário criado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar usuário.');
    } finally {
      setCreating(false);
    }
  }

  function patchLocalUser(id: string, changes: Partial<User>) {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...changes } : user));
  }

  async function saveUser(user: User) {
    setMessage('');
    try {
      await api('/api/admin/users/' + user.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          subscriptionStatus: user.subscription_status,
          planCode: user.plan_code,
          accessExpiresAt: user.access_expires_at,
          tradeAccount: user.trade_account,
        }),
      });
      setMessage('Usuário atualizado: ' + user.email);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao atualizar usuário.');
    }
  }

  async function resetPassword(user: User, password: string) {
    if (password.length < 12) return setMessage('A nova senha deve ter pelo menos 12 caracteres.');
    try {
      await api('/api/admin/users/' + user.id + '/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setMessage('Senha redefinida para ' + user.email + '. As sessões antigas foram encerradas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao redefinir senha.');
    }
  }

  async function savePlan(plan: Plan) {
    try {
      await api('/api/admin/plans/' + plan.code, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: plan.name, description: plan.description, active: plan.active, permissions: plan.permissions }),
      });
      setMessage('Plano atualizado: ' + plan.code);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao atualizar plano.');
    }
  }

  function togglePermission(list: string[], code: string) {
    return list.includes(code) ? list.filter((item) => item !== code) : [...list, code];
  }

  return (
    <main className='subscriber-page'>
      <div className='subscriber-admin-shell'>
        <header className='subscriber-admin-header'>
          <div><span className='subscriber-kicker'>ADMINISTRAÇÃO</span><h1>Assinaturas e acessos</h1><p>Gerencie usuários, planos, validade e permissões para Trades e Educacional.</p></div>
          <a href='/conta'>Minha conta</a>
        </header>

        {message && <div className='subscriber-alert'>{message}</div>}

        <section className='subscriber-card'>
          <h2>Novo usuário</h2>
          <form className='subscriber-form subscriber-create-grid' onSubmit={createUser}>
            <label>Nome<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
            <label>E-mail<input type='email' value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required /></label>
            <label>Senha temporária<input type='password' minLength={12} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} required /></label>
            <label>Plano<select value={draft.planCode} onChange={(e) => setDraft({ ...draft, planCode: e.target.value })}>{plans.filter((plan) => plan.active).map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select></label>
            <label>Carteira de Trades<select value={draft.tradeAccount} onChange={(e) => setDraft({ ...draft, tradeAccount: e.target.value })}><option value=''>Sem carteira privada</option><option value='EB'>EB</option><option value='DC'>DC</option></select></label>
            <label>Tipo<select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}><option value='member'>Assinante</option><option value='admin'>Administrador</option></select></label>
            <button type='submit' disabled={creating}>{creating ? 'Criando…' : 'Criar usuário'}</button>
          </form>
        </section>

        <section className='subscriber-card'>
          <div className='subscriber-section-title'><div><span className='subscriber-kicker'>USUÁRIOS</span><h2>{users.length} cadastrados</h2></div></div>
          <div className='subscriber-user-list'>
            {users.map((user) => <UserEditor key={user.id} user={user} plans={plans} onChange={(changes) => patchLocalUser(user.id, changes)} onSave={() => saveUser(user)} onReset={(password) => resetPassword(user, password)} />)}
          </div>
        </section>

        <section className='subscriber-card'>
          <div className='subscriber-section-title'><div><span className='subscriber-kicker'>PLANOS</span><h2>Permissões por assinatura</h2></div></div>
          <div className='subscriber-plan-grid'>
            {plans.map((plan) => (
              <article className='subscriber-plan-card' key={plan.code}>
                <div className='subscriber-plan-code'>{plan.code}</div>
                <input className='subscriber-title-input' value={plan.name} onChange={(e) => setPlans((current) => current.map((item) => item.code === plan.code ? { ...item, name: e.target.value } : item))} />
                <textarea value={plan.description || ''} onChange={(e) => setPlans((current) => current.map((item) => item.code === plan.code ? { ...item, description: e.target.value } : item))} />
                <label className='subscriber-check'><input type='checkbox' checked={plan.active} onChange={(e) => setPlans((current) => current.map((item) => item.code === plan.code ? { ...item, active: e.target.checked } : item))} /> Plano ativo</label>
                <div className='subscriber-checkboxes'>
                  {permissions.map((permission) => <label key={permission.code}><input type='checkbox' checked={plan.permissions.includes(permission.code)} onChange={() => setPlans((current) => current.map((item) => item.code === plan.code ? { ...item, permissions: togglePermission(item.permissions, permission.code) } : item))} />{permission.label}</label>)}
                </div>
                <button type='button' onClick={() => void savePlan(plan)}>Salvar plano</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function UserEditor({ user, plans, onChange, onSave, onReset }: {
  user: User; plans: Plan[]; onChange: (changes: Partial<User>) => void;
  onSave: () => void; onReset: (password: string) => void;
}) {
  const [password, setPassword] = useState('');
  return (
    <article className='subscriber-user-card'>
      <div className='subscriber-user-head'><div><strong>{user.name}</strong><span>{user.email}</span></div><span className={'subscriber-status ' + (user.status === 'active' ? 'active' : '')}>{user.status}</span></div>
      <div className='subscriber-user-grid'>
        <label>Nome<input value={user.name} onChange={(e) => onChange({ name: e.target.value })} required /></label>
        <label>E-mail<input type='email' value={user.email} onChange={(e) => onChange({ email: e.target.value })} required /></label>
        <label>Plano<select value={user.plan_code || ''} onChange={(e) => onChange({ plan_code: e.target.value || null })}><option value=''>Sem plano</option>{plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select></label>
        <label>Carteira de Trades<select value={user.trade_account || ''} onChange={(e) => onChange({ trade_account: (e.target.value || null) as 'EB' | 'DC' | null })}><option value=''>Sem carteira privada</option><option value='EB'>EB</option><option value='DC'>DC</option></select></label>
        <label>Tipo<select value={user.role} onChange={(e) => onChange({ role: e.target.value })}><option value='member'>Assinante</option><option value='admin'>Administrador</option></select></label>
        <label>Usuário<select value={user.status} onChange={(e) => onChange({ status: e.target.value })}><option value='active'>Ativo</option><option value='suspended'>Suspenso</option></select></label>
        <label>Assinatura<select value={user.subscription_status} onChange={(e) => onChange({ subscription_status: e.target.value })}><option value='active'>Ativa</option><option value='trial'>Trial</option><option value='internal'>Interna</option><option value='past_due'>Pagamento pendente</option><option value='canceled'>Cancelada</option><option value='expired'>Expirada</option></select></label>
        <label>Validade<input type='date' value={user.access_expires_at ? user.access_expires_at.slice(0, 10) : ''} onChange={(e) => onChange({ access_expires_at: e.target.value ? e.target.value + 'T23:59:59.999Z' : null })} /></label>
      </div>
      <div className='subscriber-user-actions'><button type='button' onClick={onSave}>Salvar usuário</button><input type='password' placeholder='Nova senha (12+ caracteres)' value={password} onChange={(e) => setPassword(e.target.value)} /><button type='button' className='secondary' onClick={() => { onReset(password); setPassword(''); }}>Redefinir senha</button></div>
      <small>Último login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString('pt-BR') : 'nunca'}</small>
    </article>
  );
}

export default function AdminPage() {
  return <AccessGate admin><AdminContent /></AccessGate>;
}
