const app = require('../../src/app');
const request = require('supertest');

const validPostReq = (url, type, data) => {
  return request(app)
    .post(`${url}`)
    .auth('user1@email.com', 'password1')
    .set('Content-Type', type)
    .send(data);
};

describe('GET /v1/fragments/:id/info', () => {
  test('if fragment info will be returned', async () => {
    const req = await validPostReq('/v1/fragments', 'text/plain', 'frag');
    const body = JSON.parse(req.text);
    const fragmentId = body.fragment.id;
    const response = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1')
      .expect(200);
    expect(response.body.fragment).toBeDefined();
  });

  test('will display 404 if invalid id provided', async () => {
    await request(app)
      .get('/v1/fragments/404-/info')
      .auth('user1@email.com', 'password1')
      .expect(404);
  });
});
