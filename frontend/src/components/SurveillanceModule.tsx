import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Filter, Database, ShieldCheck } from 'lucide-react';
import { SurveillanceOverview, TrendDataPoint, HeatmapResponse, EmergingTrendItem } from '../types';

export const SurveillanceModule: React.FC = () => {
  const [overview, setOverview] = useState<SurveillanceOverview | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [emerging, setEmerging] = useState<EmergingTrendItem[]>([]);

  // Filter states
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibiotic, setAntibiotic] = useState<string>('Ciprofloxacin');
  const [location, setLocation] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOverview();
    fetchEmerging();
    fetchHeatmap();
  }, [location]);

  useEffect(() => {
    fetchTrends();
  }, [organism, antibiotic, location]);

  const fetchOverview = async () => {
    try {
      const res = await axios.get<SurveillanceOverview>('/api/surveillance/overview');
      setOverview(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await axios.get<TrendDataPoint[]>('/api/surveillance/trends', {
        params: { organism, antibiotic, location }
      });
      setTrends(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await axios.get<HeatmapResponse>('/api/surveillance/heatmap', {
        params: { location }
      });
      setHeatmap(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmerging = async () => {
    try {
      const res = await axios.get<EmergingTrendItem[]>('/api/surveillance/emerging');
      setEmerging(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Observations</span>
            <div className="text-2xl font-black text-white mt-1">{overview.total_observations.toLocaleString()}</div>
            <span className="text-[11px] text-slate-500">AST tests</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Unique Isolates</span>
            <div className="text-2xl font-black text-indigo-400 mt-1">{overview.total_isolates.toLocaleString()}</div>
            <span className="text-[11px] text-slate-500">Bacterial isolates</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Population Resistance</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{overview.resistance_rate_pct}%</div>
            <span className="text-[11px] text-slate-500">Overall cohort</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Susceptible Rate</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{overview.susceptibility_rate_pct}%</div>
            <span className="text-[11px] text-slate-500">Sensitive isolates</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Multidrug Resistance</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{overview.mdr_rate_pct}%</div>
            <span className="text-[11px] text-slate-500">≥3 drug classes ({overview.mdr_isolates_count})</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Emerging Signals</span>
            <div className="text-2xl font-black text-purple-400 mt-1">{overview.emerging_trends_count}</div>
            <span className="text-[11px] text-slate-500">High-trend alerts</span>
          </div>
        </div>
      )}

      {/* Emerging Resistance Signals Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <AlertTriangle className="text-amber-400" size={20} />
          Emerging Resistance Pattern Detection & Research AMR Trend Score
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Statistically derived alerts flagged by longitudinal change-point detection (minimum 25 isolate threshold).
          Never indicates certainty for an individual isolate.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emerging.map((item, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">
                  {item.organism} &bull; {item.antibiotic}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-semibold">
                  Score: {item.amr_trend_score}/100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 my-2">
                <div>Current: <strong className="text-rose-400">{item.current_resistance_pct}%</strong></div>
                <div>12-Mo Shift: <strong className="text-amber-400">+{item.change_12mo_pct}%</strong></div>
                <div>Trajectory: <span className="text-slate-400">{item.trend_direction} (+{item.annual_slope}%/yr)</span></div>
                <div>Evidence: <span className="text-emerald-400">{item.confidence} (n={item.sample_size_total})</span></div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 space-y-1">
                {item.contributing_factors.map((f, fi) => (
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

      {/* Resistance Trends Timeline Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={20} />
              Longitudinal Susceptibility & Resistance Trends (2021–2025)
            </h3>
            <span className="text-xs text-slate-400">
              Evaluates temporal shift across yearly surveillance strata.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter size={14} className="text-slate-400" />
              <select
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded p-1.5 text-xs"
              >
                <option value="All">All Organisms</option>
                <option value="Escherichia coli">Escherichia coli</option>
                <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
                <option value="Staphylococcus aureus">Staphylococcus aureus</option>
                <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={antibiotic}
                onChange={(e) => setAntibiotic(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded p-1.5 text-xs"
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

            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded p-1.5 text-xs"
              >
                <option value="All">All Locations</option>
                <option value="North Region (Hospital A)">North Region (Hospital A)</option>
                <option value="South District (General)">South District (General)</option>
                <option value="East Metro Clinic">East Metro Clinic</option>
                <option value="West Medical Center">West Medical Center</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis unit="%" stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="resistance_pct"
                  name="Resistance %"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="susceptible_pct"
                  name="Susceptible %"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="intermediate_pct"
                  name="Intermediate %"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No trend data matching selected criteria.
            </div>
          )}
        </div>
      </div>

      {/* AMR Antibiogram Heatmap */}
      {heatmap && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Activity className="text-cyan-400" size={20} />
            Population Antibiogram Heatmap (Resistance % Matrix)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Interactive grid cross-referencing bacterial pathogens against antibiotic panels. Colors reflect resistance rate.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300">
                  <th className="p-3 text-left">Organism</th>
                  {heatmap.antibiotics.map((ab) => (
                    <th key={ab} className="p-3">
                      {ab}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {heatmap.matrix.map((row) => (
                  <tr key={row.organism} className="hover:bg-slate-800/30">
                    <td className="p-3 text-left font-sans font-medium text-white">{row.organism}</td>
                    {heatmap.antibiotics.map((ab) => {
                      const cell = row[ab];
                      if (!cell || cell.resistance_pct === null) {
                        return (
                          <td key={ab} className="p-3 text-slate-600 bg-slate-950/40">
                            —
                          </td>
                        );
                      }
                      const rPct = cell.resistance_pct;
                      // Dynamic color grading based on resistance rate
                      let bg = 'bg-emerald-950/70 text-emerald-300 border border-emerald-800';
                      if (rPct >= 40) {
                        bg = 'bg-rose-950/80 text-rose-300 border border-rose-800';
                      } else if (rPct >= 20) {
                        bg = 'bg-amber-950/70 text-amber-300 border border-amber-800';
                      }

                      return (
                        <td key={ab} className="p-2">
                          <div className={`p-2 rounded font-bold ${bg}`}>
                            {rPct}%
                            <div className="text-[10px] opacity-70 font-sans">n={cell.sample_size}</div>
                          </div>
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
    </div>
  );
};
