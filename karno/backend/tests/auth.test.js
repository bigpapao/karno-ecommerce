import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/server.js';
import User from '../src/models/User.js';

describe('Authentication System', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/karno_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '09123456789',
    password: 'Test123!@#',
  };

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should not register with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'weak' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should lock account after multiple failed attempts', async () => {
      const attempts = 6; // MAX_LOGIN_ATTEMPTS + 1

      for (let i = 0; i < attempts; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(423); // Locked
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Email Verification', () => {
    let verificationToken;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      verificationToken = registerRes.body.user.verificationToken;
    });

    it('should verify email successfully', async () => {
      const res = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not verify with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email/invalid-token');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should send password reset email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reset password with valid token', async () => {
      // First request password reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      // Get reset token from database
      const user = await User.findOne({ email: testUser.email });
      const resetToken = user.resetPasswordToken;

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});
