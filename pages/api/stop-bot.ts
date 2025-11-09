import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    exec('pkill -f "node server/trader.js"', (error) => {
      const statusPath = path.join(process.cwd(), 'bot-status.json')

      if (fs.existsSync(statusPath)) {
        const data = JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
        data.status.running = false
        data.status.lastAnalysis = 'Bot stopped by user'
        fs.writeFileSync(statusPath, JSON.stringify(data))
      }

      res.status(200).json({ success: true, message: 'Bot stopped successfully' })
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop bot' })
  }
}
