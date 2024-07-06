const app = require('../../src/app');
const request = require('supertest');

const validPostReq = (url, type, data) => {
  return request(app)
    .post(`${url}`)
    .auth('user1@email.com', 'password1')
    .set('Content-Type', type)
    .send(data);
};
describe('authenticated user deleting an existing fragment metadata', () => {
  test('should delete fragment and return 200', () => {
    return validPostReq('/v1/fragments', 'text/plain', 'frag').then((req) => {
      const body = JSON.parse(req.text);
      const fragmentId = body.fragment.id;
      return request(app)
        .delete(`/v1/fragments/${fragmentId}`)
        .auth('user1@email.com', 'password1')
        .expect(200);
    });
  });
});

describe('authenticated user deleting a non-existing fragment metadata', () => {
  test('should return 404', () => {
    return request(app)
      .delete('/v1/fragments/404-')
      .auth('user1@email.com', 'password1')
      .expect(404);
  });
});

describe('unauthenticated user deleting a fragment metadata', () => {
  test('should return 401', () => {
    return request(app).delete('/v1/fragments/404-').expect(401);
  });
});
