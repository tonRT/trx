// Configuration - Update this with your deployed proxy URL
const PROXY_BASE = "http://localhost:3000"; // Change to your deployed proxy URL

// Global state
let state = {
    coins: [],
    lastUpdate: null
};

// DOM elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    pumpCoins: document.getElementById('pumpCoins'),
    dumpCoins: document.getElementById('dumpCoins'),
    tradingAnalysis: document.getElementById('tradingAnalysis'),
    lastUpdate: document.getElementById('lastUpdate'),
    totalCoins: document.getElementById('totalCoins'),
    marketSentiment: document.getElementById('marketSentiment')
};

// Initialize application
class CryptoApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMarketData();
        this.startAutoRefresh();
    }

    bindEvents() {
        elements.searchBtn.addEventListener('click', () => this.searchCoin());
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCoin();
        });
    }

    async loadMarketData() {
        try {
            const response = await fetch(`${PROXY_BASE}/api/top-movers`);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            state.coins = data.all_coins;
            state.lastUpdate = new Date();
            
            this.updateTopMovers(data);
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading market data:', error);
            this.showError('ডাটা লোড করতে সমস্যা হয়েছে');
        }
    }

    updateTopMovers(data) {
        // Display top pump coins
        elements.pumpCoins.innerHTML = data.top_gainers.map(coin => 
            this.createCoinItem(coin, 'pump')
        ).join('');

        // Display top dump coins
        elements.dumpCoins.innerHTML = data.top_losers.map(coin => 
            this.createCoinItem(coin, 'dump')
        ).join('');

        // Add click events
        document.querySelectorAll('.coin-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const coinId = e.currentTarget.dataset.coinId;
                this.showTradingAnalysis(coinId);
            });
        });
    }

    createCoinItem(coin, type) {
        const change = coin.price_change_percentage_24h;
        const changeClass = change >= 0 ? 'change-positive' : 'change-negative';
        const changeSymbol = change >= 0 ? '+' : '';
        
        return `
            <div class="coin-item" data-coin-id="${coin.id}">
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon" 
                         onerror="this.src='https://via.placeholder.com/32'">
                    <div>
                        <div><strong>${coin.symbol.toUpperCase()}</strong></div>
                        <div style="font-size: 0.8rem; color: #6b7280">${coin.name}</div>
                    </div>
                </div>
                <div class="coin-details">
                    <div class="coin-price">$${coin.current_price.toLocaleString()}</div>
                    <div class="coin-change ${changeClass}">
                        ${changeSymbol}${change ? change.toFixed(2) : '0.00'}%
                    </div>
                </div>
            </div>
        `;
    }

    async showTradingAnalysis(coinId) {
        try {
            const response = await fetch(`${PROXY_BASE}/api/coin/${coinId}`);
            if (!response.ok) throw new Error('Coin data fetch failed');
            
            const coin = await response.json();
            if (!coin) throw new Error('Coin not found');

            const analysis = this.generateTradingAnalysis(coin);
            elements.tradingAnalysis.innerHTML = analysis;
            
        } catch (error) {
            console.error('Analysis error:', error);
            elements.tradingAnalysis.innerHTML = '<p>এনালাইসিস লোড করতে সমস্যা হয়েছে</p>';
        }
    }

    generateTradingAnalysis(coin) {
        const change24h = coin.price_change_percentage_24h || 0;
        const currentPrice = coin.current_price;
        
        // Simple trading analysis logic
        let signal, analysis, confidence, risk;
        
        if (change24h > 15) {
            signal = '🚀 স্ট্রং বাই';
            analysis = 'শক্তিশালী আপওয়ার্ড মুভমেন্ট। উচ্চ ভলিউম সহ পাম্প চলতে পারে।';
            confidence = 'উচ্চ';
            risk = 'উচ্চ (২০%)';
        } else if (change24h > 5) {
            signal = '📈 বাই';
            analysis = 'মডারেট বুলিশ ট্রেন্ড। ভাল এন্ট্রি পয়েন্ট হতে পারে।';
            confidence = 'মধ্যম';
            risk = 'মধ্যম (১৫%)';
        } else if (change24h > -5) {
            signal = '⚡ হোল্ড';
            analysis = 'সাইডওয়েজ মুভমেন্ট। ক্লিয়ার ডাইরেকশনের জন্য অপেক্ষা করুন।';
            confidence = 'নিম্ন';
            risk = 'নিম্ন (১০%)';
        } else {
            signal = '📉 সেল';
            analysis = 'ডাউনওয়ার্ড প্রেশার। আরও ডাম্পের সম্ভাবনা রয়েছে।';
            confidence = 'মধ্যম';
            risk = 'উচ্চ (২০%)';
        }

        // Calculate trading levels
        const entryPrice = currentPrice;
        const takeProfit = currentPrice * (1 + Math.abs(change24h) / 100);
        const stopLoss = currentPrice * 0.95;

        return `
            <div class="analysis-item">
                <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
                <p><strong>কারেন্ট প্রাইস:</strong> $${currentPrice.toLocaleString()}</p>
                <p><strong>২৪ঘণ্টা পরিবর্তন:</strong> 
                   <span class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">
                   ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
                   </span>
                </p>
            </div>
            
            <div class="analysis-item">
                <h3>ট্রেডিং সিগন্যাল</h3>
                <p><strong>সিগন্যাল:</strong> ${signal}</p>
                <p><strong>বিশ্লেষণ:</strong> ${analysis}</p>
                <p><strong>কনফিডেন্স:</strong> ${confidence}</p>
                <p><strong>রিস্ক লেভেল:</strong> ${risk}</p>
            </div>
            
            <div class="analysis-item">
                <h3>ট্রেডিং সেটআপ</h3>
                <div class="trading-setup">
                    <div class="setup-item">
                        <div class="setup-label">এন্ট্রি</div>
                        <div class="setup-value">$${entryPrice.toFixed(4)}</div>
                    </div>
                    <div class="setup-item">
                        <div class="setup-label">টেক প্রফিট</div>
                        <div class="setup-value">$${takeProfit.toFixed(4)}</div>
                    </div>
                    <div class="setup-item">
                        <div class="setup-label">স্টপ লস</div>
                        <div class="setup-value">$${stopLoss.toFixed(4)}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-item">
                <h3>পরবর্তী ১-২ ঘন্টা প্রেডিকশন</h3>
                <p>${this.generatePrediction(coin)}</p>
            </div>
        `;
    }

    generatePrediction(coin) {
        const change = coin.price_change_percentage_24h || 0;
        const volume = coin.total_volume || 0;
        
        if (change > 10 && volume > 1000000) {
            return '🚀 পরবর্তী ১-২ ঘন্টায় ৫-১৫% আরও পাম্প হতে পারে। উচ্চ ভলিউম সহ শক্তিশালী মুভমেন্ট।';
        } else if (change > 5) {
            return '📈 ৩-৮% মুভমেন্ট এক্সপেক্টেড। গুড এন্ট্রি অপারচুনিটি।';
        } else if (change < -10) {
            return '📉 ৫-১২% আরও ডাম্পের সম্ভাবনা। হাই রিস্ক, এভয়েড করুন।';
        } else {
            return '⚡ সাইডওয়েজ মুভমেন্ট এক্সপেক্টেড। ক্লিয়ার ডাইরেকশনের জন্য অপেক্ষা করুন।';
        }
    }

    async searchCoin() {
        const query = elements.searchInput.value.trim();
        if (!query) return;

        try {
            const response = await fetch(`${PROXY_BASE}/api/search/${query}`);
            if (!response.ok) throw new Error('Search failed');
            
            const coins = await response.json();
            if (coins.length > 0) {
                this.showTradingAnalysis(coins[0].id);
            } else {
                this.showError('কয়েন পাওয়া যায়নি');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('সার্চ করতে সমস্যা হয়েছে');
        }
    }

    updateStats() {
        elements.lastUpdate.textContent = state.lastUpdate.toLocaleTimeString();
        elements.totalCoins.textContent = state.coins.length;
        
        // Calculate market sentiment
        const positiveCoins = state.coins.filter(coin => 
            (coin.price_change_percentage_24h || 0) > 0
        ).length;
        const sentimentPercent = (positiveCoins / state.coins.length) * 100;
        
        let sentiment = 'নিউট্রাল';
        if (sentimentPercent > 60) sentiment = 'বুলিশ 🟢';
        if (sentimentPercent < 40) sentiment = 'বিয়ারিশ 🔴';
        
        elements.marketSentiment.textContent = sentiment;
    }

    startAutoRefresh() {
        // Refresh every 2 minutes
        setInterval(() => {
            this.loadMarketData();
        }, 120000);
    }

    showError(message) {
        elements.tradingAnalysis.innerHTML = `
            <div style="background: #ef4444; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                ${message}
            </div>
        `;
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new CryptoApp();
});
