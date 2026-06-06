import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
         style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mx-auto mb-4"
               style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}>
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to your Movies Mania account
          </p>
        </div>

        <div className="rounded-xl p-6"
             style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {errorMsg && (
            <div className="alert-error mb-5">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="field-icon" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-icon"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="field-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-icon"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0 }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                       style={{ borderColor: 'transparent', borderTopColor: 'currentColor' }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium"
                style={{ color: 'var(--text)', textDecoration: 'none' }}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};
export default Login;
