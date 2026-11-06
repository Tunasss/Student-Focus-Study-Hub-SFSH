// Contract tests for api/openapi.yaml (WBS 1.4):
//   - every route defined in the code is documented, and vice versa
//   - real responses (success and error) match the documented schemas
//   - every response uses the Rule 02 envelope
//   - Swagger UI is served publicly at /api-docs with a bearer "Authorize" scheme

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { createApp } = require('../src/app');
const { loadSpec } = require('../src/docs');
const { createFakePrisma } = require('./helpers');

const spec = loadSpec();
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(spec, 'openapi');

const SAMPLE = fs.readFileSync(path.join(__dirname, '../prisma/fixtures/sample-timetable.ics'));
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const pointer = (...parts) => parts.map((p) => String(p).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');

// Validates res against the schema documented for (method, route, res.status).
function assertMatchesSpec(res, method, route) {
  const operation = spec.paths[route]?.[method];
  assert.ok(operation, `${method.toUpperCase()} ${route} is not documented`);

  let response = operation.responses[res.status];
  let location = pointer('paths', route, method, 'responses', res.status);
  assert.ok(response, `${method.toUpperCase()} ${route} does not document status ${res.status}`);
  if (response.$ref) {
    location = response.$ref.slice(2);
    response = response.$ref.slice(2).split('/').reduce((node, key) => node[key], spec);
  }
  assert.ok(response.content?.['application/json'], `${route} ${res.status} has no JSON schema`);

  const validate = ajv.getSchema(`openapi#/${location}/content/application~1json/schema`);
  const valid = validate(res.body);
  assert.ok(valid, `${method.toUpperCase()} ${route} ${res.status}: ${ajv.errorsText(validate.errors)}\n${JSON.stringify(res.body)}`);
}

// Routes the code defines: app.use('/api/x', xRouter(...)) + router.<method>('/sub', ...).
function routesInCode() {
  const src = path.join(__dirname, '../src');
  const appJs = fs.readFileSync(path.join(src, 'app.js'), 'utf8');
  const routes = [...appJs.matchAll(/app\.(get|post|put|patch|delete)\('([^']+)'/g)].map((m) => `${m[1]} ${m[2]}`);

  for (const [, mount, factory] of appJs.matchAll(/app\.use\('([^']+)',\s*(\w+)Router\(/g)) {
    const file = path.join(src, 'routes', `${factory}.js`);
    if (!fs.existsSync(file)) continue; // e.g. docsRouter, not an API resource
    const routerJs = fs.readFileSync(file, 'utf8');
    for (const [, method, sub] of routerJs.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'/g)) {
      // Express params (:id) are written {id} in OpenAPI.
      routes.push(`${method} ${mount}${sub === '/' ? '' : sub.replace(/:(\w+)/g, '{$1}')}`);
    }
  }
  return routes.sort();
}

function routesInSpec() {
  return Object.entries(spec.paths)
    .flatMap(([route, item]) => HTTP_METHODS.filter((m) => item[m]).map((m) => `${m} ${route}`))
    .sort();
}

describe('openapi.yaml', () => {
  test('is OpenAPI 3 with a JWT bearer security scheme', () => {
    assert.match(spec.openapi, /^3\./);
    assert.deepEqual(spec.components.securitySchemes.bearerAuth, {
      ...spec.components.securitySchemes.bearerAuth,
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  test('documents exactly the routes the code defines', () => {
    assert.deepEqual(routesInSpec(), routesInCode());
  });

  test('every operation has a summary, a description and an error response', () => {
    for (const route of routesInSpec()) {
      const [method, p] = route.split(' ');
      const op = spec.paths[p][method];
      assert.ok(op.summary && op.description, `${route} needs summary + description`);
      const isPublic = Array.isArray(op.security) && op.security.length === 0;
      if (!isPublic) assert.ok(op.responses['401'], `${route} is protected but does not document 401`);
    }
  });

  test('all schemas compile', () => {
    for (const name of Object.keys(spec.components.schemas)) {
      assert.ok(ajv.getSchema(`openapi#/components/schemas/${name}`), name);
    }
  });
});

describe('responses match openapi.yaml (Rule 02 envelope)', () => {
  let app;
  let token;

  before(async () => {
    app = createApp({ prisma: createFakePrisma() });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@sfsh.dev', password: 'Password123!' });
    token = res.body.data.token;
  });

  const auth = (req) => req.set('Authorization', `Bearer ${token}`);

  test('GET /api/health', async () => {
    assertMatchesSpec(await request(app).get('/api/health'), 'get', '/api/health');
  });

  test('POST /api/auth/register', async () => {
    const post = (body) => request(app).post('/api/auth/register').send(body);
    assertMatchesSpec(await post({ email: 'b@sfsh.dev', password: 'Password123!' }), 'post', '/api/auth/register');
    assertMatchesSpec(await post({ email: 'b@sfsh.dev', password: 'Password123!' }), 'post', '/api/auth/register'); // 409
    assertMatchesSpec(await post({ email: 'bad', password: 'x' }), 'post', '/api/auth/register'); // 400
  });

  test('POST /api/auth/login', async () => {
    const post = (body) => request(app).post('/api/auth/login').send(body);
    assertMatchesSpec(await post({ email: 'a@sfsh.dev', password: 'Password123!' }), 'post', '/api/auth/login');
    assertMatchesSpec(await post({ email: 'a@sfsh.dev', password: 'nope-nope' }), 'post', '/api/auth/login'); // 401
    const badJson = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{oops');
    assert.equal(badJson.status, 400);
    assertMatchesSpec(badJson, 'post', '/api/auth/login');
  });

  test('GET /api/auth/me', async () => {
    assertMatchesSpec(await auth(request(app).get('/api/auth/me')), 'get', '/api/auth/me');
    assertMatchesSpec(await request(app).get('/api/auth/me'), 'get', '/api/auth/me'); // 401
  });

  test('POST /api/schedule/import', async () => {
    const upload = (buffer, name) => auth(request(app).post('/api/schedule/import')).attach('file', buffer, name);
    assertMatchesSpec(await upload(SAMPLE, 'hk1.ics'), 'post', '/api/schedule/import');
    assertMatchesSpec(await upload(SAMPLE, 'hk1.txt'), 'post', '/api/schedule/import'); // 400
    assertMatchesSpec(await request(app).post('/api/schedule/import'), 'post', '/api/schedule/import'); // 401
  });

  test('GET /api/schedule', async () => {
    const get = (qs) => auth(request(app).get(`/api/schedule?${qs}`));
    const week = await get('from=2026-11-09&to=2026-11-16');
    assert.ok(week.body.data.events.length > 0);
    assertMatchesSpec(week, 'get', '/api/schedule');
    assertMatchesSpec(await get('tz=Mars/Base'), 'get', '/api/schedule'); // 400
  });

  test('GET /api/courses', async () => {
    const res = await auth(request(app).get('/api/courses'));
    assert.ok(res.body.data.courses.length > 0);
    assertMatchesSpec(res, 'get', '/api/courses');
  });

  describe('tasks', () => {
    let courseId;
    let taskId;

    before(async () => {
      const courses = await auth(request(app).get('/api/courses'));
      courseId = courses.body.data.courses[0].id;
    });

    const body = (extra = {}) => ({ title: 'Lab 1', dueAt: '2026-11-20T23:59:00+07:00', courseId, ...extra });

    test('POST /api/tasks', async () => {
      const created = await auth(request(app).post('/api/tasks')).send(body());
      assert.equal(created.status, 201);
      assertMatchesSpec(created, 'post', '/api/tasks');
      taskId = created.body.data.task.id;

      assertMatchesSpec(await auth(request(app).post('/api/tasks')).send({ title: '' }), 'post', '/api/tasks'); // 400
      assertMatchesSpec(await auth(request(app).post('/api/tasks')).send(body({ courseId: 9999 })), 'post', '/api/tasks'); // 404
      assertMatchesSpec(await request(app).post('/api/tasks').send(body()), 'post', '/api/tasks'); // 401
    });

    test('GET /api/tasks', async () => {
      const list = await auth(request(app).get(`/api/tasks?course_id=${courseId}&status=TODO`));
      assert.ok(list.body.data.tasks.length > 0);
      assertMatchesSpec(list, 'get', '/api/tasks');
      assertMatchesSpec(await auth(request(app).get('/api/tasks?status=NOPE')), 'get', '/api/tasks'); // 400
      assertMatchesSpec(await request(app).get('/api/tasks'), 'get', '/api/tasks'); // 401
    });

    test('PATCH /api/tasks/{id}', async () => {
      const route = '/api/tasks/{id}';
      assertMatchesSpec(await auth(request(app).patch(`/api/tasks/${taskId}`)).send({ status: 'DONE' }), 'patch', route);
      assertMatchesSpec(await auth(request(app).patch(`/api/tasks/${taskId}`)).send({}), 'patch', route); // 400
      assertMatchesSpec(await auth(request(app).patch('/api/tasks/9999')).send({ status: 'DONE' }), 'patch', route); // 404
      assertMatchesSpec(await request(app).patch(`/api/tasks/${taskId}`).send({ status: 'DONE' }), 'patch', route); // 401
    });

    test('PUT /api/tasks/{id}', async () => {
      const route = '/api/tasks/{id}';
      assertMatchesSpec(await auth(request(app).put(`/api/tasks/${taskId}`)).send(body({ title: 'Lab 1b' })), 'put', route);
      assertMatchesSpec(await auth(request(app).put(`/api/tasks/${taskId}`)).send({ title: 'x' }), 'put', route); // 400
      assertMatchesSpec(await auth(request(app).put('/api/tasks/9999')).send(body()), 'put', route); // 404
      assertMatchesSpec(await request(app).put(`/api/tasks/${taskId}`).send(body()), 'put', route); // 401
    });

    test('DELETE /api/tasks/{id}', async () => {
      const route = '/api/tasks/{id}';
      assertMatchesSpec(await auth(request(app).delete('/api/tasks/abc')), 'delete', route); // 400
      assertMatchesSpec(await auth(request(app).delete('/api/tasks/9999')), 'delete', route); // 404
      assertMatchesSpec(await request(app).delete(`/api/tasks/${taskId}`), 'delete', route); // 401
      assertMatchesSpec(await auth(request(app).delete(`/api/tasks/${taskId}`)), 'delete', route);
    });
  });

  test('unknown routes return a NOT_FOUND error envelope', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
    assert.ok(ajv.validate({ $ref: 'openapi#/components/schemas/ErrorEnvelope' }, res.body), ajv.errorsText());
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});

describe('Swagger UI', () => {
  const app = createApp({ prisma: createFakePrisma() });

  test('is served publicly at /api-docs', async () => {
    const res = await request(app).get('/api-docs/').redirects(1);
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /html/);
    assert.match(res.text, /swagger-ui/i);
  });

  test('loads the spec with the bearer scheme and keeps the token across reloads', async () => {
    const res = await request(app).get('/api-docs/swagger-ui-init.js');
    assert.equal(res.status, 200);
    assert.match(res.text, /"bearerAuth"/);
    assert.match(res.text, /"persistAuthorization": true/);
  });

  test('serves the raw spec at /api-docs/openapi.yaml', async () => {
    const res = await request(app).get('/api-docs/openapi.yaml');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /yaml/);
    assert.match(res.text, /^openapi: 3\./);
  });
});
