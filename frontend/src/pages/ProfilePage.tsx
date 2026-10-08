import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building, Mail, Shield, Key, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('Password reset instructions dispatched to institutional email.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <User size={20} className="text-teal-400" />
          Investigator Profile & Security
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          CREDENTIAL VERIFICATION &bull; INSTITUTIONAL PERMISSIONS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 md:col-span-2 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-2xl font-mono">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user?.full_name || 'Senior Investigator'}</h3>
              <p className="text-xs text-teal-400 font-mono">{user?.role || 'Principal Investigator'}</p>
              <p className="text-xs text-slate-500 mt-1">{user?.institution || 'Biotechnology Research Center'}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span className="text-slate-400 flex items-center gap-2"><Mail size={14} /> Institutional Email:</span>
              <span className="text-white">{user?.email || 'researcher@amrsentinel.org'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span className="text-slate-400 flex items-center gap-2"><Shield size={14} /> System ID:</span>
              <span className="text-slate-400">{user?.id || 'usr_default_001'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span className="text-slate-400 flex items-center gap-2"><Building size={14} /> Access Level:</span>
              <span className="text-teal-400 font-bold">Research Tier 1 (Full Pipeline Access)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-mono">
              <Key size={16} className="text-teal-400" />
              Security Settings
            </h4>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Maintain institutional compliance by updating your session access keys.
            </p>
            {pwMsg && (
              <div className="mt-3 p-3 bg-teal-950/40 border border-teal-800 text-teal-300 rounded-xl text-xs font-mono">
                {pwMsg}
              </div>
            )}
          </div>

          <button
            onClick={handlePasswordReset}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all"
          >
            Request Password Update
          </button>
        </div>
      </div>
    </div>
  );
};
