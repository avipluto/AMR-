import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dna, ArrowRight, AlertCircle, Check, X, Lock, Mail, User, Building } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.includes('@') &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please satisfy all password complexity and verification requirements.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password, institution);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Institutional email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080c14] text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Left: Scientific Visual Environment */}
      <div className="md:w-5/12 p-8 md:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0b1322] via-[#090f1a] to-[#04070d] border-b md:border-b-0 md:border-r border-slate-800/80">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black">
              <Dna size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                AMR SENTINEL
              </div>
              <div className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                Researcher Onboarding
              </div>
            </div>
          </div>
        </div>

        <div className="my-10 relative z-10 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Join the Collaborative Antimicrobial Intelligence Network
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gain immediate access to verified CLSI M100 breakpoint evaluation engines, automated Kirby-Bauer image
            profiling, multi-center surveillance heatmaps, and publication-grade PDF report synthesis.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          STRICTLY RESEARCH & EDUCATIONAL WORKSPACE
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="md:w-7/12 p-8 md:p-14 flex items-center justify-center bg-[#090e18]">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Create Research Account</h1>
            <p className="text-sm text-slate-400 mt-1">
              Register credentials to access the AMR Sentinel surveillance console.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-800/80 p-3.5 rounded-xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name & Title
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Doe, M.D."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jdoe@hospital.edu"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Research Institution or Laboratory
              </label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Department of Clinical Microbiology"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Validation Inline Rules */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px] font-mono">
              <span className="text-slate-400 block font-semibold mb-1">PASSWORD REQUIREMENTS:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-teal-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check size={12} /> : <X size={12} />} 8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-teal-400' : 'text-slate-500'}`}>
                  {hasUpper ? <Check size={12} /> : <X size={12} />} Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-teal-400' : 'text-slate-500'}`}>
                  {hasLower ? <Check size={12} /> : <X size={12} />} Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-teal-400' : 'text-slate-500'}`}>
                  {hasNumber ? <Check size={12} /> : <X size={12} />} Number included
                </div>
              </div>
              {password && confirmPassword && (
                <div className={`flex items-center gap-1.5 pt-1 ${isMatch ? 'text-teal-400' : 'text-rose-400'}`}>
                  {isMatch ? <Check size={12} /> : <X size={12} />} Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-sm mt-4"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an authorized account?{' '}
            <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
