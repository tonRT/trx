# Crypto Trading Website

## Proxy Server Deployment

### Render/Railway Deployment:
1. Create account on Render.com or Railway.app
2. Connect your GitHub repository
3. Add environment variable:
   - `PORT` = 3000 (auto-set by platform)
4. No API key needed - uses free CoinGecko API

### Local Development:
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Server runs on http://localhost:3000

## Frontend Deployment (GitHub Pages)

1. Update PROXY_BASE in script.js:
   ```javascript
   const PROXY_BASE = "https://your-proxy-url.onrender.com";
