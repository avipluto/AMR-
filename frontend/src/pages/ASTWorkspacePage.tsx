import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  FileDown,
  Layers,
  Info,
  Dna,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { PlateAnalysisResult } from '../types';

export const ASTWorkspacePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [organism, setOrganism] = useState<string>('Escherichia coli');
  const [antibioticsList, setAntibioticsList] = useState<string>('CIP, GEN, AMP, TET, CRO, MEM');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PlateAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Workspace controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // PDF Generation State
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setPdfDownloadUrl(null);
      setZoomLevel(1);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setPdfDownloadUrl(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('organism', organism);
    formData.append('antibiotics', antibioticsList);

    try {
      const res = await api.post<PlateAnalysisResult>('/ast/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AST Image processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!result) return;
    setPdfGenerating(true);
    try {
      const res = await api.post('/reports/generate/ast', {
        analysis_data: result
      });
      setPdfDownloadUrl(res.data.download_url);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Report generation failed.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const loadSyntheticDemo = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark agar background
    ctx.fillStyle = '#222938';
    ctx.fillRect(0, 0, 400, 400);

    // Plate rim
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#374151';
    ctx.stroke();

    // Antibiotic disks with zones
    const disks = [
      { x: 140, y: 150, zr: 16, label: 'AMP' }, // Resistant
      { x: 260, y: 150, zr: 45, label: 'CIP' }, // Susceptible
      { x: 200, y: 260, zr: 32, label: 'GEN' }, // Susceptible
      { x: 200, y: 120, zr: 18, label: 'TET' }, // Resistant
    ];

    disks.forEach((d) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.zr, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(d.x, d.y, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, d.x, d.y + 3);
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'synthetic_ast_plate.png', { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL());
        setResult(null);
        setPdfDownloadUrl(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Digital Microbiology Lab Workspace
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            KIRBY-BAUER DISK DIFFUSION PROFILER &bull; RADIAL HALO SEGMENTATION
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-3">
            {!pdfDownloadUrl ? (
              <button
                onClick={handleGeneratePDF}
                disabled={pdfGenerating}
                className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating Scientific Report...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={14} />
                    <span>Generate PDF Report</span>
                  </>
                )}
              </button>
            ) : (
              <a
                href={pdfDownloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <FileDown size={14} />
                <span>Download Scientific PDF</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace Split (Left Image Canvas, Right Control & Findings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Large Image Workspace (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                AST Plate Image Canvas
              </span>
              {/* Workspace Tools: Zoom, Pan, Reset */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw size={15} />
                </button>
                <span className="px-2 text-[10px] font-mono text-slate-400">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                {result?.annotated_image_base64 && (
                  <button
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      showAnnotations
                        ? 'bg-teal-950 text-teal-300 border-teal-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Annotations
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center min-h-[380px] bg-slate-950/70 border border-slate-800/60 rounded-xl overflow-hidden relative">
              {result && showAnnotations && result.annotated_image_base64 ? (
                <div
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-[420px]"
                >
                  <img
                    src={result.annotated_image_base64}
                    alt="Annotated Plate"
                    className="max-h-[400px] object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : previewUrl ? (
                <div
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-[420px]"
                >
                  <img
                    src={previewUrl}
                    alt="Plate Preview"
                    className="max-h-[400px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm font-semibold text-slate-300">
                    Drop AST Plate Image Here
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Supports high-resolution Petri dish photographs (PNG, JPG, TIFF).
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <label
                      htmlFor="plate-file-input"
                      className="cursor-pointer bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-teal-500/20"
                    >
                      Upload Plate Image
                    </label>
                    <button
                      type="button"
                      onClick={loadSyntheticDemo}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-800"
                    >
                      Load Standard Sample
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="plate-file-input"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Canvas Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>CALIBRATION: {result ? result.calibration_method : 'Standard 6.0 mm Disk'}</span>
            <span>SCALE: {result?.pixels_per_mm ? `${result.pixels_per_mm} px/mm` : 'Uncalibrated'}</span>
          </div>
        </div>

        {/* Right: Analysis Panel & Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight">Analysis Panel</h3>
            <p className="text-xs text-slate-400">Pathogen panel and calibration parameters</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1.5">
                Bacterial Organism
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
                Antibiotic Panel Order
              </label>
              <input
                type="text"
                value={antibioticsList}
                onChange={(e) => setAntibioticsList(e.target.value)}
                placeholder="CIP, GEN, AMP, TET, CRO"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Sequence of antibiotic disks positioned on the agar lawn
              </span>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20 text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Segmenting Zones & Halos...</span>
                </>
              ) : (
                <span>Run Vision Pipeline & Breakpoint Lookup</span>
              )}
            </button>

            {error && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Results Summary if analysis complete */}
          {result && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Identified Antibiotics ({result.disks.length})
                </span>
                <span className="text-[10px] text-teal-400 font-mono">CLSI M100:2023</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {result.disks.map((d) => {
                  const c = d.interpretation?.classification || 'Pending';
                  const isR = c === 'R';
                  const isS = c === 'S';
                  const isI = c === 'I';
                  const badgeColor = isR
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : isS
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : isI
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800';

                  return (
                    <div
                      key={d.disk_id}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">
                          {d.antibiotic_name} ({d.antibiotic_code})
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Zone: <strong className="text-white">{d.zone_diameter_mm ? `${d.zone_diameter_mm} mm` : 'Uncalibrated'}</strong>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${badgeColor}`}>
                        {c === 'R' ? 'RESISTANT (R)' : c === 'S' ? 'SUSCEPTIBLE (S)' : c === 'I' ? 'INTERMEDIATE (I)' : c}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
