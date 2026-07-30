import express from 'express';
import prisma from '../config/dbConfig.js';
import { mockAuth } from '../middleware/auth.js';

const router = express.Router();

// ============================
// 1. GET ALL USERS 
// GET /api/users
// ============================
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, profile_image_url: true, created_at: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ============================
// 2. CREATE A USER (Registration)
// POST /api/users
// ============================
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = await prisma.user.create({
            data: { username, email, password_hash: password }
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user (Username or Email might be taken)' });
    }
});

// ============================
// 3. GET LOGGED-IN USER'S LOBBIES
// GET /api/users/me/lobbies
// (Added based on your schema: Users need to see what groups they are in!)
// ============================
router.get('/me/lobbies', mockAuth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const memberships = await prisma.lobbyMember.findMany({
            where: { user_id: userId },
            include: { lobby: true } // Fetch the actual lobby details
        });
        res.json(memberships.map(m => m.lobby));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user lobbies' });
    }
});

// ============================
// 4. ADD TO SAVED RESTAURANTS
// POST /api/users/me/saved
// ============================
router.post('/me/saved', mockAuth, async (req, res) => {
    const userId = req.user.userId;
    const { restaurantId } = req.body;
    try {
        const saved = await prisma.savedRestaurant.create({
            data: { user_id: userId, restaurant_id: restaurantId }
        });
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ error: 'Failed to save restaurant' });
    }
});

// ============================
// 5. REMOVE FROM SAVED RESTAURANTS
// DELETE /api/users/me/saved/:restaurantId
// ============================
router.delete('/me/saved/:restaurantId', mockAuth, async (req, res) => {
    const userId = req.user.userId;
    const restaurantId = parseInt(req.params.restaurantId);
    try {
        await prisma.savedRestaurant.delete({
            where: { user_id_restaurant_id: { user_id: userId, restaurant_id: restaurantId } }
        });
        res.json({ message: 'Restaurant removed from saved list' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to remove restaurant' });
    }
});

// ============================
// 6. UPDATE PROFILE (e.g., set profile image)
// PATCH /api/users/me
// (Added based on your schema's profile_image_url field)
// ============================
router.patch('/me', mockAuth, async (req, res) => {
    const userId = req.user.userId;
    const { username, profile_image_url } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { username, profile_image_url },
            select: { id: true, username: true, profile_image_url: true } // Don't return password hash
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update profile' });
    }
});

// ============================
// 7. GET SPECIFIC USER PROFILE
// GET /api/users/:id 
// (Must stay at the bottom so it doesn't intercept "/me")
// ============================
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { id: true, username: true, profile_image_url: true, created_at: true },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching user' });
    }
});

export default router;