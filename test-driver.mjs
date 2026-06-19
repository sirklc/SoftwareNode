import { _electron as electron } from 'playwright-core'
import * as fs from 'node:fs'

const SHOT = '/tmp/shots3'
fs.mkdirSync(SHOT, { recursive: true })

const app = await electron.launch({
  executablePath: '/home/sirklc/Documents/GitHub/SoftwareNode/node_modules/electron/dist/electron',
  args: ['--no-sandbox', '/home/sirklc/Documents/GitHub/SoftwareNode'],
  env: { ...process.env, NODE_ENV: 'production', DISPLAY: process.env.DISPLAY || ':1' },
  timeout: 30_000,
})
await new Promise(r => setTimeout(r, 3000))
const page = app.windows().find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow()

// Sidebar should show "Takvim" button
await page.screenshot({ path: `${SHOT}/01-sidebar.png` })

// Click Takvim in sidebar
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => b.textContent?.trim() === 'Takvim')
  if (btn) btn.click()
})
await new Promise(r => setTimeout(r, 800))
await page.screenshot({ path: `${SHOT}/02-global-calendar.png` })

await app.close()
console.log('Done → /tmp/shots3/')
