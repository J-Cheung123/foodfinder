import prisma from '../config/dbConfig.js'; //[cite: 3]
import {
    searchNearbyRestaurants,
    getRestaurantDetails,
    textSearchRestaurants
} from '../services/googlePlacesService.js'; //[cite: 3]

/**
 * UTILITY: Background auto-caching function.
 * Silently caches search results without making the user wait for DB writes.
 */
const cacheRestaurantsBackground = async (restaurants) => { //[cite: 3]
    if (!restaurants || restaurants.length === 0) return; //[cite: 3]
    try {
        await prisma.$transaction( //[cite: 3]
            restaurants.map(r => prisma.restaurant.upsert({ //[cite: 3]
                where: { api_place_id: r.api_place_id }, //[cite: 3]
                update: { cached_at: new Date() }, // Bump cache time if it exists[cite: 3]
                create: {
                    api_place_id: r.api_place_id, //[cite: 3]
                    name: r.name, //[cite: 3]
                    address: r.address, //[cite: 3]
                    latitude: r.latitude ? parseFloat(r.latitude) : null, //[cite: 3]
                    longitude: r.longitude ? parseFloat(r.longitude) : null, //[cite: 3]
                    rating: r.rating ? parseFloat(r.rating) : null, //[cite: 3]
                    price_level: r.price_level, //[cite: 3]
                    photo_url: r.photo_url //[cite: 3]
                }
            }))
        );
    } catch (error) {
        console.error('Background caching failed:', error); //[cite: 3]
    }
};

// --- SEARCH ENDPOINTS ---

export const searchNearby = async (req, res) => { //[cite: 3]
    try {
        const { latitude, longitude, radius = 1500, keyword = 'restaurant' } = req.query; //[cite: 3]
        if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude are required' }); //[cite: 3]

        const results = await searchNearbyRestaurants(parseFloat(latitude), parseFloat(longitude), parseInt(radius), keyword); //[cite: 3]

        cacheRestaurantsBackground(results); // Fire and forget[cite: 3]
        res.json(results); //[cite: 3]
    } catch (error) {
        res.status(500).json({ error: 'Failed to search nearby restaurants' }); //[cite: 3]
    }
};

export const searchText = async (req, res) => { //[cite: 3]
    try {
        const { query, latitude, longitude } = req.query; //[cite: 3]
        if (!query) return res.status(400).json({ error: 'query parameter is required' }); //[cite: 3]

        const results = await textSearchRestaurants( //[cite: 3]
            query, //[cite: 3]
            latitude ? parseFloat(latitude) : null, //[cite: 3]
            longitude ? parseFloat(longitude) : null //[cite: 3]
        );

        cacheRestaurantsBackground(results); // Fire and forget[cite: 3]
        res.json(results); //[cite: 3]
    } catch (error) {
        res.status(500).json({ error: 'Failed to search restaurants' }); //[cite: 3]
    }
};

// --- PRIVATE/USER ENDPOINTS ---

export const getSavedRestaurants = async (req, res) => { //[cite: 3]
    try {
        const userId = req.user.id; // Assumes verifyJWT attaches the user object to req[cite: 3]

        // Fetch the user's saved relations, including the cached restaurant data
        const savedList = await prisma.savedRestaurant.findMany({ //[cite: 3]
            where: { user_id: userId }, //[cite: 3]
            include: { restaurant: true }, //[cite: 3]
            orderBy: { saved_at: 'desc' } //[cite: 3]
        });

        // Optimization: Strip away the junction table metadata and just return a clean list of restaurants
        const cleanList = savedList.map(item => ({ //[cite: 3]
            saved_at: item.saved_at, //[cite: 3]
            ...item.restaurant //[cite: 3]
        }));

        res.json(cleanList); //[cite: 3]
    } catch (error) {
        console.error('Error fetching saved restaurants:', error); //[cite: 3]
        res.status(500).json({ error: 'Failed to fetch saved restaurants' }); //[cite: 3]
    }
};

export const saveRestaurant = async (req, res) => { //[cite: 3]
    const { api_place_id, name, address, latitude, longitude, rating, price_level, photo_url } = req.body; //[cite: 3]
    const userId = req.user.id; //[cite: 3]

    if (!api_place_id || !name) return res.status(400).json({ error: 'api_place_id and name are required' }); //[cite: 3]

    try {
        // 1. Ensure the restaurant is in the main cache (just in case it dropped out)
        const restaurant = await prisma.restaurant.upsert({ //[cite: 3]
            where: { api_place_id }, //[cite: 3]
            update: { cached_at: new Date() }, //[cite: 3]
            create: {
                api_place_id, name, address, //[cite: 3]
                latitude: latitude ? parseFloat(latitude) : null, //[cite: 3]
                longitude: longitude ? parseFloat(longitude) : null, //[cite: 3]
                rating: rating ? parseFloat(rating) : null, //[cite: 3]
                price_level, photo_url //[cite: 3]
            }
        });

        // 2. Link it to the user's saved list
        await prisma.savedRestaurant.create({ //[cite: 3]
            data: {
                user_id: userId, //[cite: 3]
                restaurant_id: restaurant.id //[cite: 3]
            }
        });

        res.status(201).json({ message: 'Saved successfully', restaurant }); //[cite: 3]
    } catch (error) {
        // P2002 is Prisma's error code for a Unique Constraint Violation
        if (error.code === 'P2002') { //[cite: 3]
            return res.status(400).json({ error: 'Restaurant is already in your saved list' }); //[cite: 3]
        }
        console.error(error); //[cite: 3]
        res.status(500).json({ error: 'Failed to save restaurant' }); //[cite: 3]
    }
};

export const unsaveRestaurant = async (req, res) => { //[cite: 3]
    try {
        const userId = req.user.id; //[cite: 3]
        const restaurantId = parseInt(req.params.restaurantId); //[cite: 3]

        if (isNaN(restaurantId)) { //[cite: 3]
            return res.status(400).json({ error: 'Invalid restaurant ID' }); //[cite: 3]
        }

        // Deletes ONLY the relationship, leaving the cached restaurant intact
        await prisma.savedRestaurant.delete({ //[cite: 3]
            where: {
                user_id_restaurant_id: { //[cite: 3]
                    user_id: userId, //[cite: 3]
                    restaurant_id: restaurantId //[cite: 3]
                }
            }
        });

        res.status(204).send(); // 204 No Content (Success)[cite: 3]
    } catch (error) {
        console.error('Error unsaving restaurant:', error); //[cite: 3]
        res.status(400).json({ error: 'Failed to remove restaurant from saved list' }); //[cite: 3]
    }
};

// --- CACHE MANAGEMENT ENDPOINTS ---

export const getDetails = async (req, res) => { //[cite: 3]
    try {
        const { placeId } = req.params; //[cite: 3]
        const details = await getRestaurantDetails(placeId); //[cite: 3]

        const cached = await prisma.restaurant.upsert({ //[cite: 3]
            where: { api_place_id: details.api_place_id }, //[cite: 3]
            update: { ...details, cached_at: new Date() }, //[cite: 3]
            create: details //[cite: 3]
        });

        res.json(cached); //[cite: 3]
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant details' }); //[cite: 3]
    }
};

export const getAllRestaurants = async (req, res) => { //[cite: 3]
    try {
        const restaurants = await prisma.restaurant.findMany({ //[cite: 3]
            orderBy: { cached_at: 'desc' }, //[cite: 3]
            take: 50 // Optimization: Prevent massive payload by limiting global cache fetch[cite: 3]
        });
        res.json(restaurants); //[cite: 3]
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurants' }); //[cite: 3]
    }
};

export const getRestaurantById = async (req, res) => { //[cite: 3]
    try {
        const restaurant = await prisma.restaurant.findUnique({ //[cite: 3]
            where: { id: parseInt(req.params.id) } //[cite: 3]
        });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' }); //[cite: 3]
        res.json(restaurant); //[cite: 3]
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant' }); //[cite: 3]
    }
};