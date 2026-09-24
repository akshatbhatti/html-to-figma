import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { CodeEditor } from './components/CodeEditor';
import { FileUploadView } from './components/FileUploadView';
import { PreviewCanvas } from './components/PreviewCanvas';
import { InspectPanel } from './components/InspectPanel';
import { FigmaGuideModal } from './components/FigmaGuideModal';
import { BookmarkletModal } from './components/BookmarkletModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { HTML_TEMPLATES } from './data/templates';

import {
  InputMode,
  ViewportMode,
  ViewportDimensions,
  ConversionResult,
  HtmlTemplate,
  CanvasBgStyle,
  SelectedElementInfo,
  ScenegraphNode,
} from './types';
import {
  convertDomToFigma,
  convertMultiArtboardsToFigma,
  downloadFigFile,
  copyToFigmaClipboard,
} from './utils/figmaExporter';

const VIEWPORT_CONFIGS: Record<ViewportMode, ViewportDimensions> = {
  desktop: { width: 1440, height: 900, label: 'Desktop 1440' },
  laptop: { width: 1200, height: 750, label: 'Laptop 1200' },
  tablet: { width: 768, height: 1024, label: 'Tablet 768' },
  mobile: { width: 375, height: 812, label: 'Mobile 375' },
  custom: { width: 1200, height: 800, label: 'Custom' },
};

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [mode, setMode] = useState<InputMode>('code');
  const [viewport, setViewport] = useState<ViewportMode>('laptop');
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [canvasBg, setCanvasBg] = useState<CanvasBgStyle>('dots');
  const [currentTemplate, setCurrentTemplate] = useState<HtmlTemplate>(HTML_TEMPLATES[0]);
  const [htmlContent, setHtmlContent] = useState<string>(HTML_TEMPLATES[0].html);

  // Panel collapse states for responsive canvas breathing room
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // URL State
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [pageMetadata, setPageMetadata] = useState<{
    title: string;
    description: string;
    favicon: string;
    url: string;
  } | null>(null);

  // Conversion State
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedResponsive, setCopiedResponsive] = useState<boolean>(false);
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showBookmarklet, setShowBookmarklet] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Component Isolation & Layer Highlight State
  const [selectedComponent, setSelectedComponent] = useState<SelectedElementInfo | null>(null);
  const [highlightedLayer, setHighlightedLayer] = useState<ScenegraphNode | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentDims = VIEWPORT_CONFIGS[viewport];
  const documentName =
    mode === 'url' && pageMetadata?.title
      ? pageMetadata.title
      : currentTemplate?.name || 'Design Canvas';

  // Handle URL Fetch
  const handleFetchUrl = async (url: string) => {
    setIsFetchingUrl(true);
    setUrlError(null);
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch webpage');
      }

      setCurrentUrl(data.url);
      setPageMetadata({
        title: data.title,
        description: data.description,
        favicon: data.favicon,
        url: data.url,
      });
      setHtmlContent(data.html);
      setConversionResult(null);
      setSelectedComponent(null);
      addToast('success', 'URL Fetched Successfully', data.title || data.url);
    } catch (err: any) {
      console.error(err);
      setUrlError(err.message || 'Error loading URL');
      addToast('error', 'Fetch Failed', err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session', { credentials: 'same-origin' });
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username || 'admin');
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthReady(true);
      }
    };

    void checkSession();
  }, []);

  // Check URL query parameters for 1-click Bookmarklet integration
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetUrl = params.get('url');
      if (targetUrl) {
        setMode('url');
        handleFetchUrl(targetUrl);
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle template selection
  const handleSelectTemplate = (template: HtmlTemplate) => {
    setCurrentTemplate(template);
    setHtmlContent(template.html);
    setConversionResult(null);
    setSelectedComponent(null);
  };

  // Handle file upload
  const handleFileLoaded = (content: string, filename: string) => {
    setHtmlContent(content);
    setCurrentTemplate({
      id: 'uploaded',
      name: filename,
      category: 'Landing Page',
      description: 'Uploaded HTML File',
      width: currentDims.width,
      height: currentDims.height,
      html: content,
    });
    setConversionResult(null);
    setSelectedComponent(null);
    addToast('success', 'File Loaded', `${filename} ready for conversion`);
  };

  // Perform DOM to Figma conversion on whole page or element
  // Ensures ALL sections from top to bottom are captured without clipping!
  const executeConversion = async (targetElement?: HTMLElement, customName?: string): Promise<ConversionResult | null> => {
    const iframe = iframeRef.current;
    if (!iframe) {
      addToast('error', 'Preview Not Ready', 'Please wait for the preview canvas to render.');
      return null;
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const body = doc?.body;
    const elToConvert = targetElement || body;

    if (!elToConvert) {
      addToast('error', 'Document Empty', 'No renderable DOM element was found inside the canvas.');
      return null;
    }

    setIsConverting(true);

    // Save previous dimensions & styles to restore after capture
    const prevIframeHeight = iframe.style.height;
    const prevBodyOverflow = body ? body.style.overflow : '';
    const prevDocOverflow = doc ? doc.documentElement.style.overflow : '';

    try {
      const name = customName || documentName;

      let width = currentDims.width;
      let height = currentDims.height;

      if (targetElement) {
        width = targetElement.offsetWidth || targetElement.scrollWidth || 300;
        height = targetElement.offsetHeight || targetElement.scrollHeight || 200;
      } else if (doc && body) {
        // Temporarily ensure overflow is visible so true full scroll boundaries can be measured
        doc.documentElement.style.overflow = 'visible';
        body.style.overflow = 'visible';

        const fullHeight = Math.max(
          body.scrollHeight,
          doc.documentElement.scrollHeight,
          body.offsetHeight,
          doc.documentElement.offsetHeight,
          currentDims.height
        );
        const fullWidth = Math.max(
          body.scrollWidth,
          doc.documentElement.scrollWidth,
          currentDims.width
        );

        width = fullWidth;
        height = fullHeight;

        // Temporarily expand iframe height to full page height so browser reflows all sections without clipping
        iframe.style.height = `${fullHeight}px`;
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      const result = await convertDomToFigma(elToConvert, {
        name,
        autoLayout,
        width,
        height,
      });

      if (!targetElement) {
        setConversionResult(result);
      }
      return result;
    } catch (err: any) {
      console.error('Conversion error:', err);
      addToast('error', 'Conversion Error', err.message || 'Failed to parse DOM to Figma Kiwi binary');
      return null;
    } finally {
      // Restore original styling
      if (iframe) iframe.style.height = prevIframeHeight;
      if (body) body.style.overflow = prevBodyOverflow;
      if (doc) doc.documentElement.style.overflow = prevDocOverflow;
      setIsConverting(false);
    }
  };

  // Action: Download .fig file for whole design (all sections)
  const handleDownloadFig = async () => {
    let result = conversionResult;
    if (!result) {
      result = await executeConversion();
    }
    if (result) {
      const filename = `${documentName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.fig`;
      downloadFigFile(result.figBlob, filename);
      const sectionCount = (result.stats as any)?.sectionCount;
      const countText = sectionCount ? ` (${sectionCount} sections included)` : '';
      addToast(
        'success',
        `Figma File (.fig) Downloaded${countText}`,
        `Drag ${filename} directly into Figma or use File → Open.`
      );
    }
  };

  // Action: Download Multi-Artboard Responsive Suite (.fig)
  // Each breakpoint is re-rendered from the HTML source at its own width, so the
  // exported artboards carry the page's real responsive layouts.
  const handleDownloadMultiArtboardFig = async () => {
    if (!htmlContent.trim()) {
      addToast('error', 'Nothing to Export', 'Load a template, URL, or file before exporting.');
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertMultiArtboardsToFigma(htmlContent, {
        name: documentName,
        autoLayout,
      });

      const filename = `${documentName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_responsive_suite.fig`;
      downloadFigFile(result.figBlob, filename);
      addToast(
        'success',
        'Multi-Artboard .fig Downloaded!',
        'Exported Desktop (1440), Laptop (1200), Tablet (768), and Mobile (375) — each rendered at its own width.'
      );
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Multi-Artboard Export Failed', err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Action: Copy Whole Design (Desktop, Laptop, Tablet, Mobile) to Figma Clipboard
  const handleCopyResponsiveClipboard = async () => {
    if (!htmlContent.trim()) {
      addToast('error', 'Nothing to Copy', 'Load a template, URL, or file before exporting.');
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertMultiArtboardsToFigma(htmlContent, {
        name: documentName,
        autoLayout,
      });

      const ok = await copyToFigmaClipboard(result.clipboardHtml);
      if (ok) {
        setCopiedResponsive(true);
        setTimeout(() => setCopiedResponsive(false), 2500);
        addToast(
          'success',
          'Copied All 4 Viewports to Figma!',
          'Desktop (1440), Laptop (1200), Tablet (768), and Mobile (375) — each rendered at its own width. Press Ctrl+V in Figma.'
        );
      } else {
        addToast('error', 'Clipboard Blocked', 'Please use "Download Responsive Suite .fig" instead.');
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Responsive Copy Failed', err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Action: Copy Whole Design (All Sections) to Figma Clipboard
  const handleCopyClipboard = async () => {
    let result = conversionResult;
    if (!result) {
      result = await executeConversion();
    }
    if (result) {
      const ok = await copyToFigmaClipboard(result.clipboardHtml);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        const sectionCount = (result.stats as any)?.sectionCount;
        const countText = sectionCount ? ` (${sectionCount} sections, ${result.stats.totalNodes} layers)` : '';
        addToast(
          'success',
          `Copied Full Design${countText}!`,
          'All sections from header to footer are in your clipboard. Press Ctrl+V in Figma to paste.'
        );
      } else {
        addToast('error', 'Clipboard Blocked', 'Browser blocked clipboard access. Please use "Download .fig" instead.');
      }
    }
  };

  // Action: Export or Copy an isolated component
  const handleExportComponent = async (comp: SelectedElementInfo, action: 'download' | 'copy') => {
    if (!comp.element) return;
    const compName = `${documentName} — ${comp.tagName.toUpperCase()}`;
    const result = await executeConversion(comp.element, compName);
    if (!result) return;

    if (action === 'download') {
      const filename = `${comp.tagName.toLowerCase()}_component.fig`;
      downloadFigFile(result.figBlob, filename);
      addToast('success', 'Component .fig Downloaded', `Extracted <${comp.tagName}> as an isolated Figma frame.`);
    } else {
      const ok = await copyToFigmaClipboard(result.clipboardHtml);
      if (ok) {
        addToast('success', 'Component Copied!', `Press Ctrl+V in Figma to paste <${comp.tagName}>.`);
      }
    }
  };

  const handleIframeReady = useCallback((iframe: HTMLIFrameElement) => {
    iframeRef.current = iframe;
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || 'Invalid username or password');
        return;
      }

      setIsLoggedIn(true);
      setUsername(data.username || trimmedUsername);
      setLoginError('');
      setPassword('');
    } catch {
      setLoginError('Unable to reach the authentication server');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // ignore logout failures and still clear local UI state
    }

    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  if (!authReady) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-xl font-bold text-cyan-300">
              F
            </div>
            <h1 className="text-2xl font-bold text-white">Sign in</h1>
            <p className="mt-2 text-sm text-slate-400">HTML to Figma converter</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-cyan-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-cyan-500"
                placeholder="Enter password"
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        mode={mode}
        setMode={setMode}
        viewport={viewport}
        setViewport={setViewport}
        autoLayout={autoLayout}
        setAutoLayout={setAutoLayout}
        onDownloadFig={handleDownloadFig}
        onDownloadMultiArtboardFig={handleDownloadMultiArtboardFig}
        onCopyClipboard={handleCopyClipboard}
        onCopyResponsiveClipboard={handleCopyResponsiveClipboard}
        onOpenGuide={() => setShowGuide(true)}
        onOpenBookmarklet={() => setShowBookmarklet(true)}
        onLogout={handleLogout}
        isConverting={isConverting}
        copied={copied}
        copiedResponsive={copiedResponsive}
        documentName={documentName}
      />

      {/* Mode Input Bar */}
      {mode === 'url' && (
        <UrlInputBar
          onFetchUrl={handleFetchUrl}
          isLoading={isFetchingUrl}
          currentUrl={currentUrl}
          pageMetadata={pageMetadata}
          errorMessage={urlError}
        />
      )}

      {mode === 'upload' && <FileUploadView onFileLoaded={handleFileLoaded} />}

      {/* Main Workspace Split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Code Editor (Collapsible) */}
        {mode === 'code' && showLeftPanel && (
          <div className="w-1/3 min-w-[320px] max-w-[460px] h-full flex flex-col shrink-0 border-r border-slate-800 transition-all duration-200">
            <CodeEditor
              htmlCode={htmlContent}
              setHtmlCode={(code) => {
                setHtmlContent(code);
                setConversionResult(null);
                setSelectedComponent(null);
              }}
              onSelectTemplate={handleSelectTemplate}
              currentTemplateId={currentTemplate.id}
            />
          </div>
        )}

        {/* Center: Live Preview Stage with Auto-Fit and Zero-Clipping Layout */}
        <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
          <PreviewCanvas
            htmlContent={htmlContent}
            viewportDims={currentDims}
            onIframeReady={handleIframeReady}
            inspectMode={inspectMode}
            setInspectMode={setInspectMode}
            selectedComponent={selectedComponent}
            setSelectedComponent={setSelectedComponent}
            onExportComponent={handleExportComponent}
            highlightedLayer={highlightedLayer}
            canvasBg={canvasBg}
            setCanvasBg={setCanvasBg}
            showLeftPanel={showLeftPanel}
            onToggleLeftPanel={mode === 'code' ? () => setShowLeftPanel((p) => !p) : undefined}
            showRightPanel={showRightPanel}
            onToggleRightPanel={() => setShowRightPanel((p) => !p)}
          />
        </div>

        {/* Right Side: Telemetry, Tokens, Assets, and Scenegraph Inspector (Collapsible) */}
        {showRightPanel && (
          <InspectPanel
            conversionResult={conversionResult}
            isConverting={isConverting}
            onSelectLayer={(node) => setHighlightedLayer(node)}
            selectedLayerId={highlightedLayer?.id}
          />
        )}
      </main>

      {/* Guide Modal */}
      <FigmaGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Bookmarklet Modal */}
      <BookmarkletModal isOpen={showBookmarklet} onClose={() => setShowBookmarklet(false)} />

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
export default App;
