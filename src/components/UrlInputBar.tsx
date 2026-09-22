import React, { useState } from 'react';
import { Globe, ArrowRight, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface UrlInputBarProps {
  onFetchUrl: (url: string) => Promise<void>;
  isLoading: boolean;
  currentUrl: string;
  pageMetadata: {
    title: string;
    description: string;
    favicon: string;
    url: string;
  } | null;
  errorMessage: string | null;
}

const PRESET_URLS = [
  { label: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { label: 'Stripe Docs', url: 'https://stripe.com' },
  { label: 'Vercel', url: 'https://vercel.com' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
  { label: 'GitHub Features', url: 'https://github.com/features' },
  { label: 'Wikipedia Article', url: 'https://en.wikipedia.org/wiki/Figma' },
];

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onFetchUrl,
  isLoading,
  currentUrl,
  pageMetadata,
  errorMessage,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || 'https://tailwindcss.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onFetchUrl(inputUrl.trim());
  };

  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    onFetchUrl(url);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Main Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter any website URL (e.g. https://tailwindcss.com or example.com)..."
              disabled={isLoading}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new window"
                className="absolute inset-y-0 right-3 my-auto h-7 px-2 flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-md transition"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm transition shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <span>Fetch URL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Preset Suggestions & Loaded Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Popular Live Targets:</span>
            {PRESET_URLS.map((p) => (
              <button
                key={p.url}
                type="button"
                onClick={() => handleSelectPreset(p.url)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {pageMetadata && !errorMessage && (
            <div className="flex items-center gap-2 text-slate-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/80">
              {pageMetadata.favicon ? (
                <img
                  src={pageMetadata.favicon}
                  alt=""
                  className="w-3.5 h-3.5 rounded-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                {pageMetadata.title || 'Loaded Page'}
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                ● Live Ready
              </span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => onFetchUrl(inputUrl)}
              className="flex items-center gap-1 px-2 py-1 bg-red-900/40 hover:bg-red-900/60 rounded text-red-200 font-medium transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
