const express = require('express');
const prisma = require('./db'); // Import the instance from step 2

const app = express();
app.use(express.json());

// GET: Fetch all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a new user
app.post('/users', async (req, res) => {
  const { email, name } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: { email, name },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
