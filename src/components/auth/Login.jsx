import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError } from '../../features/authSlice';
import { TrendingUp, LogIn, KeyRound } from 'lucide-react';

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const systemUsers = useSelector(state => state.users.users);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    // Simulate network delay
    setTimeout(() => {
      const user = systemUsers.find(u => u.email === email && u.password === password);
      if (user) {
        dispatch(setUser({ 
          email: user.email, 
          user_metadata: { full_name: user.name },
          permissions: user.permissions
        }));
      } else {
        dispatch(setError('Credenciales inválidas. Verifique su email y contraseña.'));
      }
      dispatch(setLoading(false));
    }, 500);
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
        
        <form className="login-actions" onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
            <label className="form-section-label" style={{ marginBottom: '0.3rem', border: 'none' }}>Correo Electrónico</label>
            <input 
              type="email" 
              className="search-input" 
              placeholder="tu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ fontSize: '0.9rem', height: '42px', width: '100%' }}
            />
          </div>
          
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label className="form-section-label" style={{ marginBottom: '0.3rem', border: 'none' }}>Contraseña</label>
            <input 
              type="password" 
              className="search-input" 
              placeholder="••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ fontSize: '0.9rem', height: '42px', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px', fontWeight: 700, width: '100%' }}>
            {loading ? 'Validando...' : <><KeyRound size={18} /> Iniciar Sesión</>}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </form>
        
        <div className="login-footer">
          &copy; 2026 FinanceSAAS Platform. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
