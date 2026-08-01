import express from 'express';
import prisma from '../config/dbConfig.js';

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

// ADD a new restaurant to the database cache
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
