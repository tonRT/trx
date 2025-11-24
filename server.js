const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Free CoinGecko API - No key required for basic access
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Get top gainers and losers
app.get('/api/top-movers', async (req, res) => {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Sort by 24h change to get top gainers and losers
    const sortedByGain = [...data].sort((a, b) => 
      (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
    );
    
    const sortedByLoss = [...data].sort((a, b) => 
      (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
    );

    const result = {
      top_gainers: sortedByGain.slice(0, 5),
      top_losers: sortedByLoss.slice(0, 5),
      all_coins: data
    };

    res.json(result);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

// Get specific coin data
app.get('/api/coin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=true&price_change_percentage=24h`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data[0] || null);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coin data',
      details: error.message 
    });
  }
});

// Search coins
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const response = await fetch(
      `${COINGECKO_BASE_URL}/search?query=${query}`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data.coins.slice(0, 10));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
