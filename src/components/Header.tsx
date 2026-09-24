import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Globe,
  UploadCloud,
  Download,
  Copy,
  Check,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Sparkles,
  HelpCircle,
  Bookmark,
  Layers2,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { InputMode, ViewportMode } from '../types';

interface HeaderProps {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  viewport: ViewportMode;
  setViewport: (viewport: ViewportMode) => void;
  autoLayout: boolean;
  setAutoLayout: (val: boolean) => void;
  onDownloadFig: () => void;
  onDownloadMultiArtboardFig: () => void;
  onCopyClipboard: () => void;
  onCopyResponsiveClipboard: () => void;
  onOpenGuide: () => void;
  onOpenBookmarklet: () => void;
  onLogout: () => void;
  isConverting: boolean;
  copied: boolean;
  copiedResponsive: boolean;
  documentName: string;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  viewport,
  setViewport,
  autoLayout,
  setAutoLayout,
  onDownloadFig,
  onDownloadMultiArtboardFig,
  onCopyClipboard,
  onCopyResponsiveClipboard,
  onOpenGuide,
  onOpenBookmarklet,
  onLogout,
  isConverting,
  copied,
  copiedResponsive,
  documentName,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
      {/* Brand & Document Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-sm tracking-tighter">
            .fig
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            HTML <span className="text-indigo-400">&rarr;</span> Figma
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden md:block"></div>

        <span
          className="text-xs text-slate-400 font-medium max-w-[180px] truncate hidden md:inline"
          title={documentName}
        >
          {documentName}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setMode('code')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            mode === 'code' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>HTML Code</span>
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            mode === 'url' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live URL</span>
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
            mode === 'upload' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>

      {/* Controls & Export Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Viewport Selectors */}
        <div className="hidden xl:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop (1440 × 900)"
            className={`p-1.5 rounded-lg text-xs transition ${
              viewport === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('laptop')}
            title="Laptop (1200 × 750)"
            className={`p-1.5 rounded-lg text-xs transition ${
              viewport === 'laptop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            title="Tablet (768 × 1024)"
            className={`p-1.5 rounded-lg text-xs transition ${
              viewport === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            title="Mobile (375 × 812)"
            className={`p-1.5 rounded-lg text-xs transition ${
              viewport === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Layout Toggle */}
        <button
          onClick={() => setAutoLayout(!autoLayout)}
          title="Infer Figma Auto Layout (Flexbox & Stacks) vs Absolute Positioning"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
            autoLayout
              ? 'bg-violet-950/40 border-violet-700/60 text-violet-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Auto Layout</span>
          <span className={`w-2 h-2 rounded-full ${autoLayout ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
        </button>

        {/* 1-Click Bookmarklet Tool */}
        <button
          onClick={onOpenBookmarklet}
          title="1-Click Browser Bookmarklet to capture any live website"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Guide Button */}
        <button
          onClick={onOpenGuide}
          title="How to import and paste into Figma"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onLogout}
          title="Log out"
          className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-0.5"></div>

        {/* FEATURE: Copy Whole Design for Current Viewport */}
        <button
          onClick={onCopyClipboard}
          disabled={isConverting}
          title="Copy the COMPLETE design (all sections from header to footer) to Figma clipboard. Then press Ctrl+V / Cmd+V in any Figma file!"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
          <span className="hidden md:inline">{copied ? 'Copied Full Design!' : 'Copy Whole Design'}</span>
          <span className="md:hidden">{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* NEW REQUESTED FEATURE: Copy Whole Design (Desktop, Laptop, Tablet, Mobile) */}
        <button
          onClick={onCopyResponsiveClipboard}
          disabled={isConverting}
          title="Copy the WHOLE design across all 4 responsive viewports (Desktop 1440, Laptop 1200, Tablet 768, Mobile 375) side-by-side to Figma clipboard. Then press Ctrl+V in Figma!"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-500/50 text-indigo-200 hover:text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          {copiedResponsive ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Layers2 className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="hidden lg:inline">
            {copiedResponsive ? 'Copied All 4 Viewports!' : 'Copy Desktop, Laptop, Mobile'}
          </span>
          <span className="lg:hidden">
            {copiedResponsive ? 'Copied Suite!' : 'Copy Responsive'}
          </span>
        </button>

        {/* Download .fig Dropdown Action */}
        <div className="relative" ref={downloadMenuRef}>
          <div className="inline-flex rounded-xl shadow-md shadow-indigo-600/20">
            <button
              onClick={onDownloadFig}
              disabled={isConverting}
              title="Download native Figma .fig file archive containing all sections"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {isConverting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Download .fig</span>
              <span className="sm:hidden">.fig</span>
            </button>
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={isConverting}
              title="More export options"
              className="px-1.5 py-1.5 rounded-r-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs border-l border-indigo-500/40 transition disabled:opacity-50"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {downloadMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => {
                  setDownloadMenuOpen(false);
                  onDownloadFig();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <div>
                  <div className="font-semibold">Single Viewport .fig</div>
                  <div className="text-[10px] text-slate-400">Current layout with all sections</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setDownloadMenuOpen(false);
                  onDownloadMultiArtboardFig();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Layers2 className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="font-semibold">Responsive Suite .fig</div>
                  <div className="text-[10px] text-slate-400">Desktop, Laptop, Tablet, Mobile side-by-side</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
