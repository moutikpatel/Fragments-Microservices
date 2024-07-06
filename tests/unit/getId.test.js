// tests/unit/get-id.test.js

const request = require('supertest');
const app = require('../../src/app');

const validPostReq = (url, type, data) => {
  return request(app)
    .post(`${url}`)
    .auth('user1@email.com', 'password1')
    .set('Content-Type', type)
    .send(data);
};

describe('GET /v1/fragments/:id.ext', () => {
  test('getExt will return the corresponding content type', async () => {
    const req = await validPostReq('/v1/fragments', 'text/plain', 'frag');

    const body = JSON.parse(req.text);
    const response = await request(app)
      .get(`/v1/fragments/${body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(response.status).toBe(200);
  });

  test('404 not found the id', async () => {
    const req = await validPostReq('/v1/fragments', 'text/plain', 'frag');
    const body = JSON.parse(req.text);
    const res = await request(app)
      .get(`/v1/fragments/${body.fragment.id}notid`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/fragments/:id', () => {
  test('if no extension specified raw data will be returned', async () => {
    const req = await validPostReq('/v1/fragments', 'text/plain', 'frag');
    const body = JSON.parse(req.text);
    const response = await request(app)
      .get(`/v1/fragments/${body.fragment.id}`)
      .auth('user1@email.com', 'password1');

    console.log(response.body);
    expect(response.status).toBe(200);
  });

  test('if invalid id is provided 404 will be returned', async () => {
    const response = await request(app)
      .get('/v1/fragments/404')
      .auth('user1@email.com', 'password1');
    expect(response.status).toBe(404);
  });

  test('if invalid extension is provided 415 will be returned', async () => {
    const req = await validPostReq('/v1/fragments', 'text/plain', 'frag');
    const body = JSON.parse(req.text);
    const response = await request(app)
      .get(`/v1/fragments/${body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(response.status).toBe(415);
  });
});
