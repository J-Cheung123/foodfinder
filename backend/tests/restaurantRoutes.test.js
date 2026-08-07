import request from 'supertest';
import express from 'express';
import restaurantRoutes from '../routes/restaurantRoutes.js';
import prisma from '../config/dbConfig.js';
import { 
    searchNearbyRestaurants, 
    getRestaurantDetails, 
    textSearchRestaurants 
} from '../services/googlePlacesService.js';

// 1. Mock the verifyJWT middleware
jest.mock('../middleware/verifyJWT.js', () => {
    return (req, res, next) => {
        req.user = { id: 1 }; // Fake user ID 1
        next();
    };
});

// 2. Mock dbConfig
jest.mock('../config/dbConfig.js', () => ({
    restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
    }
}));

// 3. Mock googlePlacesService
jest.mock('../services/googlePlacesService.js', () => ({
    searchNearbyRestaurants: jest.fn(),
    getRestaurantDetails: jest.fn(),
    textSearchRestaurants: jest.fn(),
}));

// 4. Express app setup
const app = express();
app.use(express.json());
app.use('/api/restaurants', restaurantRoutes);

describe('Restaurant Routes (Integration Tests with Supertest)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/restaurants', () => {
        it('should return cached restaurants', async () => {
            const mockRestaurants = [
                { id: 1, name: 'Burger Joint', api_place_id: 'place1' },
                { id: 2, name: 'Pizza Palace', api_place_id: 'place2' }
            ];
            prisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

            const response = await request(app).get('/api/restaurants');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockRestaurants);
            expect(prisma.restaurant.findMany).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            prisma.restaurant.findMany.mockRejectedValue(new Error('DB Error'));

            const response = await request(app).get('/api/restaurants');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Failed to fetch restaurants' });
        });
    });

    describe('GET /api/restaurants/:id', () => {
        it('should return a restaurant by ID if found', async () => {
            const mockRestaurant = { id: 1, name: 'Burger Joint', api_place_id: 'place1' };
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);

            const response = await request(app).get('/api/restaurants/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockRestaurant);
            expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should return 404 if restaurant not found in cache', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(null);

            const response = await request(app).get('/api/restaurants/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Restaurant not found in cache' });
        });
    });

    describe('GET /api/restaurants/search/nearby', () => {
        it('should search nearby restaurants using latitude and longitude', async () => {
            const mockResults = [{ name: 'Sushi Bar', api_place_id: 'sushi1' }];
            searchNearbyRestaurants.mockResolvedValue(mockResults);

            const response = await request(app)
                .get('/api/restaurants/search/nearby')
                .query({ latitude: '40.7128', longitude: '-74.0060', radius: '1500', keyword: 'sushi' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResults);
            expect(searchNearbyRestaurants).toHaveBeenCalledWith(40.7128, -74.0060, 1500, 'sushi');
        });

        it('should return 400 if latitude or longitude is missing', async () => {
            const response = await request(app)
                .get('/api/restaurants/search/nearby')
                .query({ latitude: '40.7128' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'latitude and longitude query parameters are required' });
        });
    });
});
