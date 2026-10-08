import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Search, ShieldCheck } from 'lucide-react';
import { IsolateRecord } from '../types';

export const IsolatesExplorer: React.FC = () => {
  const [isolates, setIsolates] = useState<IsolateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [organismFilter, setOrganismFilter] = useState<string>('All');
  const [selectedIsolate, setSelectedIsolate] = useState<IsolateRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchIsolates();
  }, [organismFilter]);

  const fetchIsolates = async () => {
    setLoading(true);
    try {
      const res = await axios.get<IsolateRecord[]>('/api/surveillance/isolates', {
        params: { limit: 100, organism: organismFilter }
      });
      setIsolates(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = isolates.filter((iso) => {
    const matchesSearch =
      iso.isolate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iso.antibiotic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iso.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="text-indigo-400" />
              Bacterial Isolates Database (Phenotypic & Genotypic Records)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Curated repository of laboratory isolates with unified schema combining AST zone diameter, MIC, and genomic markers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search Isolate ID or drug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white pl-9 pr-3 py-2 rounded-lg text-xs w-64"
              />
            </div>

            <select
              value={organismFilter}
              onChange={(e) => setOrganismFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-lg text-xs"
            >
              <option value="All">All Organisms</option>
              <option value="Escherichia coli">Escherichia coli</option>
              <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
              <option value="Staphylococcus aureus">Staphylococcus aureus</option>
              <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 sticky top-0 uppercase text-slate-400">
              <tr>
                <th className="p-3">Isolate ID</th>
                <th className="p-3">Organism</th>
                <th className="p-3">Collection Date</th>
                <th className="p-3">Location / Center</th>
                <th className="p-3">Antibiotic</th>
                <th className="p-3">Zone (mm)</th>
                <th className="p-3">MIC (µg/mL)</th>
                <th className="p-3">Phenotype</th>
                <th className="p-3">Genomic Markers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((iso) => {
                const isR = iso.susceptibility === 'R';
                const isS = iso.susceptibility === 'S';
                const badge = isR
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : isS
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800';

                return (
                  <tr
                    key={`${iso.isolate_id}-${iso.antibiotic}`}
                    onClick={() => setSelectedIsolate(iso)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-medium text-indigo-300">{iso.isolate_id}</td>
                    <td className="p-3 italic text-white">{iso.organism}</td>
                    <td className="p-3 text-slate-400">{iso.collection_date}</td>
                    <td className="p-3 text-slate-400">{iso.location}</td>
                    <td className="p-3 font-semibold text-white">{iso.antibiotic}</td>
                    <td className="p-3 font-mono text-slate-200">{iso.zone_diameter_mm ? `${iso.zone_diameter_mm} mm` : '—'}</td>
                    <td className="p-3 font-mono text-slate-200">{iso.mic ? `${iso.mic} µg/mL` : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${badge}`}>
                        {iso.susceptibility}
                      </span>
                    </td>
                    <td className="p-3">
                      {iso.genomic_features ? (
                        <span className="font-mono text-[11px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-purple-900">
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

      {selectedIsolate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" size={20} />
              Individual Isolate Dossier: {selectedIsolate.isolate_id}
            </h3>
            <button
              onClick={() => setSelectedIsolate(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Dossier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-500 uppercase font-semibold">Organism</span>
              <div className="text-sm font-bold text-white mt-1 italic">{selectedIsolate.organism}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-500 uppercase font-semibold">Location / Center</span>
              <div className="text-sm font-bold text-white mt-1">{selectedIsolate.location}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-500 uppercase font-semibold">Testing Date</span>
              <div className="text-sm font-bold text-white mt-1">{selectedIsolate.collection_date}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-500 uppercase font-semibold">Phenotypic Result</span>
              <div className="text-sm font-bold text-rose-400 mt-1">
                {selectedIsolate.antibiotic} &bull; {selectedIsolate.susceptibility}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
            <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Genomic Resistance Determinants</h4>
            <p className="text-xs text-slate-300 font-mono">
              {selectedIsolate.genomic_features || 'No specific resistance-associated mutations or beta-lactamases reported.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
