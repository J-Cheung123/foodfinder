import express from 'express';
import prisma from '../config/dbConfig.js';
import { 
    searchNearbyRestaurants, 
    getRestaurantDetails, 
    textSearchRestaurants 
} from '../services/googlePlacesService.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

// GET all restaurants from the database cache
router.get('/', async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            orderBy: {
                cached_at: 'desc'
            }
        });
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
});

// GET a specific restaurant from the database cache
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(req.params.id) },
        });

        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found in cache' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
});

/**
 * SEARCH: Find restaurants nearby a location
 * GET /api/restaurants/search/nearby?latitude=40.7128&longitude=-74.0060&radius=1500&keyword=sushi
 */
router.get('/search/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 1500, keyword = 'restaurant' } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'latitude and longitude query parameters are required' 
            });
        }

        const results = await searchNearbyRestaurants(
            parseFloat(latitude),
            parseFloat(longitude),
            parseInt(radius),
            keyword
        );

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search nearby restaurants' });
    }
});

/**
 * SEARCH: Text-based restaurant search
 * GET /api/restaurants/search/text?query=sushi+in+NYC&latitude=40.7128&longitude=-74.0060
 */
router.get('/search/text', async (req, res) => {
    try {
        const { query, latitude, longitude } = req.query;

        if (!query) {
            return res.status(400).json({ 
                error: 'query parameter is required' 
            });
        }

        const results = await textSearchRestaurants(
            query,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null
        );

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search restaurants' });
    }
});

/**
 * GET DETAILS: Fetch detailed info for a restaurant and cache it
 * GET /api/restaurants/details/:placeId
 */
router.get('/details/:placeId', verifyJWT, async (req, res) => {
    try {
        const { placeId } = req.params;

        // Get details from Google Places API
        const details = await getRestaurantDetails(placeId);

        // Cache in database for future use
        const cached = await prisma.restaurant.upsert({
            where: { api_place_id: details.api_place_id },
            update: {
                ...details,
                cached_at: new Date()
            },
            create: details
        });

        res.json(cached);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch restaurant details' });
    }
});

/**
 * SAVE: Add restaurant from search results to database
 * POST /api/restaurants/save
 * Body: { api_place_id, name, address, latitude, longitude, rating, price_level, photo_url }
 */
router.post('/save', verifyJWT, async (req, res) => {
    const { api_place_id, name, address, latitude, longitude, rating, price_level, photo_url } = req.body;

    if (!api_place_id || !name) {
        return res.status(400).json({ error: 'api_place_id and name are required' });
    }

    try {
        const restaurant = await prisma.restaurant.upsert({
            where: { api_place_id },
            update: { cached_at: new Date() },
            create: {
                api_place_id,
                name,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                rating: rating ? parseFloat(rating) : null,
                price_level,
                photo_url
            }
        });

        res.status(201).json(restaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save restaurant' });
    }
});

// ADD a new restaurant to the database cache (legacy endpoint)
// This would typically be called after you fetch data from a service like Google Places
// and want to cache it in your own DB.
router.post('/', async (req, res) => {
    const {
        api_place_id,
        name,
        address,
        latitude,
        longitude,
        rating,
        price_level,
        photo_url
    } = req.body;

    if (!api_place_id || !name) {
        return res.status(400).json({ error: 'api_place_id and name are required' });
    }

    try {
        // Use upsert to avoid creating duplicates based on the unique api_place_id
        // It will update the record if it exists, or create it if it doesn't.
        const newRestaurant = await prisma.restaurant.upsert({
            where: { api_place_id: api_place_id },
            update: {
                name,
                address,
                latitude,
                longitude,
                rating,
                price_level,
                photo_url,
                cached_at: new Date() // Update the cache time
            },
            create: {
                api_place_id,
                name,
                address,
                latitude,
                longitude,
                rating,
                price_level,
                photo_url
            }
        });
        res.status(201).json(newRestaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cache restaurant' });
    }
});

// DELETE a restaurant from the cache
router.delete('/:id', async (req, res) => {
    try {
        await prisma.restaurant.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.status(204).send(); // No content
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete restaurant from cache' });
    }
});

export default router;
