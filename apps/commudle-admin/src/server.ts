import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { RESPONSE_INIT } from '@angular/core';
import { CommonEngine } from '@angular/ssr/node';
import compression from 'compression';
import * as express from 'express';
import * as expressStaticGzip from 'express-static-gzip';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import AppServerModule from './main.server';
import { shouldServeSsr } from './ssr-bot-detection';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();

  // Serve CSR for normal users, SSR only for bots/crawlers.
  // Bot detection is implemented locally (vendored UA list), so this server
  // does not depend on the prerender-node middleware.

  // Resolve browser output folder for both:
  // 1) local Nx workspace execution (cwd is repo root)
  // 2) Elastic Beanstalk unzip (cwd is the deployed bundle root)
  const distFolderCandidates = [
    join(process.cwd(), 'dist/apps/commudle-admin/browser'),
    join(process.cwd(), 'commudle-admin/browser'),
    // When running the compiled server bundle directly, resolve relative to the bundle directory.
    join(dirname(__filename), '../browser'),
  ];

  const distFolder = distFolderCandidates.find((p) => existsSync(join(p, 'index.html')));
  if (!distFolder) {
    throw new Error(`Could not find commudle-admin browser output. Tried: ${distFolderCandidates.join(', ')}`);
  }

  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? join(distFolder, 'index.original.html')
    : join(distFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Compress dynamic responses (SSR HTML). Static assets are handled separately below.
  server.use(compression());

  // Health check endpoint for load balancers/EB.
  server.get('/health', (_req, res) => {
    res.status(200).send('ok');
  });

  // Backward-compatible health check route (used by legacy/prerender deployment).
  server.get('/health-check', (_req, res) => {
    res.status(200).send({ health: 'good' });
  });

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', expressStaticGzip(distFolder, { enableBrotli: true, serveStatic: { maxAge: '1y' } }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    // Ensure caches don't mix bot SSR HTML with user CSR HTML.
    res.setHeader('Vary', 'User-Agent');

    // Non-bots get the client-rendered app (fast + avoids SSR cost).
    // Bots/crawlers (and special prerender signals like `_escaped_fragment_`) get SSR.
    const shouldSsr = shouldServeSsr(req);
    if (!shouldSsr) {
      return res.sendFile('index.html', { root: distFolder });
    }

    const { protocol, originalUrl, baseUrl, headers } = req;

    // Mutable object shared with the Angular app via DI.
    // Components (e.g. Error404PageComponent) can set .status during ngOnInit
    // so that the correct HTTP status is returned to the crawler.
    const responseInit: ResponseInit = {};

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: distFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: RESPONSE_INIT, useValue: responseInit },
        ],
      })
      .then((html) => res.status(responseInit.status ?? 200).send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  // Elastic Beanstalk sets PORT (commonly 8080). Keep 8080 as a safe default.
  const port = Number(process.env['PORT'] || 8080);

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default AppServerModule;
