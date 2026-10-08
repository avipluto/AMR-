import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Dna,
  Image as ImageIcon,
  Activity,
  History,
  FileText,
  Cpu,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  Bell
} from 'lucide-react';

interface ShellLayoutProps {
  children: React.ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    {
      group: 'Analyze',
      items: [
        { label: 'AST Plate Lab', to: '/analyze/ast', icon: ImageIcon },
        { label: 'Genomic Analysis', to: '/analyze/genomic', icon: Dna },
      ]
    },
    { label: 'Surveillance', to: '/surveillance', icon: Activity },
    { label: 'History', to: '/history', icon: History },
    { label: 'Reports', to: '/reports', icon: FileText },
    { label: 'AI Model Lab', to: '/models', icon: Cpu },
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Scientific Command Center';
    if (p.includes('/analyze/ast')) return 'Digital Microbiology Lab Workspace';
    if (p.includes('/analyze/genomic')) return 'Genomic AMR Explorer';
    if (p.includes('/surveillance')) return 'AMR Intelligence Center';
    if (p.includes('/history')) return 'Analysis Run History';
    if (p.includes('/reports')) return 'Scientific Reports & PDF Registry';
    if (p.includes('/models')) return 'AI Model Lab & Performance';
    if (p.includes('/profile')) return 'Investigator Profile';
    return 'Research Workspace';
  };

  return (
    <div className="min-h-screen flex bg-[#080c14] text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } shrink-0 bg-[#090f1a] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 relative z-30`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-md shadow-teal-500/20">
                <Dna size={20} className="stroke-[2.5]" />
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                    AMR SENTINEL
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono tracking-wider">
                    INTELLIGENCE LAB
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item, idx) => {
              if (item.group) {
                return (
                  <div key={idx} className="pt-3 pb-1">
                    {!collapsed && (
                      <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {item.group}
                      </div>
                    )}
                    <div className="space-y-1">
                      {item.items.map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 font-bold shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                              }`
                            }
                            title={collapsed ? sub.label : undefined}
                          >
                            <Icon size={18} className="shrink-0" />
                            {!collapsed && <span>{sub.label}</span>}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const Icon = item.icon!;
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User / Settings Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
            title={collapsed ? 'Investigator Profile' : undefined}
          >
            <User size={18} className="shrink-0 text-slate-400" />
            {!collapsed && (
              <div className="truncate text-left">
                <div className="font-semibold text-slate-200 truncate">{user?.full_name || 'Senior Investigator'}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.role || 'Microbiology Specialist'}</div>
              </div>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Research Disclaimer Header */}
        <div className="bg-amber-950/70 border-b border-amber-900/50 px-4 py-2 text-[11px] text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ShieldAlert size={14} className="shrink-0 text-amber-400" />
            <span>
              <strong>RESEARCH & EDUCATIONAL SYSTEM:</strong> Not validated for direct patient clinical diagnostics or antibiotic therapy selection. Results require authorized clinical microbiology confirmation.
            </span>
          </div>
        </div>

        {/* Top Action Bar */}
        <header className="h-16 bg-[#090f1a]/80 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">{getPageTitle()}</h1>
            <div className="text-[11px] text-slate-400 font-mono">CLSI M100 PERFORMANCE STANDARD &bull; COHORT 2021-2025</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search isolates, drugs, genes..."
                className="bg-slate-950 border border-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs w-60 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative">
              <Bell size={16} />
              <span className="w-2 h-2 rounded-full bg-teal-400 absolute top-1.5 right-1.5" />
            </button>
            <div className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-400 font-mono font-medium">
              NODE ACTIVE
            </div>
          </div>
        </header>

        {/* Dynamic Route Canvas */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
