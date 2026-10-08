import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Filter,
  Dna,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [emerging, setEmerging] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<any>(null);

  // Filters
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibiotic, setAntibiotic] = useState<string>('Ciprofloxacin');
  const [location, setLocation] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [location]);

  useEffect(() => {
    fetchTrends();
  }, [organism, antibiotic, location]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ovRes, hmRes, emRes] = await Promise.all([
        api.get('/surveillance/overview'),
        api.get('/surveillance/heatmap', { params: { location } }),
        api.get('/surveillance/emerging')
      ]);
      setOverview(ovRes.data);
      setHeatmap(hmRes.data);
      setEmerging(emRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await api.get('/surveillance/trends', {
        params: { organism, antibiotic, location }
      });
      setTrends(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Good morning, {user?.full_name?.split(' ')[0] || 'Investigator'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            CONTINUOUS ANTIMICROBIAL RESISTANCE POPULATION SURVEILLANCE &bull; RESEARCH NODE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/analyze/ast"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
          >
            <span>AST Plate Lab</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/analyze/genomic"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <span>Genomic Explorer</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Command Center Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b121e] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Resistance Rate
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-3xl font-black text-white mt-2 tracking-tight">
            {overview ? `${overview.resistance_rate_pct}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Cohort baseline frequency
          </div>
        </div>

        <div className="bg-[#0b121e] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Total Isolates
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 tracking-tight">
            {overview ? Number(overview.total_isolates).toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {overview ? `${overview.total_observations.toLocaleString()} AST tests` : 'Validated observations'}
          </div>
        </div>

        <div className="bg-[#0b121e] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Bacterial Organisms
            </span>
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 tracking-tight">
            {overview ? overview.organisms_analyzed : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {overview ? `${overview.antibiotics_analyzed} antibiotic panels` : 'Pathogen strata'}
          </div>
        </div>

        <div className="bg-[#0b121e] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Emerging Signals
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 tracking-tight">
            {overview ? overview.emerging_trends_count : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Trend alerts flagged ($n \ge 25$)
          </div>
        </div>
      </div>

      {/* Main Grid: Trends Chart + Emerging Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Trends Line Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-teal-400" />
                Longitudinal Resistance Trajectory (2021–2025)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Annual susceptibility trends stratified by pathogen and drug candidate.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="All">All Organisms</option>
                <option value="Escherichia coli">E. coli</option>
                <option value="Klebsiella pneumoniae">K. pneumoniae</option>
                <option value="Staphylococcus aureus">S. aureus</option>
                <option value="Pseudomonas aeruginosa">P. aeruginosa</option>
              </select>

              <select
                value={antibiotic}
                onChange={(e) => setAntibiotic(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="All">All Antibiotics</option>
                <option value="Ciprofloxacin">Ciprofloxacin</option>
                <option value="Gentamicin">Gentamicin</option>
                <option value="Ampicillin">Ampicillin</option>
                <option value="Tetracycline">Tetracycline</option>
                <option value="Ceftriaxone">Ceftriaxone</option>
                <option value="Meropenem">Meropenem</option>
                <option value="Oxacillin">Oxacillin</option>
              </select>
            </div>
          </div>

          <div className="h-72 w-full">
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#172234" />
                  <XAxis dataKey="year" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis unit="%" stroke="#475569" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="resistance_pct"
                    name="Resistant (R) %"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f43f5e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="susceptible_pct"
                    name="Susceptible (S) %"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="intermediate_pct"
                    name="Intermediate (I) %"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No surveillance data available for this query.
              </div>
            )}
          </div>
        </div>

        {/* Right: Emerging Resistance Signals */}
        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                Emerging Resistance Signals
              </h3>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                ALERTS
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {emerging.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 italic">
                      {item.organism} &bull; <span className="not-italic text-slate-300">{item.antibiotic}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-bold">
                      SCORE: {item.amr_trend_score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div>Current: <strong className="text-rose-400">{item.current_resistance_pct}%</strong></div>
                    <div>12-Mo Delta: <strong className="text-amber-400">+{item.change_12mo_pct}%</strong></div>
                    <div>Trajectory: <span className="text-slate-400">{item.trend_direction}</span></div>
                    <div>Evidence: <span className="text-teal-400">{item.confidence}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/surveillance"
            className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-teal-400 hover:text-teal-300 flex items-center justify-between font-semibold"
          >
            <span>Explore all surveillance patterns</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Population Antibiogram Heatmap */}
      {heatmap && (
        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" />
                Antibiogram Heatmap (Resistance % Matrix)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Organism-by-antibiotic resistance matrix based on laboratory isolates.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-900 border border-emerald-700" /> &lt;20% Low</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-900 border border-amber-700" /> 20-39% Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-900 border border-rose-700" /> &ge;40% High</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-mono">
                  <th className="p-3 text-left font-semibold">Organism</th>
                  {heatmap.antibiotics.map((ab: string) => (
                    <th key={ab} className="p-3 font-semibold">
                      {ab}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {heatmap.matrix.map((row: any) => (
                  <tr key={row.organism} className="hover:bg-slate-900/30">
                    <td className="p-3 text-left font-sans font-medium text-white italic">{row.organism}</td>
                    {heatmap.antibiotics.map((ab: string) => {
                      const cell = row[ab];
                      if (!cell || cell.resistance_pct === null) {
                        return (
                          <td key={ab} className="p-2 text-slate-600 bg-slate-950/30">
                            —
                          </td>
                        );
                      }
                      const rPct = cell.resistance_pct;
                      let bg = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80';
                      if (rPct >= 40) {
                        bg = 'bg-rose-950/70 text-rose-300 border-rose-800/80 hover:bg-rose-900/80';
                      } else if (rPct >= 20) {
                        bg = 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/80';
                      }

                      return (
                        <td key={ab} className="p-2">
                          <button
                            onClick={() => setSelectedCell({ organism: row.organism, antibiotic: ab, ...cell })}
                            className={`w-full p-2 rounded-xl font-bold border transition-all ${bg}`}
                          >
                            <div>{rPct}%</div>
                            <div className="text-[10px] font-sans opacity-70">n={cell.sample_size}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Heatmap Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white">Heatmap Cell Inspection</h4>
              <button onClick={() => setSelectedCell(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Pathogen:</span>
                <span className="text-white italic">{selectedCell.organism}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Antibiotic:</span>
                <span className="text-white font-medium">{selectedCell.antibiotic}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Observed Resistance Rate:</span>
                <span className="text-rose-400 font-bold">{selectedCell.resistance_pct}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Sample Volume:</span>
                <span className="text-white font-mono">{selectedCell.sample_size} isolates</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Epidemiological Status:</span>
                <span className="text-teal-400 font-semibold">{selectedCell.status}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 rounded-xl transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
