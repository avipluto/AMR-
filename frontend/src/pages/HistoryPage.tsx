import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History, Search, Calendar, Database, CheckCircle, ShieldAlert } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [isolates, setIsolates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [organismFilter, setOrganismFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [organismFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/isolates', {
        params: { limit: 100, organism: organismFilter }
      });
      setIsolates(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = isolates.filter((iso) =>
    iso.isolate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iso.antibiotic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iso.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <History size={20} className="text-teal-400" />
          Analysis Run History & Isolate Ledger
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          LONGITUDINAL ISOLATE OBSERVATIONS &bull; LABORATORY SUSCEPTIBILITY ARCHIVE
        </p>
      </div>

      <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Isolate ID, drug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>

          <select
            value={organismFilter}
            onChange={(e) => setOrganismFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
          >
            <option value="All">All Organisms</option>
            <option value="Escherichia coli">Escherichia coli</option>
            <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
            <option value="Staphylococcus aureus">Staphylococcus aureus</option>
            <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
          </select>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 sticky top-0 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Isolate ID</th>
                <th className="p-3">Organism</th>
                <th className="p-3">Collection Date</th>
                <th className="p-3">Center / Location</th>
                <th className="p-3">Antibiotic</th>
                <th className="p-3">Zone (mm)</th>
                <th className="p-3">MIC (µg/mL)</th>
                <th className="p-3">Phenotype</th>
                <th className="p-3">Genomic Markers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((iso) => {
                const isR = iso.susceptibility === 'R';
                const isS = iso.susceptibility === 'S';
                const badge = isR
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : isS
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800';

                return (
                  <tr key={`${iso.isolate_id}-${iso.antibiotic}`} className="hover:bg-slate-900/30">
                    <td className="p-3 font-bold text-teal-400">{iso.isolate_id}</td>
                    <td className="p-3 italic text-white font-sans">{iso.organism}</td>
                    <td className="p-3 text-slate-400">{iso.collection_date}</td>
                    <td className="p-3 text-slate-300 font-sans">{iso.location}</td>
                    <td className="p-3 font-semibold text-slate-200 font-sans">{iso.antibiotic}</td>
                    <td className="p-3 text-white">{iso.zone_diameter_mm ? `${iso.zone_diameter_mm} mm` : '—'}</td>
                    <td className="p-3 text-white">{iso.mic ? `${iso.mic} µg/mL` : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border font-bold ${badge}`}>
                        {iso.susceptibility}
                      </span>
                    </td>
                    <td className="p-3">
                      {iso.genomic_features ? (
                        <span className="text-[10px] bg-slate-900 text-purple-300 px-2 py-0.5 rounded border border-purple-900/80">
                          {iso.genomic_features}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
