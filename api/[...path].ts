// Vercel serverless entrypoint.
//
// A catch-all ([...path]) rather than api/index.ts: Vercel maps api/index.ts to
// exactly `/api`, so /api/login, /api/fetch-url, … would never reach it.
//
// The app is loaded with a DYNAMIC import inside the handler, not a static one at
// the top of the file. With a static import, any failure to resolve or evaluate
// the module kills the function before a single line of our code runs, and Vercel
// answers with an opaque plain-text FUNCTION_INVOCATION_FAILED page that names no
// cause. Loading it lazily puts the failure inside a try/catch we control, so the
// real error comes back in the response body and lands in the Runtime Logs.

let appPromise: Promise<any> | undefined;

const loadApp = () => {
  if (!appPromise) {
    appPromise = import('./_app.js').then((mod: any) => mod?.default ?? mod?.app);
  }
  return appPromise;
};

export default async function handler(req: any, res: any) {
  try {
    const app = await loadApp();

    if (typeof app !== 'function') {
      throw new Error(`./_app.js did not export an Express app (got ${typeof app})`);
    }

    return app(req, res);
  } catch (err: any) {
    // A failed load is cached by the promise; clear it so the next request retries
    // rather than repeating a stale failure forever.
    appPromise = undefined;

    console.error('[api] request failed:', err);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify(
        {
          error: 'API function failed',
          name: err?.name,
          code: err?.code,
          message: err?.message,
          stack: String(err?.stack || '')
            .split('\n')
            .slice(0, 12),
        },
        null,
        2
      )
    );
  }
}
