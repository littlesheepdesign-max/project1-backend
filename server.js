const express = require('express');
const cors = require('cors');
const path = require('path');

// Use dynamic import pattern so this works nicely on some hosts
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();

// Set the port (default 3000 locally, but Render/etc. will override with process.env.PORT)
const PORT = process.env.PORT || 3000;

// FPL API base URL
const FPL_BASE = 'https://fantasy.premierleague.com/api';

// 1) CORS: allow your GitHub Pages site
app.use(
  cors({
    origin: 'https://littlesheepdesign-max.github.io', // your GitHub Pages origin
  })
);

// 2) (Optional) JSON body parsing if needed in future
app.use(express.json());

// 3) Serve static files locally ONLY (won’t be used by GitHub Pages, but fine for dev)
app.use(express.static('public'));

// Root route for local testing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4) Proxy endpoint to handle API requests to FPL: bootstrap-static
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(`${FPL_BASE}/bootstrap-static/`);

    if (!response.ok) {
      console.error('Error from FPL bootstrap API:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch data from FPL API' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from FPL API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// 5) Proxy for live gameweek data
app.get('/api/live/:gw', async (req, res) => {
  const { gw } = req.params;

  try {
    const response = await fetch(`${FPL_BASE}/event/${gw}/live/`);

    if (!response.ok) {
      console.error('Error from FPL live API:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch live data from FPL API' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching live data from FPL API:', error);
    res.status(500).json({ error: 'Failed to fetch live data' });
  }
});

// 6) Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});