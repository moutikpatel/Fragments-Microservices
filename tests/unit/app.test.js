const request = require('supertest');

const app = require('../../src/app');

describe('Error handling middleware', () => {
  test('Error 500 -- internal server error', async () => {
    const mockedMiddleware = jest.fn(() => {
      throw new Error('Internal server error');
    });
    app.use(mockedMiddleware);
    const res = await request(app).get('/boba-fett');
    expect(res.statusCode).toBe(404);
  });
});
