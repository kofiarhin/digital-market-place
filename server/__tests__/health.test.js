process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

const request = require('supertest');
const createApp = require('../app');

const app = createApp();

describe('GET /api/health', () => {
  it('responds with service health information', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.environment).toBeDefined();
  });
});
