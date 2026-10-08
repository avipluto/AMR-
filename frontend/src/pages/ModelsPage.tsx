import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Cpu, ShieldCheck, CheckCircle2, BarChart2 } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/model/performance');
      setMetrics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu size={20} className="text-teal-400" />
          AI Model Lab & Benchmark Performance
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          TEMPORAL TRAIN/TEST VALIDATION (TRAIN &le; 2023, TEST &ge; 2024) &bull; BALANCED ACCURACY & MACRO-F1
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics &&
          Object.entries(metrics).map(([modelName, data]: any) => (
            <div
              key={modelName}
              className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 space-y-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base">{modelName}</h3>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                    BENCHMARK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 text-center font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-xl font-bold text-teal-400">
                      {(data.macro_f1 * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Macro-F1</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-xl font-bold text-cyan-400">
                      {(data.balanced_accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Balanced Acc</div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
                    <span>Sensitivity (Resistant):</span>
                    <span className="text-white">{(data.sensitivity_resistant * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
                    <span>Specificity (Resistant):</span>
                    <span className="text-white">{(data.specificity_resistant * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
                    <span>Test Isolates:</span>
                    <span className="text-white">{data.test_samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
                    <span>Validation Split:</span>
                    <span className="text-teal-400">Temporal (2024-2025)</span>
                  </div>
                </div>

                {/* Confusion Matrix */}
                <div className="pt-4">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2 font-bold">
                    Confusion Matrix [Classes: I, R, S]
                  </span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-1">
                    {data.confusion_matrix.map((row: number[], ri: number) => (
                      <div key={ri} className="flex justify-around text-slate-300">
                        {row.map((val: number, ci: number) => (
                          <span
                            key={ci}
                            className={`w-12 text-center py-0.5 rounded ${
                              ri === ci ? 'bg-teal-950/70 text-teal-300 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-800">
                Trained on CLSI Kirby-Bauer & MIC Benchmark Cohort
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
