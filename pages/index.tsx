import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, DollarSign, Brain, Settings, Play, Pause } from 'lucide-react'

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  entry: number
  exit?: number
  profit?: number
  timestamp: string
  status: 'OPEN' | 'CLOSED'
  reason: string
}

interface BotStatus {
  running: boolean
  balance: number
  profit: number
  totalTrades: number
  winRate: number
  lastAnalysis: string
}

export default function Home() {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    running: false,
    balance: 10000,
    profit: 0,
    totalTrades: 0,
    winRate: 0,
    lastAnalysis: 'Waiting to start...'
  })
  const [trades, setTrades] = useState<Trade[]>([])
  const [config, setConfig] = useState({
    mt5Account: '',
    mt5Password: '',
    mt5Server: '',
    geminiApiKey: '',
    riskPercent: 2,
    maxOpenTrades: 3
  })
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      if (botStatus.running) {
        try {
          const response = await fetch('/api/bot-status')
          const data = await response.json()
          setBotStatus(data.status)
          setTrades(data.trades)
        } catch (error) {
          console.error('Failed to fetch bot status:', error)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [botStatus.running])

  const toggleBot = async () => {
    try {
      const endpoint = botStatus.running ? '/api/stop-bot' : '/api/start-bot'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        setBotStatus(prev => ({ ...prev, running: !prev.running }))
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error)
    }
  }

  const saveConfig = () => {
    localStorage.setItem('tradingBotConfig', JSON.stringify(config))
    setShowConfig(false)
  }

  useEffect(() => {
    const savedConfig = localStorage.getItem('tradingBotConfig')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Brain size={40} color="#fff" />
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>AI Forex Trading Bot</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px'
              }}
            >
              <Settings size={20} /> Configure
            </button>
            <button
              onClick={toggleBot}
              style={{
                padding: '12px 24px',
                background: botStatus.running ? '#ef4444' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {botStatus.running ? <><Pause size={20} /> Stop Bot</> : <><Play size={20} /> Start Bot</>}
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <StatCard
            icon={<Activity size={24} />}
            label="Status"
            value={botStatus.running ? 'ACTIVE' : 'STOPPED'}
            color={botStatus.running ? '#10b981' : '#ef4444'}
          />
          <StatCard
            icon={<DollarSign size={24} />}
            label="Balance"
            value={`$${botStatus.balance.toFixed(2)}`}
            color="#3b82f6"
          />
          <StatCard
            icon={botStatus.profit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            label="Total Profit"
            value={`$${botStatus.profit.toFixed(2)}`}
            color={botStatus.profit >= 0 ? '#10b981' : '#ef4444'}
          />
          <StatCard
            icon={<Activity size={24} />}
            label="Win Rate"
            value={`${botStatus.winRate.toFixed(1)}%`}
            color="#8b5cf6"
          />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={24} color="#8b5cf6" />
            AI Analysis
          </h2>
          <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
            {botStatus.lastAnalysis}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Recent Trades</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Symbol</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Entry</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Exit</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Profit</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No trades yet. Start the bot to begin trading.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{trade.symbol}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: trade.type === 'BUY' ? '#d1fae5' : '#fee2e2',
                          color: trade.type === 'BUY' ? '#059669' : '#dc2626'
                        }}>
                          {trade.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{trade.entry.toFixed(5)}</td>
                      <td style={{ padding: '12px' }}>{trade.exit ? trade.exit.toFixed(5) : '-'}</td>
                      <td style={{ padding: '12px', color: trade.profit && trade.profit >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>
                        {trade.profit ? `$${trade.profit.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: trade.status === 'OPEN' ? '#dbeafe' : '#e5e7eb',
                          color: trade.status === 'OPEN' ? '#1e40af' : '#374151'
                        }}>
                          {trade.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>{trade.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showConfig && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Bot Configuration</h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>MT5 Account</label>
                <input
                  type="text"
                  value={config.mt5Account}
                  onChange={(e) => setConfig({ ...config, mt5Account: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="Your MT5 account number"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>MT5 Password</label>
                <input
                  type="password"
                  value={config.mt5Password}
                  onChange={(e) => setConfig({ ...config, mt5Password: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="Your MT5 password"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>MT5 Server</label>
                <input
                  type="text"
                  value={config.mt5Server}
                  onChange={(e) => setConfig({ ...config, mt5Server: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="e.g., ICMarkets-Demo"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gemini API Key</label>
                <input
                  type="password"
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="Your Gemini API key"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Risk Per Trade (%)</label>
                <input
                  type="number"
                  value={config.riskPercent}
                  onChange={(e) => setConfig({ ...config, riskPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  min="0.5"
                  max="10"
                  step="0.5"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Max Open Trades</label>
                <input
                  type="number"
                  value={config.maxOpenTrades}
                  onChange={(e) => setConfig({ ...config, maxOpenTrades: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  min="1"
                  max="10"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={saveConfig}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
    </div>
  )
}
