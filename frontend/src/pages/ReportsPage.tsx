import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Download, Eye, Calendar, User, Search, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) =>
    r.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.organism.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.report_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText size={20} className="text-teal-400" />
            Scientific Reports & PDF Registry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            AUTHORIZED LABORATORY EVIDENCE &bull; REPORTLAB COMPILED RESEARCH DOSSIERS
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Registry</span>
        </button>
      </div>

      <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        {/* Search & Filter */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search Report ID or pathogen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            TOTAL GENERATED: <strong>{reports.length}</strong>
          </span>
        </div>

        {/* Table of PDF Reports */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                <th className="p-3">Report ID</th>
                <th className="p-3">Report Type</th>
                <th className="p-3">Pathogen</th>
                <th className="p-3">Generated Date</th>
                <th className="p-3">Investigator</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.report_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-bold text-teal-300">{r.report_id}</td>
                    <td className="p-3 font-sans text-slate-200">{r.report_type}</td>
                    <td className="p-3 italic text-white font-sans">{r.organism}</td>
                    <td className="p-3 text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-sans text-slate-300">{r.user_name || 'Senior Researcher'}</td>
                    <td className="p-3 text-right">
                      <a
                        href={`/api/reports/${r.report_id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500 hover:text-slate-950 transition-all font-bold font-sans text-xs"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    {loading ? 'Querying reports registry...' : 'No reports generated yet. Perform an AST analysis to synthesize a PDF.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
