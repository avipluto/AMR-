import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle, Dna, Lock, Mail, Database } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('researcher@amrsentinel.org');
  const [password, setPassword] = useState('Biotech2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email credentials or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080c14] text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Left: Scientific Visual Environment */}
      <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0b1322] via-[#090f1a] to-[#04070d] border-b md:border-b-0 md:border-r border-slate-800/80">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Ambient biological glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Dna size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                AMR SENTINEL
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800 font-mono">
                  v1.1 LAB
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                Antimicrobial Resistance Intelligence Platform
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Network Visual Card */}
        <div className="my-12 relative z-10">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                SURVEILLANCE NODE ONLINE
              </span>
              <span>CLSI M100 COMPLIANT</span>
            </div>

            <div className="py-6 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                Turning antimicrobial resistance data into research insight.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated computational surveillance platform combining phenotypic Kirby-Bauer vision segmentation,
                canonical genomic resistance determinants, and population-scale change-point epidemiology.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-lg font-bold text-teal-400">8,752</div>
                <div className="text-[10px] text-slate-500 uppercase">AST Tests</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-lg font-bold text-cyan-400">3,500</div>
                <div className="text-[10px] text-slate-500 uppercase">Isolates</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-lg font-bold text-emerald-400">100%</div>
                <div className="text-[10px] text-slate-500 uppercase">Validated</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono relative z-10 flex items-center justify-between">
          <span>SECURE BIOTECHNOLOGY RESEARCH ACCESS</span>
          <span>RESEARCH ED. 2026</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="md:w-1/2 p-8 md:p-14 flex items-center justify-center bg-[#090e18]">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Sign in to continue to your AMR Sentinel research workspace.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-800/80 p-3.5 rounded-xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investigator@institution.org"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <span className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-teal-500 focus:ring-0"
                />
                Remember me on this workstation
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don't have an institutional account?{' '}
            <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              Create account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
