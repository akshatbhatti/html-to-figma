import express from 'express';
import path from 'path';
import cors from 'cors';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy URL fetcher to bypass CORS and resolve assets
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`,
      });
    }

    const rawHtml = await response.text();
    const $ = cheerio.load(rawHtml);

    const baseUrl = parsedUrl.origin;
    const currentHref = parsedUrl.href;

    // Remove scripts that cause redirects or break iframe execution
    $('script').each((_, el) => {
      const src = $(el).attr('src') || '';
      // Retain simple math or harmless inline script, but drop aggressive trackers/redirectors
      if (src.includes('analytics') || src.includes('gtag') || src.includes('facebook') || src.includes('hotjar')) {
        $(el).remove();
      }
    });

    // Remove framebusters
    $('meta[http-equiv="Content-Security-Policy"]').remove();

    // Resolve all relative URLs to absolute URLs
    $('img, source, video, audio').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
        try {
          $(el).attr('src', new URL(src, currentHref).href);
        } catch {
          // ignore invalid urls
        }
      }
      const srcset = $(el).attr('srcset');
      if (srcset) {
        try {
          const newSrcset = srcset
            .split(',')
            .map((item) => {
              const parts = item.trim().split(/\s+/);
              if (parts[0] && !parts[0].startsWith('data:')) {
                parts[0] = new URL(parts[0], currentHref).href;
              }
              return parts.join(' ');
            })
            .join(', ');
          $(el).attr('srcset', newSrcset);
        } catch {
          // ignore
        }
      }
    });

    $('link[rel="stylesheet"], link[rel="preload"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('data:')) {
        try {
          $(el).attr('href', new URL(href, currentHref).href);
        } catch {
          // ignore
        }
      }
    });

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          $(el).attr('href', new URL(href, currentHref).href);
        } catch {
          // ignore
        }
      }
    });

    // Inject base tag
    if ($('head').length > 0) {
      $('head').prepend(`<base href="${baseUrl}/">`);
    }

    const title = $('title').text() || parsedUrl.hostname;
    const description = $('meta[name="description"]').attr('content') || '';
    const favicon =
      $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') ||
      `${baseUrl}/favicon.ico`;

    const cleanHtml = $.html();

    res.json({
      success: true,
      url: currentHref,
      title: title.trim(),
      description: description.trim(),
      favicon,
      html: cleanHtml,
    });
  } catch (err: any) {
    console.error('Error fetching URL:', err);
    res.status(500).json({
      error: err.message || 'An error occurred while fetching the URL',
    });
  }
});

// Package Figma File (.fig archive containing canvas.fig and meta.json)
app.post('/api/package-fig', async (req, res) => {
  try {
    const { canvasFigBase64, name = 'Exported Design' } = req.body;

    if (!canvasFigBase64) {
      return res.status(400).json({ error: 'canvasFigBase64 is required' });
    }

    const canvasBuffer = Buffer.from(canvasFigBase64, 'base64');

    const zip = new JSZip();
    zip.file('canvas.fig', canvasBuffer);
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

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/x-figma');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.fig"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error packaging .fig:', err);
    res.status(500).json({ error: err.message || 'Failed to package .fig file' });
  }
});

// Proxy Image to bypass CORS when converting web images into Figma blobs
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('Image URL required');
    }
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).send(err.message || 'Image proxy failed');
  }
});

// Start server with Vite middleware in dev or static in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
