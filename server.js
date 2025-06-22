const express = require('express');
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests
require('dotenv').config(); // Load environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.OPENWEATHER_API_KEY; // API key stored in an .env file

// Middleware
app.use(cors());
app.use(express.json());

// Function to fetch current weather data
async function fetchWeatherData(city, units) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
  const response = await axios.get(url);
  return response.data;
}

// Weather route (includes clothing suggestions and forecast)
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  const units = req.query.units || 'metric'; // Accept units query parameter (metric or imperial)

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const currentWeatherData = await fetchWeatherData(city, units);

    // Get 4-day forecast (next 4 days, every 8th entry is a new day)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
    const forecastResponse = await axios.get(forecastUrl);
    const forecast = forecastResponse.data.list.filter((item, index) => index % 8 === 0).slice(0, 4);

    // Generate clothing suggestions based on temperature and weather condition
    let clothingSuggestions = [];
    const temp = currentWeatherData.main.temp;
    const condition = currentWeatherData.weather[0].main.toLowerCase();

    if (temp > 30) {
      clothingSuggestions = ['T-shirts', 'Shorts', 'Sunglasses', 'Hats'];
    } else if (temp > 20 && temp <= 30) {
      clothingSuggestions = ['Light jackets', 'Jeans', 'Cotton shirts'];
    } else if (temp > 10 && temp <= 20) {
      clothingSuggestions = ['Sweaters', 'Scarves', 'Closed shoes'];
    } else if (temp <= 10) {
      clothingSuggestions = ['Coats', 'Thermal wear', 'Gloves', 'Boots'];
    }

    if (condition.includes('rain')) {
      clothingSuggestions.push('Raincoat', 'Umbrella', 'Waterproof shoes');
    }

    // Send both current weather and forecast to the frontend
    res.json({
      currentWeather: {
        city: currentWeatherData.name,
        temperature: currentWeatherData.main.temp,
        description: currentWeatherData.weather[0].description,
        clothing: clothingSuggestions,
      },
      forecast: forecast.map(f => ({
        date: new Date(f.dt * 1000).toLocaleDateString(), // Convert timestamp to human-readable date
        temperature: {
          min: f.main.temp_min,
          max: f.main.temp_max,
        },
        description: f.weather[0].description,
      })),
    });
  } catch (error) {
    console.error('Error fetching weather data:', error.message || error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Unable to fetch weather data',
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Weather backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
