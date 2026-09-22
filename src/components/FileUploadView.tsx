import React, { useRef, useState } from 'react';
import { UploadCloud, FileCode, Check, AlertCircle, Sparkles } from 'lucide-react';

interface FileUploadViewProps {
  onFileLoaded: (content: string, filename: string) => void;
}

export const FileUploadView: React.FC<FileUploadViewProps> = ({ onFileLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.match(/\.(html|htm|txt)$/i)) {
      setError('Please upload a valid .html, .htm, or web markup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setLoadedFileName(file.name);
        onFileLoaded(text, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.txt"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Drop your HTML file here, or click to browse
            </h3>
            <p className="text-xs text-slate-400">
              Supports raw HTML, Tailwind templates, exported web components (.html, .htm)
            </p>
          </div>

          {loadedFileName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Loaded: {loadedFileName}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
