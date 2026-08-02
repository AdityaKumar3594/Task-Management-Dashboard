import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div>
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 shadow-md">
            <img src="/navy-logo.svg" alt="Indian Navy" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold">Indian Navy</h1>
          <p className="mt-2 text-lg text-white/70">Department Task Management Dashboard</p>
        </div>
        <p className="text-sm text-white/50">
          Track tasks across departments — completed, ongoing, and overdue.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow border border-gray-200">
              <img src="/navy-logo.svg" alt="Indian Navy" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-navy">Indian Navy Task Dashboard</h1>
          </div>

          <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}

                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Indian Navy — Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
}
