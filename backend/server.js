import express from 'express';
import lobbyRoutes from './routes/lobbyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';

const app = express();

app.use(express.json());

// API Routes
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Food Finder API is running!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});