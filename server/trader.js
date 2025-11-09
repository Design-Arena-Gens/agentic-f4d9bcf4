const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class AIForexTrader {
  constructor(config) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    this.running = true;
    this.balance = 10000;
    this.trades = [];
    this.openTrades = [];
    this.symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    this.marketData = {};

    this.initializeMarketData();
    this.startTrading();
  }

  initializeMarketData() {
    this.symbols.forEach(symbol => {
      this.marketData[symbol] = {
        price: this.getRandomPrice(symbol),
        history: [],
        indicators: {}
      };
    });
  }

  getRandomPrice(symbol) {
    const basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 149.50,
      'AUDUSD': 0.6450,
      'USDCAD': 1.3650,
      'NZDUSD': 0.5950
    };
    return basePrices[symbol] || 1.0;
  }

  updateMarketData() {
    this.symbols.forEach(symbol => {
      const data = this.marketData[symbol];
      const volatility = 0.0003;
      const change = (Math.random() - 0.5) * volatility;
      data.price = data.price * (1 + change);

      data.history.push(data.price);
      if (data.history.length > 100) {
        data.history.shift();
      }

      if (data.history.length >= 20) {
        const recent = data.history.slice(-20);
        const sma20 = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((sum, val) => sum + Math.pow(val - sma20, 2), 0) / recent.length;
        const stdDev = Math.sqrt(variance);

        data.indicators = {
          sma20,
          upperBand: sma20 + (stdDev * 2),
          lowerBand: sma20 - (stdDev * 2),
          rsi: this.calculateRSI(data.history),
          momentum: data.history[data.history.length - 1] - data.history[data.history.length - 10]
        };
      }
    });
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  async analyzeMarketWithAI() {
    try {
      const marketSummary = this.symbols.map(symbol => {
        const data = this.marketData[symbol];
        return `${symbol}: Price=${data.price.toFixed(5)}, SMA20=${data.indicators.sma20?.toFixed(5)}, RSI=${data.indicators.rsi?.toFixed(2)}, Momentum=${data.indicators.momentum?.toFixed(5)}`;
      }).join('\n');

      const prompt = `You are an expert forex trading AI. Analyze this market data and provide ONE trading recommendation.

Current Market Data:
${marketSummary}

Account Balance: $${this.balance.toFixed(2)}
Open Trades: ${this.openTrades.length}/${this.config.maxOpenTrades}
Risk Per Trade: ${this.config.riskPercent}%

Based on technical analysis (RSI, Bollinger Bands, Momentum), provide your recommendation in this exact format:

ACTION: [BUY/SELL/HOLD/CLOSE]
SYMBOL: [currency pair]
REASON: [one sentence explanation]
CONFIDENCE: [0-100]

Rules:
- RSI < 30 = oversold (potential BUY)
- RSI > 70 = overbought (potential SELL)
- Price near lower Bollinger Band = potential BUY
- Price near upper Bollinger Band = potential SELL
- Positive momentum = bullish, negative = bearish
- Only recommend trades with confidence > 70
- Consider open trades before suggesting new ones`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null;
    }
  }

  parseAIResponse(text) {
    const actionMatch = text.match(/ACTION:\s*(\w+)/i);
    const symbolMatch = text.match(/SYMBOL:\s*(\w+)/i);
    const reasonMatch = text.match(/REASON:\s*([^\n]+)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);

    if (!actionMatch || !symbolMatch) return null;

    return {
      action: actionMatch[1].toUpperCase(),
      symbol: symbolMatch[1].toUpperCase(),
      reason: reasonMatch ? reasonMatch[1].trim() : 'AI analysis',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
      fullAnalysis: text
    };
  }

  executeTrade(decision) {
    if (!decision || decision.confidence < 70) return;

    const symbol = decision.symbol;
    const data = this.marketData[symbol];

    if (!data) return;

    if (decision.action === 'BUY' && this.openTrades.length < this.config.maxOpenTrades) {
      const riskAmount = this.balance * (this.config.riskPercent / 100);
      const lotSize = 0.01;
      const stopLoss = data.price * 0.995;
      const takeProfit = data.price * 1.015;

      const trade = {
        id: Date.now().toString(),
        symbol,
        type: 'BUY',
        entry: data.price,
        stopLoss,
        takeProfit,
        lotSize,
        timestamp: new Date().toISOString(),
        status: 'OPEN',
        reason: decision.reason
      };

      this.openTrades.push(trade);
      this.trades.unshift(trade);
      console.log(`🟢 OPENED BUY: ${symbol} @ ${data.price.toFixed(5)}`);
    }
    else if (decision.action === 'SELL' && this.openTrades.length < this.config.maxOpenTrades) {
      const riskAmount = this.balance * (this.config.riskPercent / 100);
      const lotSize = 0.01;
      const stopLoss = data.price * 1.005;
      const takeProfit = data.price * 0.985;

      const trade = {
        id: Date.now().toString(),
        symbol,
        type: 'SELL',
        entry: data.price,
        stopLoss,
        takeProfit,
        lotSize,
        timestamp: new Date().toISOString(),
        status: 'OPEN',
        reason: decision.reason
      };

      this.openTrades.push(trade);
      this.trades.unshift(trade);
      console.log(`🔴 OPENED SELL: ${symbol} @ ${data.price.toFixed(5)}`);
    }
    else if (decision.action === 'CLOSE') {
      this.closeTradesBySymbol(symbol, decision.reason);
    }
  }

  manageTrades() {
    this.openTrades.forEach((trade, index) => {
      const currentPrice = this.marketData[trade.symbol]?.price;
      if (!currentPrice) return;

      let shouldClose = false;
      let profit = 0;

      if (trade.type === 'BUY') {
        if (currentPrice >= trade.takeProfit || currentPrice <= trade.stopLoss) {
          shouldClose = true;
          profit = (currentPrice - trade.entry) * 100000 * trade.lotSize;
        }
      } else if (trade.type === 'SELL') {
        if (currentPrice <= trade.takeProfit || currentPrice >= trade.stopLoss) {
          shouldClose = true;
          profit = (trade.entry - currentPrice) * 100000 * trade.lotSize;
        }
      }

      if (shouldClose) {
        this.balance += profit;
        trade.exit = currentPrice;
        trade.profit = profit;
        trade.status = 'CLOSED';

        const tradeIndex = this.trades.findIndex(t => t.id === trade.id);
        if (tradeIndex !== -1) {
          this.trades[tradeIndex] = trade;
        }

        console.log(`✅ CLOSED ${trade.type}: ${trade.symbol} @ ${currentPrice.toFixed(5)} | P/L: $${profit.toFixed(2)}`);
        this.openTrades.splice(index, 1);
      }
    });
  }

  closeTradesBySymbol(symbol, reason) {
    const tradesToClose = this.openTrades.filter(t => t.symbol === symbol);
    tradesToClose.forEach(trade => {
      const currentPrice = this.marketData[symbol]?.price;
      if (!currentPrice) return;

      const profit = trade.type === 'BUY'
        ? (currentPrice - trade.entry) * 100000 * trade.lotSize
        : (trade.entry - currentPrice) * 100000 * trade.lotSize;

      this.balance += profit;
      trade.exit = currentPrice;
      trade.profit = profit;
      trade.status = 'CLOSED';
      trade.reason = reason;

      const tradeIndex = this.trades.findIndex(t => t.id === trade.id);
      if (tradeIndex !== -1) {
        this.trades[tradeIndex] = trade;
      }

      console.log(`✅ CLOSED ${trade.type}: ${trade.symbol} @ ${currentPrice.toFixed(5)} | P/L: $${profit.toFixed(2)}`);
    });

    this.openTrades = this.openTrades.filter(t => t.symbol !== symbol);
  }

  saveStatus(lastAnalysis) {
    const closedTrades = this.trades.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => t.profit > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);

    const status = {
      status: {
        running: true,
        balance: this.balance,
        profit: totalProfit,
        totalTrades: closedTrades.length,
        winRate,
        lastAnalysis: lastAnalysis || 'Analyzing markets...'
      },
      trades: this.trades.slice(0, 20)
    };

    const statusPath = path.join(process.cwd(), 'bot-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  }

  async startTrading() {
    console.log('🤖 AI Forex Trading Bot Started');
    console.log(`💰 Initial Balance: $${this.balance.toFixed(2)}`);

    let iteration = 0;

    while (this.running) {
      iteration++;

      this.updateMarketData();
      this.manageTrades();

      if (iteration % 3 === 0) {
        const decision = await this.analyzeMarketWithAI();

        if (decision) {
          console.log(`\n🧠 AI Decision: ${decision.action} ${decision.symbol}`);
          console.log(`📊 Reason: ${decision.reason}`);
          console.log(`🎯 Confidence: ${decision.confidence}%`);

          this.executeTrade(decision);
          this.saveStatus(decision.fullAnalysis);
        }
      } else {
        this.saveStatus();
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

const configPath = path.join(process.cwd(), 'bot-config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!config.geminiApiKey) {
    config.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  const trader = new AIForexTrader(config);
} else {
  console.error('Configuration file not found');
  process.exit(1);
}
