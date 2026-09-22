export type InputMode = 'url' | 'code' | 'upload';

export type ViewportMode = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'custom';

export type CanvasBgStyle = 'dots' | 'dark' | 'light' | 'checkered';

export interface ViewportDimensions {
  width: number;
  height: number;
  label: string;
}

export interface ExtractedColor {
  hex: string;
  rgba: string;
  count: number;
  type: 'background' | 'text' | 'border';
}

export interface ExtractedFont {
  family: string;
  weights: number[];
  sizes: string[];
}

export interface ScenegraphNode {
  id: string;
  name: string;
  type: 'FRAME' | 'TEXT' | 'VECTOR' | 'RECTANGLE' | 'GROUP' | 'COMPONENT';
  width: number;
  height: number;
  x: number;
  y: number;
  isAutoLayout?: boolean;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  domSelector?: string;
  children?: ScenegraphNode[];
}

export interface ConversionStats {
  totalNodes: number;
  framesCount: number;
  textCount: number;
  vectorCount: number;
  autoLayoutStacks: number;
  colorsCount: number;
  fontsCount: number;
  durationMs: number;
  figmaFileSizeKb: number;
}

export interface DetectedAsset {
  id: string;
  type: 'svg' | 'img';
  name: string;
  src?: string;
  svgContent?: string;
  width: number;
  height: number;
}

export interface ConversionResult {
  figBlob: Blob;
  figBase64: string;
  clipboardHtml: string;
  document: any;
  stats: ConversionStats;
  colors: ExtractedColor[];
  fonts: ExtractedFont[];
  scenegraph: ScenegraphNode[];
  detectedAssets: DetectedAsset[];
  tokensJson: string;
  cssVariables: string;
  tailwindConfig: string;
}

export interface SelectedElementInfo {
  tagName: string;
  className?: string;
  id?: string;
  width: number;
  height: number;
  color?: string;
  bg?: string;
  font?: string;
  selector?: string;
  element?: HTMLElement;
}

export interface HtmlTemplate {
  id: string;
  name: string;
  category: 'Hero' | 'Card' | 'Pricing' | 'Dashboard' | 'Mobile' | 'Forms' | 'Landing Page';
  description: string;
  width: number;
  height: number;
  html: string;
}
