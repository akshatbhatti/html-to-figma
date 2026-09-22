import React, { useState } from 'react';
import { Code2, RotateCcw, Copy, Check, LayoutTemplate, Sparkles } from 'lucide-react';
import { HTML_TEMPLATES } from '../data/templates';
import { HtmlTemplate } from '../types';

interface CodeEditorProps {
  htmlCode: string;
  setHtmlCode: (code: string) => void;
  onSelectTemplate: (template: HtmlTemplate) => void;
  currentTemplateId: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  htmlCode,
  setHtmlCode,
  onSelectTemplate,
  currentTemplateId,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const template = HTML_TEMPLATES.find((t) => t.id === currentTemplateId) || HTML_TEMPLATES[0];
    setHtmlCode(template.html);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            HTML & CSS Source
          </span>
        </div>

        {/* Template Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentTemplateId}
              onChange={(e) => {
                const found = HTML_TEMPLATES.find((t) => t.id === e.target.value);
                if (found) onSelectTemplate(found);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg text-xs py-1.5 pl-2.5 pr-7 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {HTML_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.category}: {tmpl.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400 text-xs">
              ▼
            </div>
          </div>

          <button
            onClick={handleReset}
            title="Reset to selected template defaults"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy code to clipboard"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[300px]">
        <textarea
          value={htmlCode}
          onChange={(e) => setHtmlCode(e.target.value)}
          spellCheck={false}
          className="w-full h-full p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          placeholder="Paste or write HTML and CSS here..."
        />
      </div>

      {/* Helper Footer */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Tailwind CSS classes & inline CSS supported</span>
        </div>
        <span>{htmlCode.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
};
