import JSZip from 'jszip';
import { createFigmaConverter } from '@figit/dom-to-figma';
import { encodeFigmaData, composeClipboardHtml } from '@figit/fig-kiwi';
import {
  ConversionResult,
  ConversionStats,
  ExtractedColor,
  ExtractedFont,
  ScenegraphNode,
  DetectedAsset,
} from '../types';

/**
 * Robust image loader that tries direct fetch first, then server proxy fallback,
 * ensuring external images are properly embedded into Figma Kiwi binary.
 */
function createRobustImageLoader() {
  return async (req: { src: string }) => {
    try {
      const res = await fetch(req.src, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mimeType = res.headers.get('content-type') || 'image/png';
      const bytes = await res.arrayBuffer();
      return { bytes, mimeType };
    } catch {
      try {
        const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(req.src)}`);
        if (!proxyRes.ok) throw new Error('Proxy image failed');
        const mimeType = proxyRes.headers.get('content-type') || 'image/png';
        const bytes = await proxyRes.arrayBuffer();
        return { bytes, mimeType };
      } catch {
        // Fallback transparent 1x1 png to prevent crashes
        const emptyPng =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVUUIDvyvQAAAAASUVORK5CYII=';
        const binary = atob(emptyPng);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return { bytes: bytes.buffer, mimeType: 'image/png' };
      }
    }
  };
}

/**
 * Realm-safe element test.
 *
 * `x instanceof HTMLElement` compares against THIS window's HTMLElement. Everything
 * we convert lives inside a preview/stage iframe, which is a separate realm with its
 * own constructors, so that check is false for every single element we are given.
 * It silently disabled the classifier and both token extractors. Duck-type instead.
 */
function isElementNode(node: unknown): node is HTMLElement {
  return !!node && (node as Node).nodeType === 1 && typeof (node as HTMLElement).tagName === 'string';
}

/** Computed style resolved through the element's OWN window, not necessarily ours. */
function computedStyleOf(el: Element): CSSStyleDeclaration {
  const view = el.ownerDocument?.defaultView || window;
  return view.getComputedStyle(el);
}

/**
 * Intelligent element classifier:
 * Filters out offscreen navigation drawers, hidden modals, visually-hidden screenreader junk,
 * and zero-opacity backdrops that cause weird overlapping artifacts at the top of Figma.
 */
function createSmartClassify() {
  return (element: Element, defaultKind: any) => {
    if (!isElementNode(element)) {
      return defaultKind;
    }

    // Keep synthetic form representation containers
    if (element.getAttribute('data-figma-form-rep') === 'true') {
      return defaultKind;
    }

    try {
      const style = computedStyleOf(element);

      // 1. Explicitly hidden elements
      if (style.display === 'none') return 'skip';
      if (style.visibility === 'hidden' || style.visibility === 'collapse') return 'skip';
      if (element.hasAttribute('hidden')) return 'skip';

      // 2. Off-screen navigation drawers, modals, backdrops
      const ariaHidden = element.getAttribute('aria-hidden');
      const role = element.getAttribute('role');
      if (
        ariaHidden === 'true' &&
        (role === 'dialog' || role === 'menu' || style.position === 'fixed' || style.position === 'absolute')
      ) {
        return 'skip';
      }

      // 3. Screen-reader only clipped text
      const className =
        element.className && typeof element.className === 'string' ? element.className.toLowerCase() : '';
      if (
        className.includes('sr-only') ||
        className.includes('visually-hidden') ||
        className.includes('cdk-visually-hidden') ||
        className.includes('screen-reader')
      ) {
        return 'skip';
      }

      // 4. Zero opacity overlays and backdrops
      const opacity = parseFloat(style.opacity || '1');
      if (opacity === 0 && !element.querySelector('img, svg')) {
        return 'skip';
      }

      // 5. Offscreen coordinates (e.g. drawers parked outside the viewport)
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -100 || rect.right < -200) {
        return 'skip';
      }

      // 6. Collapsed clipped containers — closed dropdowns, accordions and mega
      // menus are full-width but height:0 with overflow:hidden. Requiring BOTH
      // dimensions to be zero missed all of them, so their contents were exported
      // as a stray list of links over the top of the design.
      if (style.overflow === 'hidden' && (rect.height === 0 || rect.width === 0)) {
        return 'skip';
      }

      // 7. Collapsed by max-height/max-width (the other common accordion pattern),
      // where the box still reports a size but clips everything inside it.
      if (
        (style.maxHeight === '0px' || style.maxWidth === '0px') &&
        style.overflow !== 'visible' &&
        element.children.length > 0
      ) {
        return 'skip';
      }
    } catch {
      // ignore
    }

    return defaultKind;
  };
}

/**
 * Prepares a rendered page for capture the way a real visitor would: by scrolling it.
 *
 * Two things never happen if you convert a freshly loaded page. Lazy images only
 * start downloading as they approach the viewport, and scroll-reveal animations
 * hold their elements at opacity:0 until an IntersectionObserver fires. Converting
 * immediately therefore captures blank gaps where whole sections belong. Walking
 * the page top to bottom lets the site's own code do the revealing, then we return
 * to the top so every rect is measured from the true origin.
 */
async function primeStageForCapture(root: HTMLElement, timeoutMs = 15000): Promise<() => void> {
  const doc = root.ownerDocument;
  const win = doc?.defaultView;
  if (!doc || !win) return () => {};

  // Inline styles we force on for the capture, with their previous values so the
  // live preview the user is looking at is handed back exactly as we found it.
  const forced: Array<{ el: HTMLElement; opacity: string; transform: string }> = [];

  const deadline = Date.now() + timeoutMs;
  const remaining = () => Math.max(0, deadline - Date.now());

  // Collapse reveal transitions to zero so they finish the instant they trigger
  // instead of over several hundred milliseconds we would have to wait out.
  const style = doc.createElement('style');
  style.setAttribute('data-figma-capture', 'true');
  style.textContent =
    '*,*::before,*::after{transition-duration:0s !important;transition-delay:0s !important;' +
    'animation-delay:0s !important;scroll-behavior:auto !important;}';
  doc.head?.appendChild(style);

  try {
    const viewportHeight = win.innerHeight || 800;
    const pageHeight = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0);
    const step = Math.max(200, Math.floor(viewportHeight * 0.8));

    for (let y = 0; y < pageHeight && remaining() > 0; y += step) {
      win.scrollTo(0, y);
      await delay(60);
    }

    win.scrollTo(0, pageHeight);
    await delay(150);
    win.scrollTo(0, 0);
    await delay(150);

    // Whatever the scroll just kicked off still has to finish downloading.
    const images = Array.from(doc.images || []);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            // `complete` is also true for images that already failed; those will
            // never fire another event, so waiting on them just burns the budget.
            if (img.complete) return resolve();
            const done = () => resolve();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
            setTimeout(done, Math.min(4000, remaining()));
          })
      )
    );

    // Bounded separately: fonts.ready can stay pending indefinitely on a page with
    // a font that never resolves, and racing it against the whole remaining budget
    // meant one stubborn webfont cost the entire capture its time.
    try {
      await Promise.race([
        (doc as any).fonts?.ready ?? Promise.resolve(),
        delay(Math.min(3000, remaining())),
      ]);
    } catch {
      // ignore
    }

    // Anything still fully transparent after a complete scroll never got revealed
    // — typically a scroll animation whose IntersectionObserver does not fire for
    // an offscreen stage. Force the end state, but only where there is real content
    // to show: genuinely hidden things (dialogs, menus, collapsed boxes) stay hidden.
    for (const node of Array.from(root.querySelectorAll('*'))) {
      if (!isElementNode(node)) continue;

      const style2 = computedStyleOf(node);
      if (parseFloat(style2.opacity || '1') !== 0) continue;
      if (style2.display === 'none' || style2.visibility === 'hidden') continue;
      if (node.getAttribute('aria-hidden') === 'true') continue;

      const role = node.getAttribute('role');
      if (role === 'dialog' || role === 'menu' || role === 'tooltip') continue;

      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;

      const hasContent = node.querySelector('img, svg, picture, video') || (node.textContent || '').trim().length > 0;
      if (!hasContent) continue;

      forced.push({ el: node, opacity: node.style.opacity, transform: node.style.transform });
      node.style.setProperty('opacity', '1', 'important');
      // Reveal animations usually pair the fade with an offset that must go too.
      if (style2.transform && style2.transform !== 'none') {
        node.style.setProperty('transform', 'none', 'important');
      }
    }

    await new Promise<void>((resolve) => {
      try {
        win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()));
      } catch {
        resolve();
      }
    });
  } finally {
    style.remove();
  }

  return () => {
    for (const { el, opacity, transform } of forced) {
      if (opacity) el.style.setProperty('opacity', opacity);
      else el.style.removeProperty('opacity');
      if (transform) el.style.setProperty('transform', transform);
      else el.style.removeProperty('transform');
    }
    forced.length = 0;
  };
}

/**
 * Pre-processes form controls (<input>, <textarea>, <select>, etc.) so that they
 * convert into visually complete Figma frames with text, borders, and backgrounds,
 * avoiding missing elements or cross-document errors.
 * Returns a cleanup function that restores the DOM.
 */
function prepareFormElementsForConversion(root: HTMLElement): () => void {
  const doc = root.ownerDocument || document;
  const restoreTasks: (() => void)[] = [];

  try {
    const formControls = Array.from(
      root.querySelectorAll<HTMLElement>('input, textarea, select, button')
    );

    for (const el of formControls) {
      const style = computedStyleOf(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const tagName = el.tagName.toLowerCase();

      if (tagName === 'input') {
        const input = el as HTMLInputElement;
        const type = (input.type || 'text').toLowerCase();

        if (type === 'hidden') continue;

        if (type === 'checkbox' || type === 'radio') {
          // Visual representation for checkbox / radio
          const isRadio = type === 'radio';
          const isChecked = input.checked;
          const rect = input.getBoundingClientRect();
          const w = Math.max(16, rect.width || 18);
          const h = Math.max(16, rect.height || 18);

          const indicator = doc.createElement('div');
          indicator.setAttribute('data-figma-form-rep', 'true');
          indicator.style.display = 'inline-flex';
          indicator.style.alignItems = 'center';
          indicator.style.justifyContent = 'center';
          indicator.style.width = `${w}px`;
          indicator.style.height = `${h}px`;
          indicator.style.boxSizing = 'border-box';
          indicator.style.borderRadius = isRadio ? '9999px' : '4px';
          indicator.style.border = isChecked
            ? '2px solid #4F46E5'
            : style.borderColor && style.borderColor !== 'transparent'
            ? `${style.borderWidth || '1px'} solid ${style.borderColor}`
            : '1.5px solid #94A3B8';
          indicator.style.backgroundColor = isChecked
            ? isRadio
              ? '#FFFFFF'
              : '#4F46E5'
            : style.backgroundColor !== 'transparent'
            ? style.backgroundColor
            : '#FFFFFF';
          indicator.style.margin = style.margin;
          indicator.style.verticalAlign = 'middle';

          if (isChecked) {
            if (isRadio) {
              const dot = doc.createElement('div');
              dot.style.width = `${Math.round(w * 0.5)}px`;
              dot.style.height = `${Math.round(h * 0.5)}px`;
              dot.style.borderRadius = '9999px';
              dot.style.backgroundColor = '#4F46E5';
              indicator.appendChild(dot);
            } else {
              const check = doc.createElement('span');
              check.textContent = '✓';
              check.style.color = '#FFFFFF';
              check.style.fontSize = `${Math.round(h * 0.7)}px`;
              check.style.fontWeight = 'bold';
              check.style.lineHeight = '1';
              indicator.appendChild(check);
            }
          }

          input.parentNode?.insertBefore(indicator, input);
          const prevDisplay = input.style.display;
          input.style.display = 'none';

          restoreTasks.push(() => {
            indicator.remove();
            input.style.display = prevDisplay;
          });
        } else if (type === 'submit' || type === 'button' || type === 'reset') {
          // Button inputs with value
          const text = input.value || 'Submit';
          const btnDiv = doc.createElement('div');
          btnDiv.setAttribute('data-figma-form-rep', 'true');
          btnDiv.style.cssText = el.style.cssText;
          btnDiv.style.display = style.display === 'inline' ? 'inline-flex' : style.display;
          btnDiv.style.alignItems = 'center';
          btnDiv.style.justifyContent = 'center';
          btnDiv.style.width = style.width;
          btnDiv.style.height = style.height;
          btnDiv.style.padding = style.padding;
          btnDiv.style.backgroundColor = style.backgroundColor;
          btnDiv.style.border = style.border;
          btnDiv.style.borderRadius = style.borderRadius;
          btnDiv.style.boxShadow = style.boxShadow;

          const textSpan = doc.createElement('span');
          textSpan.textContent = text;
          textSpan.style.fontFamily = style.fontFamily;
          textSpan.style.fontSize = style.fontSize;
          textSpan.style.fontWeight = style.fontWeight;
          textSpan.style.color = style.color;
          btnDiv.appendChild(textSpan);

          input.parentNode?.insertBefore(btnDiv, input);
          const prevDisplay = input.style.display;
          input.style.display = 'none';

          restoreTasks.push(() => {
            btnDiv.remove();
            input.style.display = prevDisplay;
          });
        } else {
          // Standard text-based input (text, email, tel, password, number, search, etc.)
          const placeholder = input.getAttribute('placeholder') || '';
          const value = input.value || '';
          const displayText = value || placeholder;

          const container = doc.createElement('div');
          container.setAttribute('data-figma-form-rep', 'true');

          const rect = input.getBoundingClientRect();
          container.style.display = style.display.includes('flex') ? style.display : 'flex';
          container.style.alignItems = 'center';
          container.style.boxSizing = 'border-box';
          container.style.width = rect.width > 0 ? `${rect.width}px` : style.width;
          container.style.minHeight = rect.height > 0 ? `${rect.height}px` : style.height;
          container.style.padding = style.padding !== '0px' ? style.padding : '8px 12px';
          container.style.margin = style.margin;
          container.style.backgroundColor =
            style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
              ? style.backgroundColor
              : '#FFFFFF';
          container.style.border =
            parseFloat(style.borderWidth) > 0 && style.borderColor !== 'transparent'
              ? `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`
              : '1px solid #CBD5E1';
          container.style.borderRadius = style.borderRadius !== '0px' ? style.borderRadius : '8px';
          container.style.boxShadow = style.boxShadow;

          if (displayText) {
            const textSpan = doc.createElement('span');
            textSpan.textContent = displayText;
            textSpan.style.fontFamily = style.fontFamily;
            textSpan.style.fontSize = style.fontSize;
            textSpan.style.fontWeight = style.fontWeight;
            textSpan.style.lineHeight = '1.4';
            textSpan.style.whiteSpace = 'nowrap';
            textSpan.style.overflow = 'hidden';
            textSpan.style.textOverflow = 'ellipsis';
            textSpan.style.color = value ? style.color : '#94A3B8';
            container.appendChild(textSpan);
          }

          input.parentNode?.insertBefore(container, input);
          const prevDisplay = input.style.display;
          input.style.display = 'none';

          restoreTasks.push(() => {
            container.remove();
            input.style.display = prevDisplay;
          });
        }
      } else if (tagName === 'textarea') {
        const textarea = el as HTMLTextAreaElement;
        const placeholder = textarea.getAttribute('placeholder') || '';
        const value = textarea.value || '';
        const displayText = value || placeholder;

        const container = doc.createElement('div');
        container.setAttribute('data-figma-form-rep', 'true');
        const rect = textarea.getBoundingClientRect();
        container.style.display = 'block';
        container.style.boxSizing = 'border-box';
        container.style.width = rect.width > 0 ? `${rect.width}px` : style.width;
        container.style.minHeight =
          rect.height > 0 ? `${rect.height}px` : style.height !== 'auto' ? style.height : '80px';
        container.style.padding = style.padding !== '0px' ? style.padding : '8px 12px';
        container.style.margin = style.margin;
        container.style.backgroundColor =
          style.backgroundColor !== 'transparent' ? style.backgroundColor : '#FFFFFF';
        container.style.border =
          parseFloat(style.borderWidth) > 0
            ? `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`
            : '1px solid #CBD5E1';
        container.style.borderRadius = style.borderRadius !== '0px' ? style.borderRadius : '8px';

        if (displayText) {
          const textSpan = doc.createElement('div');
          textSpan.textContent = displayText;
          textSpan.style.fontFamily = style.fontFamily;
          textSpan.style.fontSize = style.fontSize;
          textSpan.style.lineHeight = style.lineHeight !== 'normal' ? style.lineHeight : '1.5';
          textSpan.style.color = value ? style.color : '#94A3B8';
          container.appendChild(textSpan);
        }

        textarea.parentNode?.insertBefore(container, textarea);
        const prevDisplay = textarea.style.display;
        textarea.style.display = 'none';

        restoreTasks.push(() => {
          container.remove();
          textarea.style.display = prevDisplay;
        });
      } else if (tagName === 'select') {
        const select = el as HTMLSelectElement;
        const selectedOpt = select.options[select.selectedIndex];
        const displayText = selectedOpt?.text || select.getAttribute('placeholder') || 'Select option';

        const container = doc.createElement('div');
        container.setAttribute('data-figma-form-rep', 'true');
        const rect = select.getBoundingClientRect();
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.boxSizing = 'border-box';
        container.style.width = rect.width > 0 ? `${rect.width}px` : style.width;
        container.style.height = rect.height > 0 ? `${rect.height}px` : style.height;
        container.style.padding = style.padding !== '0px' ? style.padding : '8px 12px';
        container.style.margin = style.margin;
        container.style.backgroundColor =
          style.backgroundColor !== 'transparent' ? style.backgroundColor : '#FFFFFF';
        container.style.border =
          parseFloat(style.borderWidth) > 0
            ? `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`
            : '1px solid #CBD5E1';
        container.style.borderRadius = style.borderRadius !== '0px' ? style.borderRadius : '8px';

        const textSpan = doc.createElement('span');
        textSpan.textContent = displayText;
        textSpan.style.fontFamily = style.fontFamily;
        textSpan.style.fontSize = style.fontSize;
        textSpan.style.color = style.color;
        textSpan.style.whiteSpace = 'nowrap';
        textSpan.style.overflow = 'hidden';
        textSpan.style.textOverflow = 'ellipsis';
        container.appendChild(textSpan);

        // Dropdown chevron indicator
        const arrowSpan = doc.createElement('span');
        arrowSpan.textContent = ' ▾';
        arrowSpan.style.fontSize = '12px';
        arrowSpan.style.color = '#64748B';
        arrowSpan.style.marginLeft = '8px';
        container.appendChild(arrowSpan);

        select.parentNode?.insertBefore(container, select);
        const prevDisplay = select.style.display;
        select.style.display = 'none';

        restoreTasks.push(() => {
          container.remove();
          select.style.display = prevDisplay;
        });
      }
    }
  } catch (err) {
    console.warn('Form controls pre-processing error:', err);
  }

  return () => {
    for (const restore of restoreTasks) {
      try {
        restore();
      } catch {
        // ignore
      }
    }
  };
}

/**
 * Extract distinct colors from a DOM element tree
 */
export function extractColorsFromElement(root: HTMLElement): ExtractedColor[] {
  const colorMap = new Map<string, { count: number; type: 'background' | 'text' | 'border'; rgba: string }>();

  function rgbToHex(rgbStr: string): string | null {
    if (!rgbStr || rgbStr === 'transparent' || rgbStr === 'rgba(0, 0, 0, 0)') {
      return null;
    }
    const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  const elements = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];

  for (const el of elements) {
    if (!isElementNode(el)) continue;
    try {
      const style = computedStyleOf(el);
      const bgHex = rgbToHex(style.backgroundColor);
      if (bgHex) {
        const existing = colorMap.get(bgHex) || { count: 0, type: 'background', rgba: style.backgroundColor };
        existing.count += 1;
        colorMap.set(bgHex, existing);
      }
      const textHex = rgbToHex(style.color);
      if (textHex && el.textContent?.trim()) {
        const existing = colorMap.get(textHex) || { count: 0, type: 'text', rgba: style.color };
        existing.count += 1;
        colorMap.set(textHex, existing);
      }
      const borderHex = rgbToHex(style.borderColor);
      if (borderHex && parseFloat(style.borderWidth) > 0) {
        const existing = colorMap.get(borderHex) || { count: 0, type: 'border', rgba: style.borderColor };
        existing.count += 1;
        colorMap.set(borderHex, existing);
      }
    } catch {
      // Ignore cross-origin stylesheet errors
    }
  }

  return Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      rgba: data.rgba,
      count: data.count,
      type: data.type,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * Extract distinct typography definitions from a DOM element tree
 */
export function extractTypographyFromElement(root: HTMLElement): ExtractedFont[] {
  const fontMap = new Map<string, { weights: Set<number>; sizes: Set<string> }>();
  const elements = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];

  for (const el of elements) {
    if (!isElementNode(el) || !el.textContent?.trim()) continue;
    try {
      const style = computedStyleOf(el);
      const family = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      const weight = parseInt(style.fontWeight, 10) || 400;
      const size = style.fontSize;

      if (!fontMap.has(family)) {
        fontMap.set(family, { weights: new Set(), sizes: new Set() });
      }
      const entry = fontMap.get(family)!;
      entry.weights.add(weight);
      entry.sizes.add(size);
    } catch {
      // ignore
    }
  }

  return Array.from(fontMap.entries())
    .map(([family, data]) => ({
      family,
      weights: Array.from(data.weights).sort((a, b) => a - b),
      sizes: Array.from(data.sizes).sort((a, b) => parseFloat(a) - parseFloat(b)),
    }))
    .slice(0, 10);
}

/**
 * Extract SVG icons and image assets from a DOM element tree
 */
export function extractAssetsFromElement(root: HTMLElement): DetectedAsset[] {
  const assets: DetectedAsset[] = [];
  const svgs = Array.from(root.querySelectorAll('svg')) as SVGSVGElement[];
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];

  svgs.forEach((svg, idx) => {
    try {
      const rect = svg.getBoundingClientRect();
      const name = svg.getAttribute('aria-label') || svg.getAttribute('id') || `icon_${idx + 1}`;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);

      assets.push({
        id: `svg-${idx}`,
        name,
        type: 'svg',
        width: Math.round(rect.width) || 24,
        height: Math.round(rect.height) || 24,
        svgContent: svgStr,
      });
    } catch {
      // ignore
    }
  });

  imgs.forEach((img, idx) => {
    try {
      const rect = img.getBoundingClientRect();
      const name = img.alt || `image_${idx + 1}`;
      assets.push({
        id: `img-${idx}`,
        name,
        type: 'img',
        width: Math.round(rect.width) || img.naturalWidth || 100,
        height: Math.round(rect.height) || img.naturalHeight || 100,
        src: img.src,
      });
    } catch {
      // ignore
    }
  });

  return assets.slice(0, 30);
}

/**
 * Generate Design Tokens Studio format JSON
 */
export function generateTokensStudioJson(colors: ExtractedColor[], fonts: ExtractedFont[]): string {
  const tokenStructure: Record<string, any> = {
    global: {
      color: {} as Record<string, any>,
      fontFamilies: {} as Record<string, any>,
      fontSizes: {} as Record<string, any>,
    },
  };

  colors.forEach((col, idx) => {
    const key = `color-${idx + 1}-${col.type}`;
    tokenStructure.global.color[key] = {
      value: col.hex,
      type: 'color',
      description: `${col.type} occurrence (${col.count}x)`,
    };
  });

  fonts.forEach((f, idx) => {
    tokenStructure.global.fontFamilies[`font-${idx + 1}`] = {
      value: f.family,
      type: 'fontFamilies',
    };
    f.sizes.forEach((sz) => {
      const sizeKey = `size-${sz.replace(/[^a-zA-Z0-9]/g, '_')}`;
      tokenStructure.global.fontSizes[sizeKey] = {
        value: sz,
        type: 'fontSizes',
      };
    });
  });

  return JSON.stringify(tokenStructure, null, 2);
}

/**
 * Generate CSS Custom Properties (:root variables)
 */
export function generateCssVariables(colors: ExtractedColor[], fonts: ExtractedFont[]): string {
  const lines: string[] = [':root {', '  /* Colors */'];
  colors.forEach((col, idx) => {
    lines.push(`  --color-${idx + 1}: ${col.hex}; /* ${col.type} */`);
  });

  lines.push('', '  /* Typography */');
  fonts.forEach((f, idx) => {
    lines.push(`  --font-family-${idx + 1}: "${f.family}", sans-serif;`);
  });

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate Tailwind CSS extended colors config
 */
export function generateTailwindConfig(colors: ExtractedColor[]): string {
  const colorEntries = colors.map((col, idx) => `      'brand-${idx + 1}': '${col.hex}',`);
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorEntries.join('\n')}
      },
    },
  },
};`;
}

/**
 * Convert Figma nodeChanges into a hierarchical Scenegraph tree for UI visualization
 */
export function buildScenegraphTree(nodeChanges: any[] = []): ScenegraphNode[] {
  if (!nodeChanges || !Array.isArray(nodeChanges) || nodeChanges.length === 0) {
    return [];
  }

  const nodesById = new Map<string, ScenegraphNode>();
  const childMap = new Map<string, string[]>();
  const rootIds: string[] = [];

  for (const nc of nodeChanges) {
    const id = nc.guid ? `${nc.guid.sessionID}:${nc.guid.localID}` : `node-${Math.random()}`;
    const name = nc.name || nc.type || 'Unnamed Layer';
    const type = nc.type || 'FRAME';
    const width = nc.size?.x || 0;
    const height = nc.size?.y || 0;
    const x = nc.transform?.m02 || 0;
    const y = nc.transform?.m12 || 0;
    const isAutoLayout = Boolean(nc.stackMode && nc.stackMode !== 'NONE');
    const layoutMode =
      nc.stackMode === 'HORIZONTAL' ? 'HORIZONTAL' : nc.stackMode === 'VERTICAL' ? 'VERTICAL' : 'NONE';

    const node: ScenegraphNode = {
      id,
      name,
      type,
      width: Math.round(width),
      height: Math.round(height),
      x: Math.round(x),
      y: Math.round(y),
      isAutoLayout,
      layoutMode,
      children: [],
    };

    nodesById.set(id, node);

    if (nc.parentIndex && nc.parentIndex.guid) {
      const parentId = `${nc.parentIndex.guid.sessionID}:${nc.parentIndex.guid.localID}`;
      if (!childMap.has(parentId)) {
        childMap.set(parentId, []);
      }
      childMap.get(parentId)!.push(id);
    } else {
      rootIds.push(id);
    }
  }

  // Populate children
  for (const [parentId, childrenIds] of childMap.entries()) {
    const parent = nodesById.get(parentId);
    if (parent) {
      parent.children = childrenIds
        .map((cid) => nodesById.get(cid))
        .filter((n): n is ScenegraphNode => Boolean(n));
    }
  }

  const topFrames = rootIds
    .map((id) => nodesById.get(id))
    .filter((n): n is ScenegraphNode => Boolean(n));

  return topFrames.length > 0 ? topFrames : Array.from(nodesById.values()).slice(0, 60);
}

/**
 * Count semantic and visual sections in the document or container
 */
function countDocumentSections(element: HTMLElement): number {
  try {
    const selector =
      'header, nav, section, main, article, footer, [id*="section"], [class*="section"], [class*="container"]';
    const matches = element.querySelectorAll(selector);
    if (matches.length > 0) {
      return matches.length;
    }
    return Math.max(1, element.children.length);
  } catch {
    return 1;
  }
}

/**
 * Main conversion function: takes a DOM Element and converts to Figma .fig binary + clipboard
 * Guarantees that ALL sections from top to bottom are captured without clipping,
 * form elements are completely rendered, and off-screen artifacts are filtered out.
 */
export async function convertDomToFigma(
  element: HTMLElement,
  options: {
    name?: string;
    autoLayout?: boolean;
    width?: number;
    height?: number;
  } = {}
): Promise<ConversionResult> {
  const startTime = performance.now();
  const { name = 'Exported Page', autoLayout = true } = options;

  // Reveal lazy images and scroll-triggered sections BEFORE measuring anything:
  // doing so usually makes the page taller, and a height measured beforehand would
  // crop the sections that just appeared.
  const restorePrime = await primeStageForCapture(element);

  const width = options.width ?? (element.scrollWidth || element.offsetWidth || 1200);
  const height = options.height ?? (element.scrollHeight || element.offsetHeight || 800);

  // 1. Extract Design Tokens & Assets
  const colors = extractColorsFromElement(element);
  const fonts = extractTypographyFromElement(element);
  const detectedAssets = extractAssetsFromElement(element);
  const tokensJson = generateTokensStudioJson(colors, fonts);
  const cssVariables = generateCssVariables(colors, fonts);
  const tailwindConfig = generateTailwindConfig(colors);

  // 2. Pre-process form controls (<input>, <select>, <textarea>, buttons)
  // so they convert into visual Figma frames with real text, borders, and backgrounds.
  const restoreForms = prepareFormElementsForConversion(element);

  let convertResult: any;
  try {
    // 3. Initialize Figma converter with smart classification (filter offscreen drawers/modals)
    const converter = createFigmaConverter({
      layout: autoLayout ? 'auto' : 'absolute',
      imageLoader: createRobustImageLoader(),
      classify: createSmartClassify(),
    });

    convertResult = await converter.convert({
      element,
      width,
      height,
      name,
    });
  } finally {
    // Immediately restore original DOM in the iframe
    restoreForms();
    restorePrime();
  }

  const { document } = convertResult;

  // 4. Guarantee that the root frame encloses all sections, has clipping disabled,
  // AND has stackMode set to "NONE" (so Figma does not collapse child coordinates into a vertical stack at y=0!)
  if (document && Array.isArray(document.nodeChanges)) {
    for (const item of document.nodeChanges) {
      const nc = item as any;
      if (
        (nc.guid?.sessionID === 0 && nc.guid?.localID === 2) ||
        (nc.type === 'FRAME' && (!nc.parentIndex || !nc.parentIndex.guid))
      ) {
        nc.frameMaskDisabled = true; // DO NOT CLIP: allows all sections below the fold to display fully
        nc.stackMode = 'NONE'; // CRUCIAL: root artboard must NOT be an auto-layout stack
        if (nc.size) {
          nc.size.y = Math.max(nc.size.y || 0, height);
          nc.size.x = Math.max(nc.size.x || 0, width);
        }
      }
    }
  }

  // 5. Re-encode Kiwi data with the updated root frame properties
  const encoded = encodeFigmaData(document);
  const bytes = encoded.figBytes;
  const clipboardHtml = composeClipboardHtml(encoded.base64);
  const figBase64 = encoded.base64;

  // 6. Create .fig ZIP file containing canvas.fig and meta.json
  const zip = new JSZip();
  zip.file('canvas.fig', bytes);
  zip.file(
    'meta.json',
    JSON.stringify(
      {
        client_meta: {
          version: 106,
          name: name.replace(/[^a-zA-Z0-9_\-\s]/g, '_'),
        },
      },
      null,
      2
    )
  );

  const figBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/x-figma',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 7. Calculate statistics
  const nodeChanges = document?.nodeChanges || [];
  let framesCount = 0;
  let textCount = 0;
  let vectorCount = 0;
  let autoLayoutStacks = 0;

  for (const item of nodeChanges) {
    const nc = item as any;
    if (nc.type === 'FRAME') framesCount++;
    else if (nc.type === 'TEXT') textCount++;
    else if (nc.type === 'VECTOR' || nc.type === 'BOOLEAN_OPERATION') vectorCount++;
    if (nc.stackMode && nc.stackMode !== 'NONE') autoLayoutStacks++;
  }

  const durationMs = Math.round(performance.now() - startTime);
  const figmaFileSizeKb = parseFloat((figBlob.size / 1024).toFixed(1));
  const detectedSections = countDocumentSections(element);

  const stats: ConversionStats = {
    totalNodes: nodeChanges.length,
    framesCount,
    textCount,
    vectorCount,
    autoLayoutStacks,
    colorsCount: colors.length,
    fontsCount: fonts.length,
    durationMs,
    figmaFileSizeKb,
  };

  const scenegraph = buildScenegraphTree(nodeChanges);

  return {
    figBlob,
    figBase64,
    clipboardHtml,
    document,
    stats: {
      ...stats,
      ...(detectedSections ? { sectionCount: detectedSections } : {}),
    } as any,
    colors,
    fonts,
    scenegraph,
    detectedAssets,
    tokensJson,
    cssVariables,
    tailwindConfig,
  };
}

/**
 * One offscreen rendering stage: a real iframe laid out at an exact viewport size.
 *
 * This is what makes responsive export truthful. Declaring `width: 375` on a frame
 * does NOT reflow anything — the converter only measures the DOM it is handed, so
 * handing it the same desktop-rendered body four times produces four identical
 * desktop artboards. Giving each breakpoint its own iframe means the page's own
 * media queries, container queries, flex wrapping and `vw`/`vh` units genuinely
 * re-run at that width before a single node is measured.
 */
export interface ResponsiveBreakpoint {
  key: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  label: string;
  width: number;
  /** Viewport height for the stage, so `100vh` / `dvh` heroes resolve correctly. */
  viewportHeight: number;
}

export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { key: 'desktop', label: 'Desktop', width: 1440, viewportHeight: 900 },
  { key: 'laptop', label: 'Laptop', width: 1200, viewportHeight: 750 },
  { key: 'tablet', label: 'Tablet', width: 768, viewportHeight: 1024 },
  { key: 'mobile', label: 'Mobile', width: 375, viewportHeight: 812 },
];

interface ResponsiveStage {
  body: HTMLElement;
  width: number;
  /** Full laid-out document height at this width (taller than the viewport). */
  height: number;
  dispose: () => void;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Two rAFs guarantee style + layout have been flushed for the iframe's document. */
function afterLayout(win: Window): Promise<void> {
  return new Promise((resolve) => {
    try {
      win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()));
    } catch {
      resolve();
    }
  });
}

/**
 * Waits for the things that change layout after first paint: webfonts swapping in,
 * images resolving their intrinsic size, and the Tailwind Play CDN generating
 * utility CSS (without it, a stage renders completely unstyled).
 */
async function waitForStageAssets(iframe: HTMLIFrameElement, timeoutMs: number): Promise<void> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) return;
  const deadline = Date.now() + timeoutMs;
  const remaining = () => Math.max(0, deadline - Date.now());

  // Tailwind Play CDN: wait for the runtime to attach, then for it to emit utilities.
  if (doc.querySelector('script[src*="tailwindcss.com"]')) {
    while (!(win as any).tailwind && remaining() > 0) {
      await delay(50);
    }
    await delay(250);
  }

  // Webfonts — metrics shift every line box, so measuring before this is wrong.
  try {
    await Promise.race([(doc as any).fonts?.ready ?? Promise.resolve(), delay(remaining())]);
  } catch {
    // ignore
  }

  // Images: an undecoded <img> has no intrinsic size and collapses the layout around it.
  const images = Array.from(doc.images || []);
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, remaining());
        })
    )
  );

  await afterLayout(win);
}

/**
 * Builds an offscreen iframe rendered at `width`, writes the source HTML into it and
 * resolves once it has settled. The iframe stays at the real viewport height (so `vh`
 * units are correct) while the reported `height` is the full scroll height, which is
 * what the artboard needs to be so nothing below the fold is clipped.
 */
async function createResponsiveStage(
  html: string,
  breakpoint: ResponsiveBreakpoint,
  timeoutMs = 12000
): Promise<ResponsiveStage> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText = [
    'position:fixed',
    // Parked offscreen rather than hidden: `display:none` / `visibility:hidden`
    // would stop layout entirely and every measured rect would come back zero.
    'left:-20000px',
    'top:0',
    'border:0',
    'margin:0',
    'padding:0',
    'opacity:0',
    'pointer-events:none',
    'z-index:-1',
    `width:${breakpoint.width}px`,
    `height:${breakpoint.viewportHeight}px`,
  ].join(';');

  document.body.appendChild(iframe);

  const dispose = () => {
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error('Unable to create offscreen rendering stage');

    doc.open();
    doc.write(html);
    doc.close();

    // A page with no width=device-width viewport is laid out at ~980px inside a
    // narrow iframe, which silently defeats every mobile media query.
    if (!doc.querySelector('meta[name="viewport"]')) {
      const meta = doc.createElement('meta');
      meta.setAttribute('name', 'viewport');
      meta.setAttribute('content', 'width=device-width, initial-scale=1');
      doc.head?.prepend(meta);
    }

    if (doc.readyState !== 'complete') {
      await Promise.race([
        new Promise<void>((resolve) => iframe.addEventListener('load', () => resolve(), { once: true })),
        delay(timeoutMs),
      ]);
    }

    await waitForStageAssets(iframe, timeoutMs);

    const body = doc.body as HTMLElement;
    if (!body) throw new Error('Offscreen rendering stage produced an empty document');

    // Scroll this breakpoint through its own lazy content before measuring height.
    // No restore needed: the stage iframe is disposed right after the conversion.
    await primeStageForCapture(body);

    const height = Math.max(
      doc.documentElement?.scrollHeight || 0,
      body.scrollHeight || 0,
      body.offsetHeight || 0,
      breakpoint.viewportHeight
    );

    return { body, width: breakpoint.width, height, dispose };
  } catch (err) {
    dispose();
    throw err;
  }
}

/**
 * Multi-Artboard Conversion:
 * Exports Desktop (1440), Laptop (1200), Tablet (768), and Mobile (375) onto a SINGLE
 * Figma canvas — each one genuinely re-rendered at its own width, not a resized copy
 * of the desktop layout.
 */
export async function convertMultiArtboardsToFigma(
  html: string,
  options: {
    name?: string;
    autoLayout?: boolean;
    /** Horizontal spacing between artboards on the Figma canvas. */
    gap?: number;
    breakpoints?: ResponsiveBreakpoint[];
    onProgress?: (message: string) => void;
  } = {}
): Promise<ConversionResult> {
  const startTime = performance.now();
  const {
    name = 'Responsive Suite',
    autoLayout = true,
    // Roomy enough that the artboards read as four separate designs at fit-zoom
    // instead of one continuous strip.
    gap = 240,
    breakpoints = RESPONSIVE_BREAKPOINTS,
    onProgress,
  } = options;

  if (!html || !html.trim()) {
    throw new Error('No HTML source available to render the responsive artboards.');
  }

  const stages: ResponsiveStage[] = [];

  try {
    // Render every breakpoint up front: the converter reads all four DOMs during a
    // single convert() call, so they must all be laid out and settled by then.
    for (const bp of breakpoints) {
      onProgress?.(`Rendering ${bp.label} (${bp.width}px)…`);
      stages.push(await createResponsiveStage(html, bp));
    }

    const desktopStage = stages[0];

    const colors = extractColorsFromElement(desktopStage.body);
    const fonts = extractTypographyFromElement(desktopStage.body);
    const detectedAssets = extractAssetsFromElement(desktopStage.body);
    const tokensJson = generateTokensStudioJson(colors, fonts);
    const cssVariables = generateCssVariables(colors, fonts);
    const tailwindConfig = generateTailwindConfig(colors);

    const restorers = stages.map((stage) => prepareFormElementsForConversion(stage.body));

    let convertResult: any;
    try {
      const converter = createFigmaConverter({
        layout: autoLayout ? 'auto' : 'absolute',
        imageLoader: createRobustImageLoader(),
        classify: createSmartClassify(),
      });

      // Lay the artboards out left to right, top aligned, each as tall as its own
      // content — a mobile artboard is far taller than the desktop one and gets cut
      // in half if they are forced to share a single height.
      let cursorX = 0;
      const frames = stages.map((stage, index) => {
        const bp = breakpoints[index];
        const frame = {
          element: stage.body,
          width: stage.width,
          height: stage.height,
          x: cursorX,
          y: 0,
          name: `${name} — ${bp.label} (${bp.width}px)`,
        };
        cursorX += stage.width + gap;
        return frame;
      });

      onProgress?.('Encoding Figma artboards…');
      convertResult = await converter.convert({
        frames,
        canvasName: `${name} — Responsive Multi-Artboard Suite`,
      });
    } finally {
      restorers.forEach((restore) => {
        try {
          restore();
        } catch {
          // ignore
        }
      });
    }

    const { document: figmaDocument } = convertResult;

    // Ensure every artboard has clipping disabled and stackMode NONE, matching the
    // single-frame export. In canvas mode the artboards are children of the CANVAS
    // node, not parentless — testing for a missing parent (as the single-frame path
    // does) matches nothing here and silently leaves the artboards clipped and
    // stacked, which drops everything below the fold and re-flows children to y=0.
    if (figmaDocument && Array.isArray(figmaDocument.nodeChanges)) {
      const guidKey = (g: any) => (g ? `${g.sessionID}:${g.localID}` : null);
      const canvasKeys = new Set(
        figmaDocument.nodeChanges
          .filter((nc: any) => nc.type === 'CANVAS')
          .map((nc: any) => guidKey(nc.guid))
          .filter(Boolean)
      );

      for (const item of figmaDocument.nodeChanges) {
        const nc = item as any;
        if (nc.type !== 'FRAME') continue;
        const parentKey = guidKey(nc.parentIndex?.guid);
        if (parentKey === null || canvasKeys.has(parentKey)) {
          nc.frameMaskDisabled = true;
          nc.stackMode = 'NONE';
        }
      }
    }

    const encoded = encodeFigmaData(figmaDocument);
    const bytes = encoded.figBytes;
    const clipboardHtml = composeClipboardHtml(encoded.base64);
    const figBase64 = encoded.base64;

    const zip = new JSZip();
    zip.file('canvas.fig', bytes);
    zip.file(
      'meta.json',
      JSON.stringify(
        {
          client_meta: {
            version: 106,
            name: `${name.replace(/[^a-zA-Z0-9_\-\s]/g, '_')}_responsive_suite`,
          },
        },
        null,
        2
      )
    );

    const figBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/x-figma',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const nodeChanges = figmaDocument?.nodeChanges || [];
    let framesCount = 0;
    let textCount = 0;
    let vectorCount = 0;
    let autoLayoutStacks = 0;

    for (const item of nodeChanges) {
      const nc = item as any;
      if (nc.type === 'FRAME') framesCount++;
      else if (nc.type === 'TEXT') textCount++;
      else if (nc.type === 'VECTOR') vectorCount++;
      if (nc.stackMode && nc.stackMode !== 'NONE') autoLayoutStacks++;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const figmaFileSizeKb = parseFloat((figBlob.size / 1024).toFixed(1));

    const stats: ConversionStats = {
      totalNodes: nodeChanges.length,
      framesCount,
      textCount,
      vectorCount,
      autoLayoutStacks,
      colorsCount: colors.length,
      fontsCount: fonts.length,
      durationMs,
      figmaFileSizeKb,
    };

    const scenegraph = buildScenegraphTree(nodeChanges);

    return {
      figBlob,
      figBase64,
      clipboardHtml,
      document: figmaDocument,
      stats: {
        ...stats,
        sectionCount: stages.length,
      } as any,
      colors,
      fonts,
      scenegraph,
      detectedAssets,
      tokensJson,
      cssVariables,
      tailwindConfig,
    };
  } finally {
    stages.forEach((stage) => stage.dispose());
  }
}

/**
 * Downloads a binary .fig blob as a file in the browser
 */
export function downloadFigFile(blob: Blob, filename = 'exported_design.fig') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy rich HTML payload to the clipboard so Figma receives native Kiwi binary data
 */
export async function copyToFigmaClipboard(clipboardHtml: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = new Blob([clipboardHtml], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Modern Clipboard API write failed, trying fallback...', err);
  }

  // Fallback using invisible textarea / contentEditable container
  try {
    const listener = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', clipboardHtml);
        e.clipboardData.setData('text/plain', '<!-- Figma Kiwi Clipboard Data -->');
      }
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);
    return true;
  } catch (err) {
    console.error('All clipboard methods failed:', err);
    return false;
  }
}

/**
 * Helper to download raw text or JSON file
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(data: any, filename: string) {
  downloadTextFile(JSON.stringify(data, null, 2), filename, 'application/json');
}
