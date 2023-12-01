// src/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Redis = require('ioredis');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Redis connection
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.json());

// Routes
const itemRoutes = require('./routes/itemRoutes');

// Middleware to cache data using Redis
app.use('/items', async (req, res, next) => {
    console.log("hiiiii");
  const cacheKey = req.originalUrl;
  const cachedData = await redisClient.get(cacheKey);

  console.log("cacheKey:-", cacheKey)
  console.log("cachedData:-", cachedData)


  if (cachedData) {
    res.status(200).json(JSON.parse(cachedData));
  } else {
    res.sendResponse = res.json;
    res.json = (body) => {
      redisClient.setex(cacheKey, 3600, JSON.stringify(body)); // Cache for 1 hour
      res.sendResponse(body);
    };
    next();
  }
});

app.use('/items', itemRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
