# AI Forex Trading Bot

Autonomous AI-powered forex trading bot using Gemini AI for market analysis and MetaTrader 5 integration.

## Features

- 🤖 **Gemini AI Analysis**: Uses Google's Gemini AI for sophisticated market analysis
- 📊 **Technical Indicators**: RSI, Bollinger Bands, SMA, and momentum analysis
- 💰 **Risk Management**: Configurable risk per trade and maximum open positions
- 🎯 **Automated Trading**: Fully autonomous trading decisions with no manual intervention
- 📈 **Real-time Dashboard**: Live tracking of trades, profit/loss, and bot status
- 🔒 **MT5 Integration**: Direct connection to MetaTrader 5 accounts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the bot through the web interface:
   - MT5 Account credentials
   - Gemini API key (get from https://makersuite.google.com/app/apikey)
   - Risk parameters
   - Maximum open trades

3. Run locally:
```bash
npm run dev
```

4. Deploy to production:
```bash
vercel deploy --prod
```

## Configuration

- **Risk Per Trade**: Percentage of account balance to risk per trade (0.5% - 10%)
- **Max Open Trades**: Maximum number of concurrent open positions (1-10)
- **Supported Pairs**: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD

## Trading Strategy

The AI analyzes:
- RSI levels (oversold < 30, overbought > 70)
- Bollinger Bands for entry/exit signals
- Price momentum and trends
- Multiple timeframes and indicators

The bot automatically:
- Opens positions based on high-confidence AI analysis
- Sets stop-loss and take-profit levels
- Manages open trades
- Closes positions when targets are hit

## Security

- All credentials stored locally in browser
- API keys never exposed to frontend
- Secure MT5 connection

## Disclaimer

Trading forex carries risk. This bot is for educational purposes. Always test on demo accounts first.
