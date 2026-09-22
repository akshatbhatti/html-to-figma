import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  Crosshair,
  Download,
  Copy,
  X,
  Sparkles,
  Shrink,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import {
  ViewportDimensions,
  CanvasBgStyle,
  SelectedElementInfo,
  ScenegraphNode,
} from '../types';

interface PreviewCanvasProps {
  htmlContent: string;
  viewportDims: ViewportDimensions;
  onIframeReady: (iframe: HTMLIFrameElement) => void;
  inspectMode: boolean;
  setInspectMode: (val: boolean) => void;
  selectedComponent: SelectedElementInfo | null;
  setSelectedComponent: (comp: SelectedElementInfo | null) => void;
  onExportComponent?: (comp: SelectedElementInfo, action: 'download' | 'copy') => void;
  highlightedLayer?: ScenegraphNode | null;
  canvasBg: CanvasBgStyle;
  setCanvasBg: (bg: CanvasBgStyle) => void;
  showLeftPanel?: boolean;
  onToggleLeftPanel?: () => void;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  htmlContent,
  viewportDims,
  onIframeReady,
  inspectMode,
  setInspectMode,
  selectedComponent,
  setSelectedComponent,
  onExportComponent,
  highlightedLayer,
  canvasBg,
  setCanvasBg,
  showLeftPanel = true,
  onToggleLeftPanel,
  showRightPanel = true,
  onToggleRightPanel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Zoom state: autoFit mode calculates dynamic scale, or manualZoom can be chosen
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [manualZoom, setManualZoom] = useState<number>(100);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });
  const [hoveredElementInfo, setHoveredElementInfo] = useState<SelectedElementInfo | null>(null);

  // ResizeObserver to detect canvas container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute scale: if isAutoFit, calculate best fit scale to show 100% of the canvas without clipping
  const calculateAutoFitScale = useCallback(() => {
    // Provide comfortable padding inside the container
    const padX = 48;
    const padY = 56;
    const availW = Math.max(200, containerSize.width - padX);
    const availH = Math.max(200, containerSize.height - padY);

    const scaleW = availW / viewportDims.width;
    const scaleH = availH / viewportDims.height;

    // We never upscale past 100% in auto-fit to avoid pixelation, but scale down smoothly
    const fitScale = Math.min(1.0, Math.min(scaleW, scaleH));
    return Math.max(0.15, fitScale);
  }, [containerSize, viewportDims]);

  const currentScale = isAutoFit ? calculateAutoFitScale() : manualZoom / 100;
  const displayPercent = Math.round(currentScale * 100);

  // Populate iframe content and inject inspection helpers
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    onIframeReady(iframe);

    // Style helper for highlighting
    const highlightId = 'figma-converter-highlight-styles';
    let styleTag = doc.getElementById(highlightId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.id = highlightId;
      styleTag.textContent = `
        .figma-element-hover {
          outline: 2px dashed #6366f1 !important;
          outline-offset: -2px !important;
          cursor: crosshair !important;
        }
        .figma-element-selected {
          outline: 3px solid #8b5cf6 !important;
          outline-offset: -3px !important;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.4) !important;
        }
        .figma-layer-highlight {
          outline: 3px solid #10b981 !important;
          outline-offset: -2px !important;
          animation: figmaPulse 1.5s infinite alternate !important;
        }
        @keyframes figmaPulse {
          0% { outline-color: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
          100% { outline-color: #3b82f6; box-shadow: 0 0 16px rgba(59, 130, 246, 0.8); }
        }
      `;
      doc.head.appendChild(styleTag);
    }

    let currentHovered: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      if (!inspectMode) return;
      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === doc.documentElement) return;

      if (currentHovered && currentHovered !== target) {
        currentHovered.classList.remove('figma-element-hover');
      }

      currentHovered = target;
      target.classList.add('figma-element-hover');

      const rect = target.getBoundingClientRect();
      const style = iframe.contentWindow?.getComputedStyle(target);

      setHoveredElementInfo({
        tagName: target.tagName.toLowerCase(),
        className: typeof target.className === 'string' ? target.className.split(' ').slice(0, 3).join(' ') : '',
        id: target.id || undefined,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        color: style?.color || '#000',
        bg: style?.backgroundColor || 'transparent',
        font: style?.fontFamily.split(',')[0].replace(/['"]/g, '') || 'sans-serif',
        element: target,
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!inspectMode) return;
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('figma-element-hover');
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!inspectMode) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === doc.documentElement) return;

      const prevSelected = doc.querySelectorAll('.figma-element-selected');
      prevSelected.forEach((el) => el.classList.remove('figma-element-selected'));

      target.classList.add('figma-element-selected');

      const rect = target.getBoundingClientRect();
      const style = iframe.contentWindow?.getComputedStyle(target);

      setSelectedComponent({
        tagName: target.tagName.toLowerCase(),
        className: typeof target.className === 'string' ? target.className : '',
        id: target.id || undefined,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        color: style?.color,
        bg: style?.backgroundColor,
        font: style?.fontFamily.split(',')[0].replace(/['"]/g, ''),
        element: target,
      });
    };

    doc.addEventListener('mouseover', handleMouseOver);
    doc.addEventListener('mouseout', handleMouseOut);
    doc.addEventListener('click', handleClick, true);

    return () => {
      doc.removeEventListener('mouseover', handleMouseOver);
      doc.removeEventListener('mouseout', handleMouseOut);
      doc.removeEventListener('click', handleClick, true);
    };
  }, [htmlContent, inspectMode, onIframeReady, setSelectedComponent]);

  // Handle Layer highlighting when user selects from tree
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.querySelectorAll('.figma-layer-highlight').forEach((el) => {
      el.classList.remove('figma-layer-highlight');
    });

    if (!highlightedLayer) return;

    const allElements = Array.from(doc.body.querySelectorAll('*')) as HTMLElement[];
    let matchedEl: HTMLElement | null = null;

    for (const el of allElements) {
      if (el.textContent?.trim() === highlightedLayer.name || el.tagName.toLowerCase() === highlightedLayer.name.toLowerCase()) {
        matchedEl = el;
        break;
      }
      const rect = el.getBoundingClientRect();
      if (
        Math.abs(rect.width - highlightedLayer.width) < 2 &&
        Math.abs(rect.height - highlightedLayer.height) < 2
      ) {
        matchedEl = el;
        break;
      }
    }

    if (matchedEl) {
      matchedEl.classList.add('figma-layer-highlight');
      matchedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedLayer]);

  const handleRefresh = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      onIframeReady(iframe);
      setSelectedComponent(null);
    }
  };

  const getCanvasBackgroundClass = () => {
    switch (canvasBg) {
      case 'dark':
        return 'bg-slate-950';
      case 'light':
        return 'bg-slate-200';
      case 'checkered':
        return 'bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px] bg-slate-900';
      case 'dots':
      default:
        return 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Toggle Left Sidebar */}
          {onToggleLeftPanel && (
            <button
              onClick={onToggleLeftPanel}
              title={showLeftPanel ? 'Collapse Code Editor' : 'Expand Code Editor'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {showLeftPanel ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Canvas Stage</span>
          </div>

          <span className="text-slate-500">•</span>

          <span className="font-mono text-slate-400 text-[11px]">
            {viewportDims.width} × {viewportDims.height} ({viewportDims.label})
          </span>
        </div>

        {/* Controls: Inspect Mode, Background, Auto Fit, Zoom, Reload */}
        <div className="flex items-center gap-2">
          {/* Component Picker Mode */}
          <button
            onClick={() => {
              setInspectMode(!inspectMode);
              if (inspectMode) {
                setHoveredElementInfo(null);
                setSelectedComponent(null);
                const doc = iframeRef.current?.contentDocument;
                doc?.querySelectorAll('.figma-element-hover, .figma-element-selected').forEach((el) => {
                  el.classList.remove('figma-element-hover', 'figma-element-selected');
                });
              }
            }}
            title="Component Selector: Hover and click any component to isolate and export to Figma"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
              inspectMode
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Inspect & Pick</span>
          </button>

          {/* Background Selector */}
          <div className="hidden lg:flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setCanvasBg('dots')}
              title="Dots Grid"
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                canvasBg === 'dots' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dots
            </button>
            <button
              onClick={() => setCanvasBg('dark')}
              title="Dark Slate"
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                canvasBg === 'dark' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setCanvasBg('checkered')}
              title="Checkerboard (Figma Transparency)"
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                canvasBg === 'checkered' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Auto Fit Toggle & Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            {/* Auto Fit Button */}
            <button
              onClick={() => setIsAutoFit(true)}
              title="Auto-Fit: Perfectly scale the entire canvas to fit your screen with zero cropping"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                isAutoFit
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shrink className="w-3 h-3" />
              <span>Fit ({displayPercent}%)</span>
            </button>

            {/* Manual Zoom Controls */}
            <button
              onClick={() => {
                setIsAutoFit(false);
                setManualZoom((z) => Math.max(25, z - 10));
              }}
              title="Zoom Out"
              className="p-1 hover:text-white text-slate-400 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* 100% 1:1 Reset */}
            <button
              onClick={() => {
                setIsAutoFit(false);
                setManualZoom(100);
              }}
              title="Actual Size (100%)"
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                !isAutoFit && manualZoom === 100
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              100%
            </button>

            <button
              onClick={() => {
                setIsAutoFit(false);
                setManualZoom((z) => Math.min(150, z + 10));
              }}
              title="Zoom In"
              className="p-1 hover:text-white text-slate-400 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reload Canvas */}
          <button
            onClick={handleRefresh}
            title="Reload canvas"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Right Sidebar */}
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              title={showRightPanel ? 'Collapse Inspector' : 'Expand Inspector'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {showRightPanel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Hover Info Tooltip (When in Inspect Mode) */}
      {inspectMode && hoveredElementInfo && !selectedComponent && (
        <div className="absolute top-12 left-4 z-20 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-2.5 shadow-2xl text-xs text-slate-200 pointer-events-none flex items-center gap-3 animate-in fade-in">
          <div className="font-mono font-bold text-indigo-400 uppercase text-xs">
            &lt;{hoveredElementInfo.tagName}&gt;
          </div>
          <div className="text-slate-400 font-mono">
            {hoveredElementInfo.width} × {hoveredElementInfo.height}px
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-slate-600 inline-block"
              style={{ backgroundColor: hoveredElementInfo.color }}
            ></span>
            <span className="text-[11px] font-mono text-slate-300">{hoveredElementInfo.color}</span>
          </div>
          <div className="text-slate-400 truncate max-w-[120px]">{hoveredElementInfo.font}</div>
          <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            Click to Isolate
          </span>
        </div>
      )}

      {/* Floating Component Action Bar when an element is selected */}
      {selectedComponent && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-indigo-500/60 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping"></span>
            <div className="text-xs">
              <span className="font-bold text-white uppercase">&lt;{selectedComponent.tagName}&gt;</span>
              <span className="text-slate-400 font-mono ml-2">
                {selectedComponent.width} × {selectedComponent.height}px
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportComponent && onExportComponent(selectedComponent, 'download')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Component (.fig)</span>
            </button>
            <button
              onClick={() => onExportComponent && onExportComponent(selectedComponent, 'copy')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Component</span>
            </button>
            <button
              onClick={() => {
                setSelectedComponent(null);
                const doc = iframeRef.current?.contentDocument;
                doc?.querySelectorAll('.figma-element-selected').forEach((el) => {
                  el.classList.remove('figma-element-selected');
                });
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Deselect"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Scroll Area with Zero-Clipping Layout */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 sm:p-6 md:p-8 flex ${getCanvasBackgroundClass()}`}
      >
        <div className="m-auto flex flex-col items-center">
          {/* Scaled Layout Wrapper: Outer box layout width & height MATCH the scaled dimensions! */}
          <div
            style={{
              width: `${Math.round(viewportDims.width * currentScale)}px`,
              height: `${Math.round(viewportDims.height * currentScale)}px`,
              position: 'relative',
              transition: 'width 0.15s ease-out, height 0.15s ease-out',
            }}
          >
            {/* Inner Element: full unscaled size, scaled down with origin top-left */}
            <div
              style={{
                width: `${viewportDims.width}px`,
                height: `${viewportDims.height}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
                transition: 'transform 0.15s ease-out',
              }}
              className="shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900"
            >
              <iframe
                ref={iframeRef}
                title="Design Canvas Sandbox"
                style={{
                  width: `${viewportDims.width}px`,
                  height: `${viewportDims.height}px`,
                  border: 'none',
                  display: 'block',
                }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
