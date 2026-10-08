import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, TrendingUp, AlertTriangle, Filter, Database, ShieldCheck } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

export const SurveillancePage: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [emerging, setEmerging] = useState<any[]>([]);
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibiotic, setAntibiotic] = useState<string>('Ciprofloxacin');
  const [location, setLocation] = useState<string>('All');

  useEffect(() => {
    fetchSurveillanceData();
  }, [location]);

  useEffect(() => {
    fetchTrends();
  }, [organism, antibiotic, location]);

  const fetchSurveillanceData = async () => {
    try {
      const [hm, em] = await Promise.all([
        api.get('/surveillance/heatmap', { params: { location } }),
        api.get('/surveillance/emerging')
      ]);
      setHeatmap(hm.data);
      setEmerging(em.data);
    } catch (e) {
      console.error(e);
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
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity size={20} className="text-teal-400" />
          AMR Intelligence Center & Multi-Center Surveillance
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          EPIDEMIOLOGICAL POPULATION-LEVEL TREND SIGNALS &bull; MULTIDRUG RESISTANCE SURVEILLANCE
        </p>
      </div>

      {/* Emerging Signals Alerts */}
      <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Emerging Resistance Trends (Change-Point & Linear Slope Detection)
          </h3>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
            MIN $N \ge 25$ SAFEGUARD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {emerging.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-xs italic">
                  {item.organism} &bull; <span className="not-italic text-slate-300">{item.antibiotic}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-bold">
                  SCORE: {item.amr_trend_score}/100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div>Current: <strong className="text-rose-400">{item.current_resistance_pct}%</strong></div>
                <div>12-Mo Shift: <strong className="text-amber-400">+{item.change_12mo_pct}%</strong></div>
                <div>Trajectory: <span className="text-slate-400">{item.trend_direction} (+{item.annual_slope}%/yr)</span></div>
                <div>Evidence: <span className="text-teal-400">{item.confidence}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono space-y-1">
                {item.contributing_factors.map((f: string, fi: number) => (
                  <div key={fi} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-teal-400" />
              Longitudinal Susceptibility Trajectory
            </h3>
            <p className="text-xs text-slate-400">Validated across 2021–2025 temporal strata</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <select
              value={organism}
              onChange={(e) => setOrganism(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5"
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
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5"
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

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5"
            >
              <option value="All">All Centers</option>
              <option value="North Region (Hospital A)">North Region (Hospital A)</option>
              <option value="South District (General)">South District (General)</option>
              <option value="East Metro Clinic">East Metro Clinic</option>
              <option value="West Medical Center">West Medical Center</option>
            </select>
          </div>
        </div>

        <div className="h-80 w-full">
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#172234" />
                <XAxis dataKey="year" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis unit="%" stroke="#475569" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
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
              No trend data available for current selection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
