import express from 'express';
import prisma from '../config/dbConfig.js';
import { mockAuth } from '../middleware/verifyJWT.js';

const router = express.Router();

// GET all lobbies
router.get('/', async (req, res) => {
    try {
        const lobbies = await prisma.lobby.findMany({
            include: {
                creator: true,
                members: true,
            }
        });
        res.json(lobbies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lobbies' });
    }
});

// CREATE a new lobby
router.post('/', mockAuth, async (req, res) => {
    const userId = req.user.userId;
    const { name } = req.body;

    try {
        const newLobby = await prisma.lobby.create({
            data: {
                name,
                created_by: userId,
                invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                status: 'active'
            }
        });

        // Automatically add the creator as a member
        await prisma.lobbyMember.create({
            data: {
                lobby_id: newLobby.id,
                user_id: userId,
            }
        });

        res.status(201).json(newLobby);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lobby' });
    }
});

// GET a specific lobby
router.get('/:id', async (req, res) => {
    try {
        const lobby = await prisma.lobby.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                creator: true,
                members: { include: { user: true } },
                restaurant_options: { include: { restaurant: true, adder: true } },
                messages: { include: { user: true } },
                votes: { include: { user: true, restaurant: true } },
                chosen_restaurant: true,
            }
        });

        if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
        res.json(lobby);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lobby' });
    }
});

// UPDATE a lobby
router.patch('/:id', mockAuth, async (req, res) => {
    const { name, status, chosen_restaurant_id } = req.body;
    // In a real app, you'd want to verify the user is the creator or has permission
    try {
        const updatedLobby = await prisma.lobby.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                status,
                chosen_restaurant_id
            }
        });
        res.json(updatedLobby);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update lobby' });
    }
});

// DELETE a lobby
router.delete('/:id', mockAuth, async (req, res) => {
    // In a real app, you'd want to verify the user is the creator
    try {
        await prisma.lobby.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.status(204).send(); // No content
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete lobby' });
    }
});


// --- Lobby Members ---

// GET all members of a lobby
router.get('/:id/members', async (req, res) => {
    try {
        const members = await prisma.lobbyMember.findMany({
            where: { lobby_id: parseInt(req.params.id) },
            include: { user: true }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get lobby members' });
    }
});

// ADD a member to a lobby (Join a lobby)
router.post('/:id/members', mockAuth, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const userId = req.user.userId; // User joining is the authenticated user

    try {
        const newMember = await prisma.lobbyMember.create({
            data: {
                lobby_id: lobbyId,
                user_id: userId
            }
        });
        res.status(201).json(newMember);
    } catch (error) {
        // P2002 is the Prisma code for a unique constraint violation
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'User is already in this lobby.' });
        }
        res.status(400).json({ error: 'Failed to join lobby' });
    }
});


// REMOVE a member from a lobby (Leave a lobby)
router.delete('/:id/members/:userId', mockAuth, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const memberIdToRemove = parseInt(req.params.userId);

    // Security check: only allow users to remove themselves, or lobby creator to remove others
    // (This logic can be expanded)
    if (req.user.userId !== memberIdToRemove) {
        // You'd also need to check if the user is the lobby creator
        return res.status(403).json({ error: 'Forbidden: You can only remove yourself from a lobby.' });
    }

    try {
        await prisma.lobbyMember.delete({
            where: {
                lobby_id_user_id: { // Compound key from schema
                    lobby_id: lobbyId,
                    user_id: memberIdToRemove
                }
            }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Failed to remove member from lobby' });
    }
});


// --- Lobby Restaurants ---

// GET all restaurant options for a lobby
router.get('/:id/restaurants', async (req, res) => {
    try {
        const options = await prisma.lobbyRestaurantOption.findMany({
            where: { lobby_id: parseInt(req.params.id) },
            include: { restaurant: true, adder: true }
        });
        res.json(options);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get lobby restaurant options' });
    }
});

// ADD a restaurant option to a lobby
router.post('/:id/restaurants', mockAuth, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { restaurantId } = req.body; // The ID of the restaurant to add

    try {
        const newOption = await prisma.lobbyRestaurantOption.create({
            data: {
                lobby_id: lobbyId,
                restaurant_id: restaurantId,
                added_by: userId
            }
        });
        res.status(201).json(newOption);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This restaurant is already in the lobby.' });
        }
        res.status(400).json({ error: 'Failed to add restaurant to lobby' });
    }
});

// --- Lobby Votes ---

// GET all votes for a lobby
router.get('/:id/votes', async (req, res) => {
    try {
        const votes = await prisma.vote.findMany({
            where: { lobby_id: parseInt(req.params.id) },
            include: { user: true, restaurant: true }
        });
        res.json(votes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get lobby votes' });
    }
});


// CAST a vote in a lobby
// Note: This logic assumes one vote per user per lobby.
router.post('/:id/votes', mockAuth, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { restaurantId } = req.body;

    try {
        // Upsert: Create a vote if the user hasn't voted, or update their vote if they have.
        const vote = await prisma.vote.upsert({
            where: {
                lobby_id_user_id: { // Unique constraint
                    lobby_id: lobbyId,
                    user_id: userId,
                }
            },
            update: { restaurant_id: restaurantId },
            create: {
                lobby_id: lobbyId,
                user_id: userId,
                restaurant_id: restaurantId,
            }
        });
        res.status(201).json(vote);
    } catch (error) {
        res.status(400).json({ error: 'Failed to cast vote' });
    }
});


// --- Lobby Messages ---

// GET all messages for a lobby
router.get('/:id/messages', async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { lobby_id: parseInt(req.params.id) },
            include: { user: true },
            orderBy: { sent_at: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get lobby messages' });
    }
});

// POST a message to a lobby
router.post('/:id/messages', mockAuth, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { content, imageUrl } = req.body;

    try {
        const message = await prisma.message.create({
            data: {
                lobby_id: lobbyId,
                user_id: userId,
                content: content,
                image_url: imageUrl,
            }
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ error: 'Failed to send message' });
    }
});


export default router;