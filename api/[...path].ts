// Vercel serverless entrypoint.
//
// A catch-all route ([...path]) rather than api/index.ts, because Vercel maps
// api/index.ts to exactly `/api` — every real route (/api/login, /api/fetch-url,
// …) would 404. The catch-all receives them all with the original URL intact,
// so the Express router matches its paths unchanged.
import app from '../server/app';

export default app;

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
