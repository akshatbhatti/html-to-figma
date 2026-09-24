// Shared Express API used by BOTH the local dev server (server.ts) and the
// Vercel serverless function (api/[...path].ts). It deliberately contains no
// Vite import and never calls listen(), so it is safe to bundle into a function.
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';

const app = express();
const AUTH_COOKIE_NAME = 'html_to_figma_session';
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const APP_CREDENTIALS = {
  username: process.env.APP_USERNAME || 'admin',
  password: process.env.APP_PASSWORD || 'fdsft5t54rferfg6655vdfvgrty565433vcvvc',
};

// Sessions are stateless (an HMAC-signed cookie) rather than an in-process Map.
// On Vercel every request can land on a different function instance, and instances
// are recycled constantly — an in-memory session store means users get logged out
// at random. Signing the session into the cookie keeps auth working with no store.
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  // Fallback derived from the credentials so tokens stay valid across instances
  // even if SESSION_SECRET is unset. Set SESSION_SECRET explicitly in production.
  `${APP_CREDENTIALS.username}:${APP_CREDENTIALS.password}`;

interface AuthSession {
  username: string;
  expiresAt: number;
}

const signPayload = (payload: string) =>
  crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

const readSession = (token?: string): AuthSession | null => {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = Buffer.from(signPayload(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof session?.username !== 'string' || typeof session?.expiresAt !== 'number') {
      return null;
    }
    if (session.expiresAt <= Date.now()) return null;
    return session as AuthSession;
  } catch {
    return null;
  }
};

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((segment) => {
    const [name, ...rest] = segment.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });

  return cookies;
};

const createSessionToken = (username: string) => {
  const payload = Buffer.from(
    JSON.stringify({ username, expiresAt: Date.now() + AUTH_SESSION_TTL_MS })
  ).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
};

// Secure cookies require HTTPS. Vercel is always HTTPS; plain `npm run dev` is not.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = parseCookies(req.headers.cookie)[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = readSession(token);
  if (!session) {
    res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  next();
};

app.use(cors());

// Some serverless runtimes parse the JSON body before Express sees it, which also
// drains the request stream. Flagging it as already-parsed stops body-parser from
// reading a spent stream and replacing a good body with {}.
app.use((req, _res, next) => {
  if (req.body !== undefined) {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/session', (req, res) => {
  const token = parseCookies(req.headers.cookie)[AUTH_COOKIE_NAME];
  if (!token) {
    return res.json({ authenticated: false });
  }

  const session = readSession(token);
  if (!session) {
    res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true, username: session.username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== APP_CREDENTIALS.username || password !== APP_CREDENTIALS.password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.cookie(AUTH_COOKIE_NAME, createSessionToken(username), {
    ...cookieOptions,
    maxAge: AUTH_SESSION_TTL_MS,
  });

  return res.json({ success: true, username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  return res.json({ success: true });
});

app.use((req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/logout' || req.path === '/api/session' || req.path === '/api/health') {
    return next();
  }

  if (req.path.startsWith('/api')) {
    return requireAuth(req, res, next);
  }

  return next();
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

export default app;
export { app };
