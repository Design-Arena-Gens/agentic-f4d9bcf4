import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const statusPath = path.join(process.cwd(), 'bot-status.json')

    if (!fs.existsSync(statusPath)) {
      return res.status(200).json({
        status: {
          running: false,
          balance: 10000,
          profit: 0,
          totalTrades: 0,
          winRate: 0,
          lastAnalysis: 'Bot not started yet'
        },
        trades: []
      })
    }

    const data = JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read bot status' })
  }
}
