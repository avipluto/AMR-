import React, { useState } from 'react';
import { api } from '../services/api';
import { Dna, CheckCircle2, AlertCircle, FileText, Loader2, Info } from 'lucide-react';

export const GenomicExplorerPage: React.FC = () => {
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [inputType, setInputType] = useState<string>('gene_list');
  const [content, setContent] = useState<string>('blaCTX-M-15\ngyrA_S83L\naac(6\')-Ib-cr');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/genomics/analyze', {
        organism,
        input_type: inputType,
        content
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Genomic analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Dna size={20} className="text-teal-400" />
          Genomic AMR Explorer
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          RESISTANCE DETERMINANT DETECTION &bull; TARGET ALTERATION & BETA-LACTAMASE CATALOG
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Genomic Sequence / Token Ingestion
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1.5">
                Target Organism
              </label>
              <select
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 text-xs font-mono"
              >
                <option value="Escherichia coli">Escherichia coli</option>
                <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
                <option value="Staphylococcus aureus">Staphylococcus aureus</option>
                <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1.5">
                Format
              </label>
              <select
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 text-xs font-mono"
              >
                <option value="gene_list">Gene / Mutation Token List</option>
                <option value="fasta">FASTA Sequence / Header</option>
                <option value="amrfinder_table">AMRFinderPlus / CARD Tabular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1.5">
                Content
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter gene symbols (e.g. blaKPC-2, blaNDM-1, mecA, tet(A), gyrA_S83L)..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Analyze Genomic Markers</span>}
              </button>
              <button
                type="button"
                onClick={() => setContent('>contig_01 Klebsiella pneumoniae\nblaKPC-2 carbapenemase\ngyrA_S83L fluoroquinolone resistance target mutation')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold border border-slate-800"
              >
                Load Sample
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-7 bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Resistance Determinants Identified
            </h3>
            {result && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                {result.detected_features.length} MARKERS DETECTED
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                {result.summary_text}
              </div>

              <div className="space-y-3">
                {result.detected_features.map((f: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-teal-300">{f.gene_or_mutation}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {f.family}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong className="text-slate-400">Mechanism:</strong> {f.mechanism}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">Associated Classes:</span>
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 font-mono text-[11px]">
                        {f.drug_class}
                      </span>
                    </div>

                    <div className="p-2.5 bg-amber-950/20 border border-amber-900/50 rounded-lg text-[11px] text-amber-300/90 leading-relaxed font-mono">
                      {f.phenotypic_caution}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200/90 flex items-start gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-400" />
                <span>{result.phenotypic_vs_genotypic_note}</span>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              No genomic markers queried yet. Select an organism and enter gene identifiers to execute analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
