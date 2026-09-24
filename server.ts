// Local server: serves the same API as production (server/app.ts) plus the
// frontend — through Vite middleware in dev, or the built dist/ in production.
// On Vercel this file is not used at all; api/[...path].ts is the entrypoint.
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './server/app';

const PORT = Number(process.env.PORT || 3000);

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
