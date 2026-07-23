const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  /* Destructure the name, email, and password from the request body */
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required" });
  }

  try {
    /* Check if a user with the provided email already exists in the database */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    /* Hash the password using bcrypt with a salt round of 12 for security */
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ username, email, passwordHash: hashedPassword });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" }); // return added
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    /* Compare the provided password with the stored hashed password using bcrypt */
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    /* Generate a JWT token with the user's ID and role, signed with a secret key and set to expire in 7 days */
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,

      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
