import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChurchLogo } from './ChurchLogo';
import { ChurchLogoConfig } from '../types/timer';

interface LoginPageProps {
  churchLogo?: ChurchLogoConfig;
}

export const LoginPage: React.FC<LoginPageProps> = ({ churchLogo }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error || 'Login failed');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#07101f] to-slate-950 flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-cyan-500/[0.07] blur-[130px]" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          {churchLogo?.enabled ? (
            <div className="mb-4">
              <ChurchLogo config={churchLogo} showText={false} className="scale-125" />
            </div>
          ) : (
            <div className="mb-4 w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Timer className="w-6 h-6 text-emerald-400" />
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            {churchLogo?.enabled && churchLogo?.churchName ? churchLogo.churchName : 'SanctuaryTimer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium tracking-wide uppercase">
            Stage & Service Countdown Console
          </p>
        </div>

        {/* Login card */}
        <div className="sheen rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/70 shadow-2xl shadow-black/50 p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Operator Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jesusembassy"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950/60 border border-slate-700/70 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter console password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-slate-950/60 border border-slate-700/70 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Console</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Authorised AV operators only · Session stays active on this device
        </p>
      </div>
    </div>
  );
};
