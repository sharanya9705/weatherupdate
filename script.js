// DOM Elements
const themeSwitcher = document.getElementById('theme-switcher');
const searchInput = document.getElementById('location-search');
const searchBtn = document.getElementById('search-btn');
const currentLocation = document.getElementById('current-location');
const currentTemp = document.getElementById('current-temp');
const currentDescription = document.getElementById('current-description');
const forecastCards = document.getElementById('forecast-cards');
const unitToggle = document.getElementById('unit-toggle');
const clothingList = document.getElementById('clothing-list');
const musicPlaylist = document.getElementById('playlist-list');

// State Variables
let isCelsius = true; // Initial unit is Celsius
let lastWeatherData = null; // To store the most recent weather data

// Theme Switcher Event Listener
themeSwitcher.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  themeSwitcher.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
  toggleBackgroundVideo();
});

// Function to toggle background video based on theme
function toggleBackgroundVideo() {
  const videoSource = document.getElementById('video-source');
  videoSource.src = document.body.classList.contains('dark-theme') ? 'bg-dark.mp4' : 'bg.mp4';
  document.getElementById('background-video').load();
}

// Function to fetch and update background image from Unsplash
function updateBackgroundImage(city) {
  document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${city}')`;
}

// Search button event
searchBtn.addEventListener('click', async () => {
  const location = searchInput.value.trim();
  if (!location) return;

  try {
    const weatherData = await fetchWeather(location);
    lastWeatherData = weatherData;
    updateWeather(weatherData);
    updateMusic(weatherData); // Update music playlist based on weather
    updateBackgroundImage(location); // Update background image based on location
  } catch (error) {
    console.error(error);
  }
});

// Toggle Unit (Celsius/Fahrenheit)
unitToggle.addEventListener('click', () => {
  isCelsius = !isCelsius;
  unitToggle.textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
  updateWeather(lastWeatherData);
});

// Fetch weather data from the backend
async function fetchWeather(city) {
  const unitParam = isCelsius ? 'metric' : 'imperial'; // 'metric' for Celsius, 'imperial' for Fahrenheit
  try {
    const response = await fetch(`http://localhost:3000/weather?city=${city}&units=${unitParam}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Something went wrong');
    }
    return await response.json();
  } catch (err) {
    alert(err.message);
    throw err;
  }
}


// Update weather display
function updateWeather(weatherData) {
  const tempInCelsius = weatherData.currentWeather.temperature;
  const tempInFahrenheit = (tempInCelsius * 9) / 5 + 32;

  // Display current weather
  currentTemp.textContent = `Temperature: ${
    isCelsius ? `${tempInCelsius.toFixed(1)}°C` : `${tempInFahrenheit.toFixed(1)}°F`
  }`;
  currentDescription.textContent = `Description: ${weatherData.currentWeather.description}`;
  currentLocation.textContent = `Location: ${weatherData.currentWeather.city}`;

 // Update clothing suggestions
clothingList.innerHTML = '';
const clothingSuggestion = weatherData.currentWeather.clothing;
const listItem = document.createElement('li');
listItem.textContent = clothingSuggestion;
clothingList.appendChild(listItem);

// Add a rectangular shopping button for clothing suggestions based on temperature and weather conditions
const shoppingButton = document.createElement('button');
const temp = weatherData.currentWeather.temperature;
const condition = weatherData.currentWeather.description.toLowerCase();

// Determine the shopping link based on weather conditions
if (temp > 30) {
  shoppingButton.onclick = () => window.open('https://www.myntra.com/tshirts-and-shorts', '_blank'); // Hot weather
} else if (temp > 20 && temp <= 30) {
  shoppingButton.onclick = () => window.open('https://www.myntra.com/light-jackets-and-jeans', '_blank'); // Mild weather
} else if (temp > 10 && temp <= 20) {
  shoppingButton.onclick = () => window.open('https://www.myntra.com/sweaters-and-scarves', '_blank'); // Cool weather
} else if (temp <= 10) {
  shoppingButton.onclick = () => window.open('https://www.myntra.com/coats-and-thermal-wear', '_blank'); // Cold weather
}

if (condition.includes('rain')) {
  shoppingButton.onclick = () => window.open('https://www.myntra.com/raincoats-and-umbrellas', '_blank'); // Rainy weather
}

// Style the button
shoppingButton.textContent = 'Shopping 🛍️';
shoppingButton.style.backgroundColor = '#007BFF';
shoppingButton.style.color = '#FFF';
shoppingButton.style.padding = '10px 20px';
shoppingButton.style.border = 'none';
shoppingButton.style.borderRadius = '5px';
shoppingButton.style.cursor = 'pointer';
shoppingButton.style.marginTop = '10px';

// Append the button to the clothing list
clothingList.appendChild(shoppingButton);

 

  // Update 4-day forecast
  forecastCards.innerHTML = ''; // Clear previous forecast
  weatherData.forecast.forEach((day) => {
    const forecastCard = document.createElement('div');
    forecastCard.classList.add('forecast-card');
    
    const tempMin = isCelsius ? `${day.temperature.min.toFixed(1)}°C` : `${((day.temperature.min * 9) / 5 + 32).toFixed(1)}°F`;
    const tempMax = isCelsius ? `${day.temperature.max.toFixed(1)}°C` : `${((day.temperature.max * 9) / 5 + 32).toFixed(1)}°F`;

    forecastCard.innerHTML = `
      <h4>${day.date}</h4>
      <p>Min Temp: ${tempMin}</p>
      <p>Max Temp: ${tempMax}</p>
      <p>${day.description}</p>
    `;

    forecastCards.appendChild(forecastCard);
  });
}

// Function to update music playlist based on weather
function updateMusic(weatherData) {
  const weatherCondition = weatherData.currentWeather.description.toLowerCase();
  
  // Clear the previous playlist
  musicPlaylist.innerHTML = '';

  let playlist = [];
  if (weatherCondition.includes('rain')) {
    playlist = ['Rainy Day Playlist - Acoustic', 'Rainy Vibes - Indie Pop', 'Chill Beats for Rainy Days'];
  } else if (weatherCondition.includes('sunny') || weatherCondition.includes('clear')) {
    playlist = ['Sunny Day Vibes - Pop Hits', 'Feel Good Music - Upbeat Tracks', 'Summer Chill - Relaxing Tunes'];
  } else if (weatherCondition.includes('cloud')) {
    playlist = ['Cloudy Day - Soft Indie', 'Relaxing Piano Music', 'Lo-Fi Chill for Cloudy Days'];
  } else {
    playlist = ['Night Time Vibes - Calm & Chill', 'Late Night Jazz', 'Smooth Rhythms for Every Day'];
  }

  // Function to get Spotify playlist URL
  function getPlaylistUrl(condition) {
    if (condition.includes('clear') || condition.includes('sunny')) {
      return 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD7tbmL'; // Sunny Day Vibes
    } else if (condition.includes('rain')) {
      return 'https://open.spotify.com/playlist/37i9dQZF1DXbvABJXBIyiY'; // Rainy Day Chill
    } else if (condition.includes('cloud')) {
      return 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY'; // Cloudy Day Lo-Fi
    } else {
      return 'https://open.spotify.com/playlist/37i9dQZF1DWV7EzJMK2FUI'; // Night Time Calm
    }
  }

  // Create a green rectangular button for the playlist
  const playlistButton = document.createElement('button');
  playlistButton.onclick = () => window.open(getPlaylistUrl(weatherCondition), '_blank');
  playlistButton.textContent = 'Playlist 🎵';
  playlistButton.style.backgroundColor = '#28A745'; // Green background
  playlistButton.style.color = '#FFF'; // White text
  playlistButton.style.padding = '10px 20px';
  playlistButton.style.border = 'none';
  playlistButton.style.borderRadius = '5px';
  playlistButton.style.cursor = 'pointer';
  playlistButton.style.marginBottom = '10px';

  // Append the button to the music playlist container
  musicPlaylist.appendChild(playlistButton);

  // Display playlist suggestions
  playlist.forEach(song => {
    const listItem = document.createElement('li');
    listItem.textContent = song;
    musicPlaylist.appendChild(listItem);
  });
}


// Load favorites when the page loads
window.onload = () => {
  // Initial actions like loading the weather based on user's location (if needed) can go here
};
