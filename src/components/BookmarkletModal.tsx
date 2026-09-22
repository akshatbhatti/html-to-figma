import React, { useState } from 'react';
import { Bookmark, Copy, Check, X, ExternalLink, Sparkles } from 'lucide-react';

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkletModal: React.FC<BookmarkletModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarkletCode = `javascript:(function(){var u=window.location.href;window.open('${currentOrigin}/?url='+encodeURIComponent(u),'_blank');})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">1-Click Browser Bookmarklet</h3>
            <p className="text-xs text-slate-400">Capture any webpage on the web directly into Figma</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <p className="font-semibold text-slate-300 mb-2">How to install in Chrome, Safari, or Arc:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Show your browser bookmarks bar (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+Shift+B</kbd> or <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Cmd+Shift+B</kbd>).</li>
              <li>Drag the button below directly onto your bookmarks bar, or copy the code to create a bookmark manually.</li>
              <li>Whenever you browse any site, click the bookmark to send it straight to this HTML to Figma converter!</li>
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-dashed border-indigo-500/40 gap-3">
            <a
              href={bookmarkletCode}
              onClick={(e) => {
                // If clicked directly, explain dragging
                e.preventDefault();
                alert('Drag this button to your Bookmarks Bar at the top of your browser!');
              }}
              title="Drag this button to your Bookmarks Bar!"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Capture to Figma</span>
            </a>
            <span className="text-[11px] text-slate-400">↖ Drag this badge directly to your Bookmarks Bar</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-slate-400">Bookmarklet JavaScript</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied code!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-400 break-all select-all">
              {bookmarkletCode}
            </pre>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
