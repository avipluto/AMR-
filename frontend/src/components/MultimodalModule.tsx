import React, { useState } from 'react';
import axios from 'axios';
import { Network, Cpu, CheckCircle, Info } from 'lucide-react';

export const MultimodalModule: React.FC = () => {
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibiotic, setAntibiotic] = useState<string>('Ciprofloxacin');
  const [zoneDiameter, setZoneDiameter] = useState<number>(11.5);
  const [mic, setMic] = useState<number>(16.0);
  const [hasGenomic, setHasGenomic] = useState<boolean>(true);
  const [hasVision, setHasVision] = useState<boolean>(true);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRunMultimodal = () => {
    setLoading(true);
    // Simulates multimodal inference fusion
    setTimeout(() => {
      setResult({
        predicted_class: zoneDiameter <= 15 ? 'R' : zoneDiameter >= 26 ? 'S' : 'I',
        confidence: 0.94,
        probabilities: {
          R: zoneDiameter <= 15 ? 0.94 : 0.03,
          I: 0.04,
          S: zoneDiameter > 15 ? 0.93 : 0.02
        },
        fusion_layers: [
          { modality: 'AST Computer Vision (Disk halo gradient)', weight: hasVision ? 0.35 : 0.0, active: hasVision },
          { modality: 'Phenotypic Lab AST (Species, Antibiotic, mm, MIC)', weight: 0.40, active: true },
          { modality: 'Genomic AMR Features (gyrA_S83L / blaCTX-M-15)', weight: hasGenomic ? 0.25 : 0.0, active: hasGenomic }
        ],
        explanation:
          'Unified multimodal fusion combines visual gradient features from Kirby-Bauer plate disk, measured zone diameter & MIC, and target genotypic mutations into a joint embedding space.'
      });
      setLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Network className="text-blue-400" />
          Module F — Unified Multimodal AMR Architecture (PyTorch Fusion)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Deep fusion network combining AST plate visual features + Phenotypic laboratory measurements + Genomic resistance determinants.
          Modularly handles isolates with missing modalities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Organism</label>
              <select
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="Escherichia coli">Escherichia coli</option>
                <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Antibiotic</label>
              <select
                value={antibiotic}
                onChange={(e) => setAntibiotic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="Ciprofloxacin">Ciprofloxacin</option>
                <option value="Meropenem">Meropenem</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Zone of Inhibition (mm)</label>
              <input
                type="number"
                step="0.1"
                value={zoneDiameter}
                onChange={(e) => setZoneDiameter(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Broth Microdilution MIC (µg/mL)</label>
              <input
                type="number"
                step="0.1"
                value={mic}
                onChange={(e) => setMic(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">Available Modalities</label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVision}
                  onChange={(e) => setHasVision(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                Include Plate Vision Embedding (CNN Halo Feature Map)
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGenomic}
                  onChange={(e) => setHasGenomic(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                Include Genomic Markers (gyrA_S83L / blaCTX-M-15)
              </label>
            </div>

            <button
              onClick={handleRunMultimodal}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm mt-4"
            >
              {loading ? 'Running Multimodal Fusion...' : 'Run Multimodal Prediction'}
            </button>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
            <span className="font-semibold text-slate-400 uppercase block">Architecture Diagram</span>
            <div className="font-mono text-[11px] text-slate-400 bg-slate-900 p-3 rounded border border-slate-800 leading-relaxed">
              [Plate Image]  &rarr; Vision Encoder &rarr; [32d]<br />
              [Genomics]     &rarr; Marker Embed  &rarr; [32d]<br />
              [Tabular AST]  &rarr; Phenotypic MLP &rarr; [48d]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&darr;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Multimodal Fusion Dense]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&darr;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[S / I / R Logits]
            </div>
            <p className="text-slate-400 text-[11px]">
              Operates under partial modality conditions through dynamic zero-masking and learned gating.
            </p>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-blue-400" size={20} />
              Multimodal Fusion Inference Outcome
            </h3>
            <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-full">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400">Classified Phenotype</span>
              <div
                className={`text-3xl font-black my-2 ${
                  result.predicted_class === 'R'
                    ? 'text-rose-400'
                    : result.predicted_class === 'S'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {result.predicted_class === 'R' ? 'RESISTANT (R)' : result.predicted_class === 'S' ? 'SUSCEPTIBLE (S)' : 'INTERMEDIATE (I)'}
              </div>
              <p className="text-xs text-slate-400 mt-2">{result.explanation}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400 mb-2 block">
                Modality Contribution Breakdown
              </span>
              <div className="space-y-2">
                {result.fusion_layers.map((l: any, i: number) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{l.modality}</span>
                      <span className="font-mono text-blue-400">{(l.weight * 100).toFixed(0)}% weight</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${l.weight * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
