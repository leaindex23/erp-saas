import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError } from '../../features/authSlice';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, LogIn, Users } from 'lucide-react';

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  // Default mock users for testing roles without DB
  const mockUsers = [
    { email: 'admin@financesaas.com', name: 'Super Admin', permissions: { isRoot: true, allowedCompanies: [], allowedAccounts: [] } },
    { email: 'caja_fuerte@holding.com', name: 'Operador Caja Empresa 1', permissions: { isRoot: false, allowedCompanies: [1], allowedAccounts: [1] } },
    { email: 'manager@holding.com', name: 'SaaS Manager (All Companies, specific boxes)', permissions: { isRoot: false, allowedCompanies: [1, 2], allowedAccounts: [1, 2, 3] } }
  ];
  
  const [selectedUser, setSelectedUser] = useState(0);

  const handleGoogleLogin = async () => {
    dispatch(setLoading(true));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (e) {
      dispatch(setError(e.message));
    }
  };

  const bypassLogin = () => {
    const user = mockUsers[selectedUser];
    dispatch(setUser({ 
      email: user.email, 
      user_metadata: { full_name: user.name },
      permissions: user.permissions
    }));
  };

  return (
    <div className="login-screen animate-fade-in">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">
            <TrendingUp size={32} color="var(--primary)" strokeWidth={3} />
          </div>
          <h1>FinanceSAAS</h1>
          <p>Potencia el control financiero de tu holding</p>
        </div>
        
        <div className="login-actions">
          <button className="btn btn-primary btn-google" onClick={handleGoogleLogin} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Cargando...' : 'Entrar con Google'}
          </button>
          
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-base)' }}>
             <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14}/> Test Roles (Modo Prueba)
             </h3>
             <select className="search-input" style={{ width: '100%', marginBottom: '0.75rem', background: '#fff' }} value={selectedUser} onChange={e => setSelectedUser(parseInt(e.target.value))}>
                {mockUsers.map((u, i) => <option key={i} value={i}>{u.name} ({u.email})</option>)}
             </select>
             <button className="btn btn-primary" onClick={bypassLogin} style={{ width: '100%', height: '40px', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
               🚀 ENTRAR A MODO PRUEBA
             </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="login-footer">
          &copy; 2026 FinanceSAAS Platform. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
