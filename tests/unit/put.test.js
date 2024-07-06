const request = require('supertest');
const app = require('../../src/app');

const postFragment = (contentType, data) => {
  return request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', contentType)
    .send(data)
    .expect(201);
};

const putFragment = (id, contentType, data) => {
  return request(app)
    .put(`/v1/fragments/${id}`)
    .auth('user1@email.com', 'password1')
    .set('Content-Type', contentType)
    .send(data)
    .expect(200);
};

// for bad requests
const failingPutFragment = (id, contentType, data) => {
  return request(app)
    .put(`/v1/fragments/${id}`)
    .auth('user1@email.com', 'password1')
    .set('Content-Type', contentType)
    .send(data)
    .expect(400);
};

describe('PUT /v1/fragments/:id', () => {
  test('attempt to update a fragment with a different content type than the original will fail with 400', () => {
    return postFragment('text/plain', 'fragment data').then((req) => {
      const body = JSON.parse(req.text);
      const id = body.fragment.id;

      return failingPutFragment(id, 'application/json', 'updated fragment data');
    });
  });

  test('authenticated user can update a fragment with the same content type', () => {
    return postFragment('text/plain', 'fragment data').then((req) => {
      const body = JSON.parse(req.text);
      const id = body.fragment.id;

      return putFragment(id, 'text/plain', 'updated fragment data');
    });
  });

  test('attempt to update a fragment with an invalid id will fail with 404', () => {
    return request(app)
      .put('/v1/fragments/invalid-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated fragment data')
      .expect(404);
  });
});
