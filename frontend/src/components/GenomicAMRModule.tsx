import React, { useState } from 'react';
import axios from 'axios';
import { Dna, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const GenomicAMRModule: React.FC = () => {
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [inputType, setInputType] = useState<string>('gene_list');
  const [content, setContent] = useState<string>(
    'blaCTX-M-15\ngyrA_S83L\naac(6\')-Ib-cr'
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/genomics/analyze', {
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dna className="text-emerald-400" />
          Module C — Genomic AMR Analysis (Genes & Canonical Mutations)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Identifies AMR determinants (beta-lactamases, QRDR mutations, efflux pumps) and maps resistance mechanisms.
          Strictly preserves the scientific distinction between <em>genotypic markers</em> and <em>phenotypic susceptibility</em>.
        </p>

        <form onSubmit={handleAnalyze} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Bacterial Organism
              </label>
              <select
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="Escherichia coli">Escherichia coli</option>
                <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
                <option value="Staphylococcus aureus">Staphylococcus aureus</option>
                <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Input Format
              </label>
              <select
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="gene_list">Gene / Mutation Token List</option>
                <option value="fasta">FASTA Header / Nucleotide Sequence</option>
                <option value="amrfinder_table">AMRFinderPlus / CARD Tabular Output</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Genomic Content / Gene Identifiers
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full font-mono text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-3"
              placeholder="Enter gene symbols (e.g. blaKPC-2, blaNDM-1, mecA, tet(A), gyrA_S83L)..."
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Searching Reference Catalog...' : 'Analyze Genomic Markers'}
            </button>
            <button
              type="button"
              onClick={() =>
                setContent(
                  '>contig_01 Klebsiella pneumoniae\nblaKPC-2 carbapenem-hydrolyzing beta-lactamase\ngyrA_S83L fluoroquinolone resistance target mutation'
                )
              }
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs"
            >
              Load Carbapenemase Sample
            </button>
          </div>

          {error && <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800">{error}</div>}
        </form>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={20} />
              Detected Genomic AMR Features
            </h3>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-medium">
              {result.detected_features.length} Features Identified
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono">
            {result.summary_text}
          </p>

          <div className="grid grid-cols-1 gap-4">
            {result.detected_features.map((f: any, idx: number) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-emerald-300">{f.gene_or_mutation}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {f.family}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-2">
                  <strong className="text-slate-400">Mechanism:</strong> {f.mechanism}
                </p>
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  <span className="text-slate-400 font-semibold">Implicated Class:</span>
                  <span className="bg-purple-950/70 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                    {f.drug_class}
                  </span>
                  <span className="text-slate-400 font-semibold ml-2">Associated Drugs:</span>
                  {f.associated_antibiotics.map((ab: string) => (
                    <span key={ab} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {ab}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900/50 p-2 rounded mt-2">
                  {f.phenotypic_caution}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-800/80 rounded-lg flex items-start gap-2.5 text-xs text-blue-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-400" />
            <span>{result.phenotypic_vs_genotypic_note}</span>
          </div>
        </div>
      )}
    </div>
  );
};
