import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Navigate to role-specific dashboard
      if (user.role === 'admin')  navigate('/admin/dashboard');
      else if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill demo credentials
  const fillDemo = (role) => {
    const creds = {
      admin:   { email: 'admin@hospital.com',   password: 'admin123'   },
      doctor:  { email: 'sarah@hospital.com',   password: 'doctor123'  },
      patient: { email: 'patient@hospital.com', password: 'patient123' },
    };
    setForm(creds[role]);
    setError('');
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: branding ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl font-black">+</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3">MediQueue</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Smart hospital queue management — reduce wait times, improve care.
          </p>
        </div>

        <ul className="relative space-y-4">
          {[
            { emoji: '🎟️', text: 'Instant token-based queue assignment' },
            { emoji: '📅', text: 'Easy appointment scheduling' },
            { emoji: '⏱️', text: 'Real-time estimated wait times' },
            { emoji: '🔒', text: 'Secure role-based access control' },
          ].map(({ emoji, text }) => (
            <li key={text} className="flex items-center gap-3 text-blue-100">
              <span className="text-xl">{emoji}</span>
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>

        <p className="relative text-blue-200 text-xs">
          &copy; {new Date().getFullYear()} MediQueue. All rights reserved.
        </p>
      </div>

      {/* ── Right panel: form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">+</span>
            </div>
            <span className="text-xl font-bold text-slate-800">MediQueue</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@hospital.com"
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? <LoadingSpinner size="sm" text="" /> : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register
              </Link>
            </p>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">
                Quick Demo Login
              </p>
              <div className="flex gap-2 flex-wrap">
                {(['admin', 'doctor', 'patient']).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fillDemo(role)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600
                               hover:border-blue-300 hover:text-blue-600 transition capitalize font-medium"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
