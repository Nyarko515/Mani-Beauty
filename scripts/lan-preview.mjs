import { app } from '../server/app.js'

const port = Number(process.env.PORT || 3002)
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`Mani Beauty LAN preview listening on http://${host}:${port}`)
})
