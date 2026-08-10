import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Eye, EyeOff, Loader2, ShieldCheck, Activity, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Branding panel - hidden on small screens */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-sidebar-bg to-primary p-12 text-white">
        <div className="flex items-center gap-2.5 text-[19px] font-bold">
          <HeartPulse size={28} strokeWidth={2.2} />
          <span>MediCore HMS</span>
        </div>

        <div>
          <h1 className="text-[32px] font-bold leading-tight mb-4">
            One system for<br />the whole hospital.
          </h1>
          <p className="text-[15px] text-white/70 max-w-sm">
            Patients, appointments, OPD/IPD, pharmacy, lab, billing and staff — all in one
            role-aware workspace.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[15px] text-white/85">
              <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={18} />
              </span>
              Role-based access for every hospital staff member
            </div>
            <div className="flex items-center gap-3 text-[15px] text-white/85">
              <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Activity size={18} />
              </span>
              Live dashboards across OPD, IPD and Pharmacy
            </div>
            <div className="flex items-center gap-3 text-[15px] text-white/85">
              <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Users size={18} />
              </span>
              Built for doctors, nurses, admins and front desk alike
            </div>
          </div>
        </div>

        <p className="text-[13px] text-white/50">&copy; {new Date().getFullYear()} MediCore HMS</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2.5 text-[19px] font-bold text-primary mb-8">
            <HeartPulse size={28} strokeWidth={2.2} />
            <span>MediCore HMS</span>
          </div>

          <h2 className="text-page-title mb-1.5">Welcome back</h2>
          <p className="text-body text-slate-500 mb-7">Sign in to access your hospital dashboard</p>

          {error && (
            <div className="bg-danger-light text-danger text-[15px] rounded-md px-3.5 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 text-[15px] rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-11 text-[15px] rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2 py-2.5"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-meta text-center mt-6">
            Demo: <span className="font-medium text-slate-600">admin@hms.com / Admin@123</span> (Super Admin)
          </p>
        </div>
      </div>
    </div>
  );
}
