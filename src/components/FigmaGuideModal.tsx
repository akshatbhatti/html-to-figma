import React from 'react';
import { X, Copy, Download, Layers, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';

interface FigmaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FigmaGuideModal: React.FC<FigmaGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How to Import into Figma</h2>
              <p className="text-xs text-slate-400">Two production-grade methods supported</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 pt-5">
          {/* Method 1: Instant Clipboard Paste */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                1
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Direct Paste to Figma Canvas (Recommended)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Instant
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you click <span className="font-semibold text-indigo-400">"Copy to Figma"</span>, the app generates the native binary Kiwi clipboard payload inside a Figma HTML envelope (<code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded text-[11px]">&lt;span data-buffer="..."&gt;</code>).
            </p>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md font-mono text-xs font-bold text-indigo-300 shadow-xs">
                Ctrl + V
              </kbd>
              <span>or</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md font-mono text-xs font-bold text-indigo-300 shadow-xs">
                Cmd + V
              </kbd>
              <span className="text-slate-400">directly inside any opened Figma file!</span>
            </div>
          </div>

          {/* Method 2: .fig File Import */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                2
              </div>
              <h3 className="text-sm font-bold text-white">
                Download and Open Native .fig File
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you click <span className="font-semibold text-indigo-400">"Download .fig"</span>, the application bundles a full Figma design archive containing <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded text-[11px]">canvas.fig</code> (Kiwi binary) and <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded text-[11px]">meta.json</code>.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Drag & Drop:</strong> Drag the downloaded <code className="text-indigo-300 font-mono text-[11px]">.fig</code> file straight into your Figma file browser or draft list.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Import Menu:</strong> In Figma, click the <strong>Import</strong> button on the top right, or choose <strong>File → New from Sketch / Figma File</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Responsive Suite & Form Fidelity */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs text-indigo-200/90 leading-relaxed">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Artboard Suite & Form Controls</span>
            </div>
            <p>
              • <strong>Copy All Viewports:</strong> Click <span className="font-semibold text-cyan-300">"Copy Desktop, Laptop, Mobile"</span> to place 4 artboards (Desktop 1440, Laptop 1200, Tablet 768, and Mobile 375) side-by-side onto your Figma canvas in one paste!
            </p>
            <p>
              • <strong>Form Inputs & Selects:</strong> Form fields, text inputs, textareas, selects, checkboxes, and buttons are automatically converted with full visual fidelity, real labels, and placeholder text.
            </p>
            <p>
              • <strong>Clean Canvas:</strong> Off-screen mobile navigation drawers and hidden modal overlays are automatically filtered out, ensuring no overlapping text artifacts at the top of your frame.
            </p>
          </div>

          {/* Architecture & Auto Layout Note */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs text-slate-400 leading-relaxed">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Auto Layout & Font Resolution</span>
            </div>
            <p>
              • <strong>Flexbox to Auto Layout:</strong> CSS <code className="font-mono text-slate-300 text-[11px]">display: flex</code>, <code className="font-mono text-slate-300 text-[11px]">flex-direction</code>, gap, and alignment properties are converted to native Figma Auto Layout stacks.
            </p>
            <p>
              • <strong>Fonts:</strong> Google Fonts (Inter, Plus Jakarta Sans, Roboto, Poppins, etc.) resolve automatically. Local system fonts render instantly via Figma's font resolver.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-5 mt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition shadow-sm"
          >
            Got it, Let's Design
          </button>
        </div>
      </div>
    </div>
  );
};
