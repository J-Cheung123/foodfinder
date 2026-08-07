import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import * as restaurantController from '../controllers/restaurantController.js';

const router = express.Router();

// --- PUBLIC CACHE ROUTES ---
router.get('/', restaurantController.getAllRestaurants);

// --- PUBLIC SEARCH ROUTES (Auto-caches results) ---
router.get('/search/nearby', restaurantController.searchNearby);
router.get('/search/text', restaurantController.searchText);

// --- PRIVATE USER ROUTES ---
// GET DETAILS: Fetch detailed info for a restaurant and cache it
router.get('/details/:placeId', verifyJWT, restaurantController.getDetails);
// GET SAVED: Fetch the logged-in user's saved restaurants
router.get('/saved', verifyJWT, restaurantController.getSavedRestaurants);
// POST SAVE: Add a restaurant to the logged-in user's saved list
router.post('/save', verifyJWT, restaurantController.saveRestaurant);
// DELETE SAVED: Remove a restaurant from the logged-in user's saved list
router.delete('/saved/:restaurantId', verifyJWT, restaurantController.unsaveRestaurant);

// --- DYNAMIC ROUTES (Must stay at the bottom) ---
router.get('/:id', restaurantController.getRestaurantById);

export default router;