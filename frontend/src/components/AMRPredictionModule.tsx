import React, { useState } from 'react';
import axios from 'axios';
import { BrainCircuit, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export const AMRPredictionModule: React.FC = () => {
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibiotic, setAntibiotic] = useState<string>('Ciprofloxacin');
  const [zoneDiameter, setZoneDiameter] = useState<number>(14.0);
  const [diskDiameter, setDiskDiameter] = useState<number>(6.0);
  const [mic, setMic] = useState<string>('');
  const [genomicMarkers, setGenomicMarkers] = useState<string>('gyrA_S83L');
  const [modelType, setModelType] = useState<string>('Random Forest');

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const markers = genomicMarkers.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const res = await axios.post('/api/amr/predict', {
        organism,
        antibiotic,
        zone_diameter_mm: Number(zoneDiameter),
        disk_diameter_mm: Number(diskDiameter),
        mic: mic ? parseFloat(mic) : null,
        genomic_features: markers
      });
      setPrediction(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Inference call failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BrainCircuit className="text-purple-400" />
          Module B — Machine Learning AMR Susceptibility Prediction
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Predicts phenotypic Susceptible (S), Intermediate (I), or Resistant (R) classifications
          trained with balanced class weighting and temporal train/test split validation (Macro-F1, Balanced Accuracy).
        </p>

        <form onSubmit={handlePredict} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-4">
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
                Antibiotic Candidate
              </label>
              <select
                value={antibiotic}
                onChange={(e) => setAntibiotic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="Ciprofloxacin">Ciprofloxacin (CIP)</option>
                <option value="Gentamicin">Gentamicin (GEN)</option>
                <option value="Ampicillin">Ampicillin (AMP)</option>
                <option value="Tetracycline">Tetracycline (TET)</option>
                <option value="Ceftriaxone">Ceftriaxone (CRO)</option>
                <option value="Meropenem">Meropenem (MEM)</option>
                <option value="Oxacillin">Oxacillin (OXA)</option>
                <option value="Vancomycin">Vancomycin (VAN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Zone of Inhibition Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={zoneDiameter}
                onChange={(e) => setZoneDiameter(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Disk Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={diskDiameter}
                onChange={(e) => setDiskDiameter(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Broth Microdilution MIC (optional µg/mL)
              </label>
              <input
                type="number"
                step="0.01"
                value={mic}
                onChange={(e) => setMic(e.target.value)}
                placeholder="e.g. 16.0"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Genomic Markers Observed (comma-separated)
              </label>
              <input
                type="text"
                value={genomicMarkers}
                onChange={(e) => setGenomicMarkers(e.target.value)}
                placeholder="blaCTX-M-15, gyrA_S83L"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Inference Classifier
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              >
                <option value="Random Forest">Random Forest (Ensemble)</option>
                <option value="XGBoost">XGBoost (Gradient Boosted Trees)</option>
                <option value="Logistic Regression">Logistic Regression (L2 Balanced)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Evaluating Model...' : 'Predict Susceptibility'}
            </button>

            {error && <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800">{error}</div>}
          </div>
        </form>
      </div>

      {prediction && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-purple-400" size={20} />
              Prediction & Model Explainability
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Model: {prediction.model_used}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/70 p-5 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase font-semibold text-slate-400">Predicted Phenotype</span>
              <div
                className={`text-4xl font-black my-2 px-6 py-2 rounded-lg border ${
                  prediction.predicted_class === 'R'
                    ? 'text-rose-400 border-rose-800 bg-rose-950/30'
                    : prediction.predicted_class === 'S'
                    ? 'text-emerald-400 border-emerald-800 bg-emerald-950/30'
                    : 'text-amber-400 border-amber-800 bg-amber-950/30'
                }`}
              >
                {prediction.predicted_class === 'R'
                  ? 'RESISTANT (R)'
                  : prediction.predicted_class === 'S'
                  ? 'SUSCEPTIBLE (S)'
                  : 'INTERMEDIATE (I)'}
              </div>
              <span className="text-xs text-slate-400">
                Confidence Estimate: <strong className="text-white">{(prediction.confidence * 100).toFixed(1)}%</strong>
              </span>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-lg border border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-2">Class Probabilities</span>
              <div className="space-y-2 text-xs">
                {Object.entries(prediction.probabilities).map(([cls, prob]: any) => (
                  <div key={cls}>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{cls === 'R' ? 'Resistant' : cls === 'S' ? 'Susceptible' : 'Intermediate'}</span>
                      <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          cls === 'R' ? 'bg-rose-500' : cls === 'S' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-lg border border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-2">Explainability Evidence</span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {prediction.evidence.map((ev: string, idx: number) => (
                  <li key={idx} className="leading-tight text-slate-300">
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-200/90">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{prediction.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
