const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/weather-db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Favorite model
const favoriteSchema = new mongoose.Schema({ city: String });
const Favorite = mongoose.model('Favorite', favoriteSchema);

// Save a city to favorites
app.post('/favorites', async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const favorite = new Favorite({ city });
    await favorite.save();
    res.status(201).json({ message: 'City added to favorites' });
  } catch (error) {
    console.error('Error saving favorite:', error);
    res.status(500).json({ error: 'Error saving favorite' });
  }
});

// Fetch all favorites
app.get('/favorites', async (req, res) => {
  try {
    const favorites = await Favorite.find();
    res.json(favorites.map(fav => fav.city));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Error fetching favorites' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});