import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Image as ImageIcon, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { PlateAnalysisResult } from '../types';

export const ASTImageModule: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibioticsList, setAntibioticsList] = useState<string>('CIP, GEN, AMP, TET, CRO, MEM');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PlateAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('organism', organism);
    formData.append('antibiotics', antibioticsList);

    try {
      const res = await axios.post<PlateAnalysisResult>('/api/ast/analyze', formData);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AST Image processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSyntheticDemo = async () => {
    // Generate synthetic plate via canvas and trigger analysis
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark agar background
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 400, 400);

    // Plate rim
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a202c';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4a5568';
    ctx.stroke();

    // Antibiotic disks with zones
    const disks = [
      { x: 140, y: 150, zr: 16, label: 'AMP' }, // Resistant
      { x: 260, y: 150, zr: 45, label: 'CIP' }, // Susceptible
      { x: 200, y: 260, zr: 32, label: 'GEN' }, // Susceptible/Intermediate
      { x: 200, y: 120, zr: 18, label: 'TET' }, // Resistant
    ];

    disks.forEach(d => {
      // Zone halo
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.zr, 0, 2 * Math.PI);
      ctx.fillStyle = '#171923';
      ctx.fill();
      ctx.strokeStyle = '#2b6cb0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Paper Disk
      ctx.beginPath();
      ctx.arc(d.x, d.y, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#edf2f7';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e0';
      ctx.stroke();

      // Text
      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, d.x, d.y + 3);
    });

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'synthetic_ast_plate.png', { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL());
        setResult(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="text-indigo-400" />
          Module A — AST Image Analysis (Kirby-Bauer Disk Diffusion)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Detects petri plate rim, identifies antibiotic paper disks, measures zones of inhibition (clearance haloes),
          applies 6.0mm physical calibration, and looks up CLSI M100 breakpoints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                Antibiotic Panel Order
              </label>
              <input
                type="text"
                value={antibioticsList}
                onChange={(e) => setAntibioticsList(e.target.value)}
                placeholder="CIP, GEN, AMP, TET, CRO"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
              />
              <span className="text-[11px] text-slate-500">Ordered disk labels mapped to detected disks</span>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="plate-file-upload"
              />
              <label htmlFor="plate-file-upload" className="cursor-pointer block">
                <Upload className="mx-auto text-slate-400 mb-2" size={28} />
                <span className="text-sm text-indigo-400 font-medium">Upload AST Plate Image</span>
                <span className="block text-xs text-slate-500 mt-1">PNG, JPG, or TIFF</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Processing CV...' : 'Run Vision Pipeline'}
              </button>
              <button
                type="button"
                onClick={loadSyntheticDemo}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-3 rounded-lg text-xs"
              >
                Load Sample
              </button>
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col items-center justify-center bg-slate-950/70 rounded-xl border border-slate-800 p-4 min-h-[300px]">
            {result?.annotated_image_base64 ? (
              <div className="text-center w-full">
                <div className="text-xs font-semibold text-slate-400 mb-2">Annotated AST Detection Plate</div>
                <img
                  src={result.annotated_image_base64}
                  alt="Annotated Plate"
                  className="max-h-[380px] mx-auto rounded-lg border border-slate-700 shadow-xl"
                />
              </div>
            ) : previewUrl ? (
              <div className="text-center w-full">
                <div className="text-xs font-semibold text-slate-400 mb-2">Original Upload Preview</div>
                <img
                  src={previewUrl}
                  alt="Plate preview"
                  className="max-h-[350px] mx-auto rounded-lg border border-slate-800"
                />
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No plate image uploaded or selected.</p>
                <p className="text-xs text-slate-600 mt-1">Upload an image or click "Load Sample" to test the pipeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={20} />
              Zone Measurements & Phenotypic Classification
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                Calibration: <strong className="text-indigo-300">{result.calibration_method}</strong> ({result.pixels_per_mm || 'N/A'} px/mm)
              </span>
            </div>
          </div>

          {result.calibration_warning && (
            <div className="bg-amber-950/50 border border-amber-800 text-amber-300 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
              <Info size={16} />
              <span>{result.calibration_warning}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Disk #</th>
                  <th className="p-3">Antibiotic</th>
                  <th className="p-3">Disk Dia (mm)</th>
                  <th className="p-3">Zone Dia (mm)</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Reference Standard</th>
                  <th className="p-3">Standard Breakpoint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result.disks.map((d) => {
                  const interp = d.interpretation;
                  const isR = interp?.classification === 'R';
                  const isS = interp?.classification === 'S';
                  const isI = interp?.classification === 'I';
                  const badgeColor = isR
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : isS
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isI
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                  return (
                    <tr key={d.disk_id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-xs">{d.disk_id}</td>
                      <td className="p-3 font-medium text-white">
                        {d.antibiotic_name} ({d.antibiotic_code})
                      </td>
                      <td className="p-3 text-slate-400">{d.disk_diameter_mm ? `${d.disk_diameter_mm} mm` : `${d.disk_diameter_px} px`}</td>
                      <td className="p-3 font-bold text-white">
                        {d.zone_diameter_mm ? `${d.zone_diameter_mm} mm` : `${d.zone_diameter_px} px`}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${badgeColor}`}>
                          {interp?.classification || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-400">
                        {interp?.standard ? `${interp.standard} ${interp.standard_version}` : 'N/A'}
                      </td>
                      <td className="p-3 text-xs text-slate-400">
                        {interp?.breakpoints ? (
                          <span>
                            S: {interp.breakpoints.susceptible} | R: {interp.breakpoints.resistant}
                          </span>
                        ) : (
                          'Unavailable'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
