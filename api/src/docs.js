// Public API docs (WBS 1.4): Swagger UI at /api-docs, raw spec at /api-docs/openapi.yaml.
// The spec lives in api/openapi.yaml and is the single source of truth.

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const SPEC_PATH = path.join(__dirname, '..', 'openapi.yaml');

function loadSpec() {
  return YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
}

function docsRouter() {
  const specText = fs.readFileSync(SPEC_PATH, 'utf8');
  const router = express.Router();

  router.get('/openapi.yaml', (req, res) => {
    res.type('application/yaml').send(specText);
  });

  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(YAML.parse(specText), {
      customSiteTitle: 'SFSH API Docs',
      // Keep the JWT entered via "Authorize" across page reloads.
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  return router;
}

module.exports = { docsRouter, loadSpec, SPEC_PATH };
