// Vercel serverless entrypoint.
//
// Two deliberate choices here, both of which cause FUNCTION_INVOCATION_FAILED on
// every route if you get them wrong:
//
// 1. A catch-all ([...path]) rather than api/index.ts. Vercel maps api/index.ts to
//    exactly `/api`, so /api/login, /api/fetch-url, … would never reach it.
// 2. The `.js` extension on a sibling module. package.json declares
//    "type": "module", so Node resolves this function as strict ESM, where an
//    extensionless import is a hard runtime error. TypeScript and esbuild both map
//    a `.js` specifier back to the `.ts` source, so this is correct at build time
//    and at runtime. The app also lives beside this file (api/_app.ts, underscore
//    = not routed) so it is always inside the function's compile scope.
import app from './_app.js';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    // Surfaces in Vercel's Runtime Logs instead of an opaque 500.
    console.error('API handler threw:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', detail: err?.message }));
  }
}

export const config = {
  api: {
    // Let Express own body parsing. If Vercel's runtime parses (and drains) the
    // request stream first, express.json() reads an already-ended stream and the
    // 50mb .fig / HTML payloads arrive empty.
    bodyParser: false,
    // Exported .fig archives and proxied pages exceed the default response cap.
    responseLimit: false,
  },
};
