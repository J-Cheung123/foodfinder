import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import lobbyRoutes from './routes/lobbyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCorsOrigin = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL; // e.g., 'https://my-live-website.com'
  }
  return 'http://localhost:3000';
};

app.use(cors({
  origin: getCorsOrigin(),
  credentials: true // Crucial for your JWT cookies to work
}));

app.use(cors({
  origin: getCorsOrigin(),
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);

app.get('/', (req, res) => {
  res.send('Food Finder API is running!');
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
