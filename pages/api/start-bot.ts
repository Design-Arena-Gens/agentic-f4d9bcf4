import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const config = req.body
    const configPath = path.join(process.cwd(), 'bot-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config))

    const statusPath = path.join(process.cwd(), 'bot-status.json')
    const initialStatus = {
      status: {
        running: true,
        balance: 10000,
        profit: 0,
        totalTrades: 0,
        winRate: 0,
        lastAnalysis: 'Starting AI analysis...'
      },
      trades: []
    }
    fs.writeFileSync(statusPath, JSON.stringify(initialStatus))

    const traderProcess = spawn('node', ['server/trader.js'], {
      detached: true,
      stdio: 'ignore'
    })
    traderProcess.unref()

    res.status(200).json({ success: true, message: 'Bot started successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to start bot' })
  }
}
