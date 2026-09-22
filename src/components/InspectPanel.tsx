import React, { useState, useMemo } from 'react';
import {
  Layers,
  Palette,
  Type,
  FileCode,
  Check,
  Copy,
  Download,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Search,
  Code,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { ConversionResult, ScenegraphNode, DetectedAsset } from '../types';
import { downloadJsonFile, downloadTextFile } from '../utils/figmaExporter';

interface InspectPanelProps {
  conversionResult: ConversionResult | null;
  isConverting: boolean;
  onSelectLayer?: (node: ScenegraphNode) => void;
  selectedLayerId?: string | null;
}

export const InspectPanel: React.FC<InspectPanelProps> = ({
  conversionResult,
  isConverting,
  onSelectLayer,
  selectedLayerId,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'tokens' | 'tree' | 'assets' | 'json'>('stats');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedTokenFormat, setCopiedTokenFormat] = useState<string | null>(null);
  const [copiedSvgId, setCopiedSvgId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [tokenFormat, setTokenFormat] = useState<'tokens-studio' | 'css-variables' | 'tailwind'>('tokens-studio');

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleCopySvg = (asset: DetectedAsset) => {
    if (asset.svgContent) {
      navigator.clipboard.writeText(asset.svgContent);
      setCopiedSvgId(asset.id);
      setTimeout(() => setCopiedSvgId(null), 1500);
    }
  };

  const handleCopyTokenCode = () => {
    if (!conversionResult) return;
    let text = '';
    if (tokenFormat === 'tokens-studio') text = conversionResult.tokensJson;
    else if (tokenFormat === 'css-variables') text = conversionResult.cssVariables;
    else text = conversionResult.tailwindConfig;

    navigator.clipboard.writeText(text);
    setCopiedTokenFormat(tokenFormat);
    setTimeout(() => setCopiedTokenFormat(null), 1800);
  };

  const handleDownloadTokens = () => {
    if (!conversionResult) return;
    if (tokenFormat === 'tokens-studio') {
      downloadTextFile(conversionResult.tokensJson, 'tokens.json', 'application/json');
    } else if (tokenFormat === 'css-variables') {
      downloadTextFile(conversionResult.cssVariables, 'tokens.css', 'text/css');
    } else {
      downloadTextFile(conversionResult.tailwindConfig, 'tailwind-tokens.js', 'application/javascript');
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered scenegraph tree
  const filterNodes = (nodes: ScenegraphNode[]): ScenegraphNode[] => {
    if (!searchFilter.trim()) return nodes;
    const term = searchFilter.toLowerCase();
    const result: ScenegraphNode[] = [];

    for (const node of nodes) {
      const match = node.name.toLowerCase().includes(term) || node.type.toLowerCase().includes(term);
      const filteredChildren = node.children ? filterNodes(node.children) : [];
      if (match || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    return result;
  };

  const displayedTree = useMemo(() => {
    if (!conversionResult?.scenegraph) return [];
    return filterNodes(conversionResult.scenegraph);
  }, [conversionResult?.scenegraph, searchFilter]);

  // Render a scenegraph tree node recursively
  const renderTreeNode = (node: ScenegraphNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id) || Boolean(searchFilter.trim());
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedLayerId === node.id;

    return (
      <div key={node.id} className="text-xs font-mono">
        <div
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (onSelectLayer) onSelectLayer(node);
          }}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition select-none ${
            isSelected
              ? 'bg-indigo-600/30 border border-indigo-500/40 text-white'
              : isExpanded
              ? 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-200'
              : 'hover:bg-slate-800/60 text-slate-300'
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )
          ) : (
            <span className="w-3.5 h-3.5 shrink-0" />
          )}

          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
              node.type === 'FRAME'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : node.type === 'TEXT'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {node.type}
          </span>

          <span className="truncate flex-1 font-medium">{node.name}</span>

          {node.isAutoLayout && (
            <span
              title="Figma Auto Layout enabled"
              className="text-[10px] px-1 bg-violet-500/20 text-violet-300 rounded border border-violet-500/30 shrink-0 font-sans"
            >
              {node.layoutMode === 'HORIZONTAL' ? 'Auto ➔' : 'Auto ⬇'}
            </span>
          )}

          <span className="text-[10px] text-slate-500 shrink-0">
            {node.width}×{node.height}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-800 ml-2.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 w-80 lg:w-96 shrink-0 select-none">
      {/* Tab Navigation */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 px-1.5 py-1.5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
            activeTab === 'stats'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
            activeTab === 'tokens'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-pink-400" />
          <span>Tokens</span>
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
            activeTab === 'tree'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
            activeTab === 'assets'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Assets</span>
          {conversionResult && conversionResult.detectedAssets.length > 0 && (
            <span className="text-[10px] px-1 rounded-full bg-cyan-500/20 text-cyan-300">
              {conversionResult.detectedAssets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
            activeTab === 'json'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span>JSON</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isConverting ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></span>
            <p className="text-xs font-medium">Synthesizing Figma Kiwi Binary & Auto Layout...</p>
          </div>
        ) : !conversionResult ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <Layers className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Render preview loaded. Click "Download .fig" or "Copy to Figma" to convert.</p>
          </div>
        ) : (
          <>
            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    <span>Conversion Telemetry</span>
                    {(conversionResult.stats as any)?.sectionCount && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] normal-case">
                        {(conversionResult.stats as any).sectionCount} Sections Captured
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Total Figma Nodes</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {conversionResult.stats.totalNodes}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Auto Layout Stacks</div>
                      <div className="text-lg font-bold text-violet-400 mt-0.5">
                        {conversionResult.stats.autoLayoutStacks}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Frame Containers</div>
                      <div className="text-lg font-bold text-indigo-400 mt-0.5">
                        {conversionResult.stats.framesCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Text Layers</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">
                        {conversionResult.stats.textCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Binary .fig Archive</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">
                        {conversionResult.stats.figmaFileSizeKb} KB
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Compute Time</div>
                      <div className="text-lg font-bold text-slate-200 mt-0.5">
                        {conversionResult.stats.durationMs} ms
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 leading-relaxed">
                  <div className="font-semibold text-indigo-300 mb-1">✓ Production-Ready Kiwi Binary</div>
                  The Kiwi payload complies with Figma version 106 protocol with embedded schema definitions, compatible with desktop and web Figma.
                </div>
              </div>
            )}

            {/* TOKENS TAB */}
            {activeTab === 'tokens' && (
              <div className="space-y-4">
                {/* Export Tokens Controls */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Design Token Sync
                    </span>
                    <button
                      onClick={handleDownloadTokens}
                      title="Download tokens file"
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export File</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg text-[11px]">
                    <button
                      onClick={() => setTokenFormat('tokens-studio')}
                      className={`py-1 rounded text-center transition ${
                        tokenFormat === 'tokens-studio'
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tokens Studio
                    </button>
                    <button
                      onClick={() => setTokenFormat('css-variables')}
                      className={`py-1 rounded text-center transition ${
                        tokenFormat === 'css-variables'
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CSS Variables
                    </button>
                    <button
                      onClick={() => setTokenFormat('tailwind')}
                      className={`py-1 rounded text-center transition ${
                        tokenFormat === 'tailwind'
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tailwind
                    </button>
                  </div>

                  <button
                    onClick={handleCopyTokenCode}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
                  >
                    {copiedTokenFormat === tokenFormat ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Tokens Code!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy {tokenFormat === 'tokens-studio' ? 'JSON' : tokenFormat === 'css-variables' ? 'CSS' : 'Config'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Color Palette */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Extracted Palette ({conversionResult.colors.length})
                    </span>
                    <span className="text-[11px] text-slate-500">Click to copy HEX</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {conversionResult.colors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleCopyColor(c.hex)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                      >
                        <span
                          className="w-5 h-5 rounded-md border border-slate-700 shrink-0 shadow-xs"
                          style={{ backgroundColor: c.rgba }}
                        ></span>
                        <div className="truncate flex-1">
                          <div className="font-mono text-xs text-slate-200">{c.hex}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{c.type}</div>
                        </div>
                        {copiedHex === c.hex && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Typography System ({conversionResult.fonts.length})
                  </div>
                  <div className="space-y-2">
                    {conversionResult.fonts.map((f) => (
                      <div key={f.family} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-bold text-xs text-slate-200">{f.family}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>Weights:</span>
                          <span className="text-indigo-400 font-mono">{f.weights.join(', ')}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>Sizes:</span>
                          <span className="text-slate-300 font-mono">{f.sizes.slice(0, 4).join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TREE TAB */}
            {activeTab === 'tree' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Layer Hierarchy</span>
                  <button
                    onClick={() => {
                      if (expandedNodes.size > 0) setExpandedNodes(new Set());
                      else {
                        const allIds = new Set<string>();
                        const collect = (nodes: ScenegraphNode[]) => {
                          for (const n of nodes) {
                            allIds.add(n.id);
                            if (n.children) collect(n.children);
                          }
                        };
                        collect(conversionResult.scenegraph);
                        setExpandedNodes(allIds);
                      }
                    }}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>

                {/* Search in tree */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter layers by name or type..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 max-h-[500px] overflow-y-auto">
                  {displayedTree.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">No matching layers found</div>
                  ) : (
                    displayedTree.map((node) => renderTreeNode(node))
                  )}
                </div>
              </div>
            )}

            {/* ASSETS TAB */}
            {activeTab === 'assets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Detected Media & SVGs ({conversionResult.detectedAssets.length})
                  </span>
                </div>

                {conversionResult.detectedAssets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No inline SVGs or images detected in this element.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversionResult.detectedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {asset.type === 'svg' ? (
                            <div
                              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-1 text-slate-300"
                              dangerouslySetInnerHTML={{ __html: asset.svgContent || '' }}
                            />
                          ) : (
                            <img
                              src={asset.src}
                              alt={asset.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                            />
                          )}

                          <div className="truncate">
                            <div className="text-xs font-medium text-slate-200 truncate">{asset.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {asset.type.toUpperCase()} • {asset.width}×{asset.height}px
                            </div>
                          </div>
                        </div>

                        {asset.type === 'svg' && (
                          <button
                            onClick={() => handleCopySvg(asset)}
                            title="Copy SVG XML"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                          >
                            {copiedSvgId === asset.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        {asset.type === 'img' && asset.src && (
                          <a
                            href={asset.src}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* JSON TAB */}
            {activeTab === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Figma Scenegraph JSON
                  </span>
                  <button
                    onClick={() =>
                      downloadJsonFile(conversionResult.document, 'figma-scenegraph.json')
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download JSON</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[480px] leading-relaxed">
                  {JSON.stringify(conversionResult.document, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
