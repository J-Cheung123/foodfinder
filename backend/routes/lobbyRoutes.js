import express from 'express';
import prisma from '../config/dbConfig.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

export default router;