import { HtmlTemplate } from '../types';

export const HTML_TEMPLATES: HtmlTemplate[] = [
  {
    id: 'saas-landing-full',
    name: 'Full SaaS Landing Page (All Sections)',
    category: 'Landing Page',
    description: 'Complete multi-section design: Header Nav, Hero, Social Proof Logos, Feature Grid, Bento Metrics, Pricing Matrix, Testimonials, CTA Banner, and Footer.',
    width: 1440,
    height: 3800,
    html: `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0a0d14; color: #f3f4f6; overflow-x: hidden; }
  </style>
</head>
<body class="flex flex-col w-full bg-[#0a0d14] text-slate-100">

  <!-- ================= SECTION 1: HEADER & NAVIGATION ================= -->
  <header class="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <!-- Brand Logo -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span class="text-xl font-bold tracking-tight text-white">Kiwi<span class="text-indigo-400">Flow</span></span>
      </div>

      <!-- Navigation Links -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-white transition">Features</a>
        <a href="#metrics" class="hover:text-white transition">Engine Specs</a>
        <a href="#pricing" class="hover:text-white transition">Pricing</a>
        <a href="#testimonials" class="hover:text-white transition">Testimonials</a>
        <a href="#docs" class="hover:text-white transition">Documentation</a>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-4">
        <a href="#signin" class="text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline">Sign In</a>
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2">
          <span>Get Started Free</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- ================= SECTION 2: HERO BANNER & CTAS ================= -->
  <section class="relative pt-20 pb-24 px-6 overflow-hidden border-b border-slate-800/60">
    <div class="max-w-5xl mx-auto flex flex-col items-center text-center">
      <!-- Announcement Pill -->
      <div class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 mb-8 shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-white font-semibold">Kiwi Schema Engine v2.4</span>
        <span class="text-slate-600">•</span>
        <span class="text-indigo-400">Auto Layout Inference is Live &rarr;</span>
      </div>

      <!-- Main Headline -->
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] max-w-4xl">
        Convert live websites into native <span class="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">Figma .fig files</span>
      </h1>

      <!-- Subtitle -->
      <p class="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
        Turn any HTML component, URL, or CSS design system into pixel-perfect Figma layers with preserved vectors, tokens, typography scales, and Auto Layout.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-wrap items-center justify-center gap-4 mb-16">
        <button class="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2.5">
          <span>Export All Sections</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
        <button class="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-base border border-slate-700/80 shadow-md transition-all">
          Explore Schema Docs
        </button>
      </div>

      <!-- Visual Stage Preview Frame -->
      <div class="w-full max-w-4xl bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-2xl">
        <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 text-xs text-slate-400 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span class="ml-2 font-mono text-[11px] text-slate-500">figma-converter.desktop.1440px</span>
          </div>
          <span class="bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded text-[10px]">Auto Layout Enabled</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-2">
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div class="text-xs font-mono text-indigo-400 mb-1">FRAME 1</div>
            <div class="text-sm font-bold text-white mb-1">Hero & Navigation</div>
            <div class="text-xs text-slate-400">Flexbox horizontal alignment with spacing tokens</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div class="text-xs font-mono text-violet-400 mb-1">FRAME 2</div>
            <div class="text-sm font-bold text-white mb-1">Feature Bento Grid</div>
            <div class="text-xs text-slate-400">Nested card auto-stacks and vector glyph shapes</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div class="text-xs font-mono text-emerald-400 mb-1">FRAME 3</div>
            <div class="text-sm font-bold text-white mb-1">Tiered Pricing Cards</div>
            <div class="text-xs text-slate-400">Border radius, dropshadows, and button states</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 3: SOCIAL PROOF LOGOS ================= -->
  <section class="py-14 px-6 border-b border-slate-800/60 bg-slate-950/40">
    <div class="max-w-7xl mx-auto flex flex-col items-center">
      <p class="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-8 text-center">
        Trusted by product design teams at fast-growing tech companies
      </p>
      <div class="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">◈ ACME CORP</span>
        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">▲ VORTEX LABS</span>
        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">◼ PULSE DATA</span>
        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">✦ SYNAPSE AI</span>
        <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">● LUMEN CORE</span>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 4: CORE FEATURES BENTO GRID ================= -->
  <section id="features" class="py-24 px-6 border-b border-slate-800/60">
    <div class="max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Enterprise Capabilities</h2>
        <h3 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
          Everything you need to migrate code to design
        </h3>
        <p class="text-slate-400 text-base leading-relaxed">
          Convert high-fidelity production websites directly into native Figma frames with complete structural integrity.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 font-bold text-xl">
              ⚡
            </div>
            <h4 class="text-xl font-bold text-white mb-3">Auto Layout Inference</h4>
            <p class="text-sm text-slate-400 leading-relaxed mb-6">
              CSS flexbox directions, alignments, gaps, and padding are automatically mapped to native Figma vertical and horizontal Auto Layout frames.
            </p>
          </div>
          <div class="pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 flex items-center gap-1">
            <span>Learn about flex mapping &rarr;</span>
          </div>
        </div>

        <!-- Feature 2 -->
        <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 font-bold text-xl">
              🎨
            </div>
            <h4 class="text-xl font-bold text-white mb-3">Design Token Extraction</h4>
            <p class="text-sm text-slate-400 leading-relaxed mb-6">
              Extract exact hex color palettes and typography scales directly into W3C Tokens Studio JSON, CSS variables, and Tailwind theme config.
            </p>
          </div>
          <div class="pt-4 border-t border-slate-800 text-xs font-semibold text-violet-400 flex items-center gap-1">
            <span>Inspect design tokens &rarr;</span>
          </div>
        </div>

        <!-- Feature 3 -->
        <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 font-bold text-xl">
              ⌘
            </div>
            <h4 class="text-xl font-bold text-white mb-3">Direct Clipboard Paste</h4>
            <p class="text-sm text-slate-400 leading-relaxed mb-6">
              One-click pasteboard transfer. Copy anywhere in your browser and press Ctrl+V in Figma to paste fully editable layers instantly.
            </p>
          </div>
          <div class="pt-4 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <span>See paste workflow &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 5: PERFORMANCE METRICS BAR ================= -->
  <section id="metrics" class="py-20 px-6 border-b border-slate-800/60 bg-slate-950/80">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div class="text-4xl md:text-5xl font-extrabold text-white mb-2">99.8%</div>
          <div class="text-sm font-semibold text-slate-300 mb-1">Layout Fidelity</div>
          <div class="text-xs text-slate-500">Matches computed CSS bounding boxes</div>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div class="text-4xl md:text-5xl font-extrabold text-white mb-2">&lt;120ms</div>
          <div class="text-sm font-semibold text-slate-300 mb-1">Kiwi Compilation</div>
          <div class="text-xs text-slate-500">Binary byte-stream encoding speed</div>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div class="text-4xl md:text-5xl font-extrabold text-white mb-2">100%</div>
          <div class="text-sm font-semibold text-slate-300 mb-1">Vector Parity</div>
          <div class="text-xs text-slate-500">Clean SVG path bezier curves</div>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div class="text-4xl md:text-5xl font-extrabold text-white mb-2">0</div>
          <div class="text-sm font-semibold text-slate-300 mb-1">Third-Party Plugins</div>
          <div class="text-xs text-slate-500">Native .fig and pasteboard format</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 6: TIERED PRICING MATRIX ================= -->
  <section id="pricing" class="py-24 px-6 border-b border-slate-800/60">
    <div class="max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Transparent Plans</h2>
        <h3 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
          Simple pricing for designers & developers
        </h3>
        <p class="text-slate-400 text-base leading-relaxed">
          Choose the tier that matches your workflow needs with zero hidden fees.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <!-- Starter Plan -->
        <div class="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Starter</div>
            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-4xl font-extrabold text-white">$0</span>
              <span class="text-xs text-slate-500">/month</span>
            </div>
            <p class="text-xs text-slate-400 mb-8 leading-relaxed">
              Essential HTML to Figma conversion tools for solo designers and side projects.
            </p>
            <ul class="space-y-3.5 text-xs text-slate-300 mb-8">
              <li class="flex items-center gap-2">✓ Unlimited HTML paste conversions</li>
              <li class="flex items-center gap-2">✓ Download native .fig file format</li>
              <li class="flex items-center gap-2">✓ Direct Figma clipboard paste</li>
              <li class="flex items-center gap-2 text-slate-500">✗ Automated live URL crawler</li>
            </ul>
          </div>
          <button class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700">
            Get Started Free
          </button>
        </div>

        <!-- Pro Plan (Featured) -->
        <div class="bg-slate-900 text-white rounded-3xl p-8 border-2 border-indigo-500 flex flex-col justify-between shadow-2xl relative">
          <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full tracking-wider shadow-md">
            MOST POPULAR
          </div>
          <div>
            <div class="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Professional</div>
            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-4xl font-extrabold text-white">$29</span>
              <span class="text-xs text-slate-400">/month</span>
            </div>
            <p class="text-xs text-slate-300 mb-8 leading-relaxed">
              For product design teams building design systems from live web pages.
            </p>
            <ul class="space-y-3.5 text-xs text-slate-200 mb-8">
              <li class="flex items-center gap-2">✓ Everything in Starter</li>
              <li class="flex items-center gap-2">✓ Full URL to .fig extraction</li>
              <li class="flex items-center gap-2">✓ Multi-Artboard responsive suite</li>
              <li class="flex items-center gap-2">✓ Design token palette export</li>
            </ul>
          </div>
          <button class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/40 transition">
            Start 14-Day Free Trial
          </button>
        </div>

        <!-- Enterprise Plan -->
        <div class="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Enterprise</div>
            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-4xl font-extrabold text-white">$99</span>
              <span class="text-xs text-slate-500">/month</span>
            </div>
            <p class="text-xs text-slate-400 mb-8 leading-relaxed">
              Large-scale automated design system synchronization and CI/CD pipelines.
            </p>
            <ul class="space-y-3.5 text-xs text-slate-300 mb-8">
              <li class="flex items-center gap-2">✓ Everything in Professional</li>
              <li class="flex items-center gap-2">✓ Headless CLI automation API</li>
              <li class="flex items-center gap-2">✓ Dedicated REST API webhook</li>
              <li class="flex items-center gap-2">✓ 99.9% uptime SLA guarantee</li>
            </ul>
          </div>
          <button class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 7: TESTIMONIALS & REVIEWS ================= -->
  <section id="testimonials" class="py-24 px-6 border-b border-slate-800/60 bg-slate-950/60">
    <div class="max-w-7xl mx-auto">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Loved by Builders</h2>
        <h3 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          What design engineers say
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <p class="text-sm text-slate-300 leading-relaxed mb-6">
            &ldquo;We migrated our entire component library from Tailwind into Figma in an afternoon. The Auto Layout inference saved our team dozens of hours of manual recreation.&rdquo;
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              SL
            </div>
            <div>
              <div class="text-sm font-bold text-white">Sarah Lin</div>
              <div class="text-xs text-slate-400">Head of Product Design, Apex</div>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <p class="text-sm text-slate-300 leading-relaxed mb-6">
            &ldquo;The clipboard paste feature is like magic. You literally just click Copy, switch to Figma, press Ctrl+V, and you get pure editable components with true text layers.&rdquo;
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-sm">
              MK
            </div>
            <div>
              <div class="text-sm font-bold text-white">Marcus Klein</div>
              <div class="text-xs text-slate-400">Lead Design Technologist, Studio 9</div>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <p class="text-sm text-slate-300 leading-relaxed mb-6">
            &ldquo;Being able to fetch any live URL and export desktop, tablet, and mobile frames on a single Figma canvas has completely transformed our competitive audit workflow.&rdquo;
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              ER
            </div>
            <div>
              <div class="text-sm font-bold text-white">Elena Rostova</div>
              <div class="text-xs text-slate-400">Principal UX Architect, Nova</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 8: CALL TO ACTION BANNER ================= -->
  <section class="py-24 px-6 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 to-indigo-950/40">
    <div class="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      <div class="relative z-10">
        <h3 class="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          Ready to sync your code with Figma?
        </h3>
        <p class="text-slate-300 text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Start converting live URLs, web components, and HTML templates into production-ready .fig files today.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <button class="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition">
            Export All Sections Now
          </button>
          <button class="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition">
            Install Bookmarklet
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= SECTION 9: FOOTER ================= -->
  <footer class="py-16 px-6 bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80">
    <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
      <div class="col-span-2">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span class="text-base font-bold text-white tracking-tight">KiwiFlow</span>
        </div>
        <p class="text-slate-400 max-w-sm mb-4 leading-relaxed">
          The next-generation bridge between frontend code and native Figma design systems with Kiwi binary protocol.
        </p>
        <div class="text-slate-500 text-[11px]">
          &copy; 2026 KiwiFlow Technologies Inc. All rights reserved.
        </div>
      </div>

      <div>
        <div class="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">Product</div>
        <ul class="space-y-2.5">
          <li><a href="#features" class="hover:text-white transition">Auto Layout Engine</a></li>
          <li><a href="#metrics" class="hover:text-white transition">Kiwi Binary Format</a></li>
          <li><a href="#pricing" class="hover:text-white transition">Multi-Artboards</a></li>
          <li><a href="#tokens" class="hover:text-white transition">Design Tokens</a></li>
        </ul>
      </div>

      <div>
        <div class="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">Resources</div>
        <ul class="space-y-2.5">
          <li><a href="#docs" class="hover:text-white transition">Documentation</a></li>
          <li><a href="#guides" class="hover:text-white transition">Figma Paste Guide</a></li>
          <li><a href="#bookmarklet" class="hover:text-white transition">Chrome Bookmarklet</a></li>
          <li><a href="#changelog" class="hover:text-white transition">Changelog</a></li>
        </ul>
      </div>

      <div>
        <div class="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">Legal</div>
        <ul class="space-y-2.5">
          <li><a href="#privacy" class="hover:text-white transition">Privacy Policy</a></li>
          <li><a href="#terms" class="hover:text-white transition">Terms of Service</a></li>
          <li><a href="#security" class="hover:text-white transition">Security & Trust</a></li>
          <li><a href="#status" class="hover:text-white transition">System Status (99.9%)</a></li>
        </ul>
      </div>
    </div>
  </footer>

</body>
</html>`
  },
  {
    id: 'pricing-table',
    name: 'Pricing & Feature Comparison Page',
    category: 'Pricing',
    description: 'Header, Announcement banner, 3-tier card pricing, feature comparison table, and FAQ accordion sections.',
    width: 1200,
    height: 1800,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; }
  </style>
</head>
<body class="flex flex-col w-full bg-slate-50 text-slate-900">
  <!-- Nav Section -->
  <header class="w-full bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center">
    <div class="font-bold text-lg text-slate-900">Acme Pricing</div>
    <div class="flex gap-6 text-sm text-slate-600 font-medium">
      <span>Plans</span>
      <span>Enterprise</span>
      <span>Contact</span>
    </div>
  </header>

  <!-- Pricing Header Section -->
  <section class="py-16 px-6 text-center max-w-4xl mx-auto">
    <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest">Plans for Teams of All Sizes</span>
    <h1 class="text-4xl font-extrabold text-slate-900 mt-2 mb-4">Simple, Predictable Pricing</h1>
    <p class="text-slate-600 text-sm max-w-md mx-auto">Generate production .fig files with no subscription constraints or surprise overages.</p>
  </section>

  <!-- Cards Section -->
  <section class="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
    <!-- Starter -->
    <div class="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-sm">
      <div>
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Starter</div>
        <div class="text-4xl font-extrabold text-slate-900 mb-4">$0 <span class="text-xs font-normal text-slate-500">/mo</span></div>
        <p class="text-xs text-slate-600 mb-6">Essential conversion tools for solo designers and tinkerers.</p>
        <ul class="space-y-3 text-xs text-slate-700 mb-8">
          <li>✓ Unlimited HTML conversions</li>
          <li>✓ Download .fig file format</li>
          <li>✓ Direct Figma clipboard paste</li>
        </ul>
      </div>
      <button class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition">Get Started Free</button>
    </div>

    <!-- Pro -->
    <div class="bg-slate-900 text-white rounded-2xl p-8 border-2 border-indigo-500 flex flex-col justify-between shadow-xl relative">
      <div>
        <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Professional</div>
        <div class="text-4xl font-extrabold text-white mb-4">$29 <span class="text-xs font-normal text-slate-400">/mo</span></div>
        <p class="text-xs text-slate-300 mb-6">For design engineers building design systems from live websites.</p>
        <ul class="space-y-3 text-xs text-slate-200 mb-8">
          <li>✓ Everything in Starter</li>
          <li>✓ Full URL to .fig extraction</li>
          <li>✓ Auto Layout flex inference</li>
          <li>✓ Design token palette export</li>
        </ul>
      </div>
      <button class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition">Start 14-Day Trial</button>
    </div>

    <!-- Enterprise -->
    <div class="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-sm">
      <div>
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enterprise</div>
        <div class="text-4xl font-extrabold text-slate-900 mb-4">$99 <span class="text-xs font-normal text-slate-500">/mo</span></div>
        <p class="text-xs text-slate-600 mb-6">Bulk batch extraction and CI/CD automated design token sync.</p>
        <ul class="space-y-3 text-xs text-slate-700 mb-8">
          <li>✓ Everything in Professional</li>
          <li>✓ Headless CLI automation</li>
          <li>✓ Dedicated REST API webhook</li>
          <li>✓ 99.9% uptime SLA guarantee</li>
        </ul>
      </div>
      <button class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition">Contact Sales</button>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="max-w-4xl mx-auto px-6 pb-24 border-t border-slate-200 pt-16">
    <h2 class="text-2xl font-bold text-center text-slate-900 mb-10">Frequently Asked Questions</h2>
    <div class="space-y-4">
      <div class="p-5 rounded-xl bg-white border border-slate-200">
        <h4 class="font-bold text-sm text-slate-900 mb-1">How does pasting into Figma work?</h4>
        <p class="text-xs text-slate-600">We construct an authentic Figma scene clipboard payload. When you press Ctrl+V inside any Figma document, Figma unpacks the layers natively.</p>
      </div>
      <div class="p-5 rounded-xl bg-white border border-slate-200">
        <h4 class="font-bold text-sm text-slate-900 mb-1">Are all sections captured?</h4>
        <p class="text-xs text-slate-600">Yes! The converter automatically analyzes the full scroll height of the page and captures every single section from header to footer without clipping.</p>
      </div>
    </div>
  </section>

  <!-- Simple Footer -->
  <footer class="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
    &copy; 2026 Acme Pricing. All rights reserved.
  </footer>
</body>
</html>`
  }
];
