import express from "express";
import prisma from "./db.js";

const app = express();
app.use(express.json());

// Health check - confirms the server and database are both up
app.get("/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: "ok", users: userCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a new user
app.post("/users", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password_hash = req.body.password_hash;

  try {
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password_hash: password_hash,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
