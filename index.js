const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Use the API key from the .env file
const apiKey = process.env.API_KEY; // This will load the key from your .env file

// Function to determine clothing suggestion based on temperature
function getClothingSuggestion(temperature) {
  if (temperature >= 30) {
    return 'Wear light clothes like t-shirts and shorts.';
  } else if (temperature >= 20) {
    return 'Wear comfortable clothes, maybe a light jacket.';
  } else if (temperature >= 10) {
    return 'Wear a jacket or sweater.';
  } else {
    return 'It\'s quite cold! Wear a heavy jacket or coat.';
  }
}

// Function to get Spotify playlist URL based on weather conditions
function getPlaylistUrl(condition) {
  if (condition.includes('clear') || condition.includes('sunny')) {
    return 'https://open.spotify.com/playlist/xyz-sunny-vibes'; // Replace with a real sunny weather playlist
  } else if (condition.includes('rain')) {
    return 'https://open.spotify.com/playlist/xyz-rainy-day'; // Replace with a real rainy day playlist
  } else if (condition.includes('clouds')) {
    return 'https://open.spotify.com/playlist/xyz-cloudy-day'; // Replace with a real cloudy day playlist
  } else {
    return 'https://open.spotify.com/playlist/xyz-default'; // Default playlist URL
  }
}

// Route to fetch weather data and handle unit preferences
app.get('/weather', async (req, res) => {
  const city = req.query.city || 'Mumbai'; // Default to Mumbai if no city is passed
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric'; // Default to 'metric' (Celsius) if 'imperial' isn't provided

  try {
    // Fetch current weather data for the city
    const cityDataUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    const cityDataResponse = await axios.get(cityDataUrl);

    // Check if the response is valid
    if (!cityDataResponse.data || !cityDataResponse.data.coord) {
      return res.status(400).json({ error: 'Invalid city or data not found' });
    }

    // Get latitude and longitude of the city for the forecast
    const { lat, lon } = cityDataResponse.data.coord;

    // Fetch the 4-day forecast for the city
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
    const forecastResponse = await axios.get(forecastUrl);

    // Filter forecast data to get daily forecasts at noon (12:00:00)
    const forecastData = forecastResponse.data.list
      .filter(forecast => forecast.dt_txt.includes('12:00:00')) // Filter to get forecasts at 12:00:00
      .slice(0, 4) // Limit to 4 days
      .map(forecast => ({
        date: new Date(forecast.dt * 1000).toISOString().split('T')[0], // Convert to readable date format
        temperature: {
          min: forecast.main.temp_min,
          max: forecast.main.temp_max,
        },
        description: forecast.weather[0].description,
      }));

    // Extract necessary data for the current weather
    const condition = cityDataResponse.data.weather[0].main.toLowerCase();
    const currentWeather = {
      temperature: cityDataResponse.data.main.temp,
      description: cityDataResponse.data.weather[0].description,
      city: cityDataResponse.data.name,
      units: units === 'metric' ? 'Celsius' : 'Fahrenheit',
      clothing: getClothingSuggestion(cityDataResponse.data.main.temp), // Add clothing suggestion based on current temp
      playlistUrl: getPlaylistUrl(condition), // Get Spotify playlist URL
    };

    // Send response with current weather, forecast, clothing suggestion, and playlist
    res.json({
      currentWeather,
      forecast: forecastData,
      units: units === 'metric' ? 'Celsius' : 'Fahrenheit',
    });
  } catch (error) {
    console.error('Error fetching data:', error.response?.data || error.message);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
});

// Set up the server to listen on a specific port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
