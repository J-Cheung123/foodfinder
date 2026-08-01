import request from 'supertest';
import express from 'express';
import userRoutes from '..routes/userRoutes.js';
import prisma from '../config/dbConfig.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. Mock your middleware FIRST
// (This won't break the login route because login doesn't use verifyJWT)
jest.mock('../middleware/verifyJWT.js', () => {
    return (req, res, next) => {
        req.user = { id: 1 }; // Fake the decoded JWT payload
        next();
    };
});

// 2. Combine all your Prisma mocks into ONE object
jest.mock('../config/dbConfig.js', () => ({
    user: { findFirst: jest.fn() },
    savedRestaurant: { findMany: jest.fn() }
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// 3. Spin up the Express app ONLY ONCE
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes (Integration Tests with Supertest)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
    });

    // ==========================================
    // PUBLIC ROUTES
    // ==========================================
    describe('POST /api/users/login', () => {
        it('should return 401 on invalid credentials', async () => {
            prisma.user.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/users/login')
                .send({ email: 'wrong@test.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid credentials.' });
        });

        it('should successfully log in and set an HttpOnly cookie', async () => {
            const mockUser = { id: 1, email: 'test@test.com', username: 'testuser', password_hash: 'hashedPassword123' };

            prisma.user.findFirst.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mockJwtToken');

            const response = await request(app)
                .post('/api/users/login')
                .send({ email: 'test@test.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.headers['set-cookie'][0]).toMatch(/token=mockJwtToken/);
        });
    });

    // ==========================================
    // PRIVATE ROUTES (Protected by verifyJWT)
    // ==========================================
    describe('GET /api/users/profile/saved-restaurants', () => {
        it('should fetch saved restaurants for the logged-in user', async () => {

            // Setup fake data for Prisma to return
            const fakeSavedRestaurants = [{ id: 1, restaurant_id: 5, user_id: 1 }];
            prisma.savedRestaurant.findMany.mockResolvedValue(fakeSavedRestaurants);

            // Fire the request! Supertest will pass the mocked middleware.
            const response = await request(app).get('/api/users/profile/saved-restaurants');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(fakeSavedRestaurants);
        });
    });
});