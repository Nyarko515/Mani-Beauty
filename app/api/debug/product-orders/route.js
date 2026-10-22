import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from '../../../../server/http.js'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'product-orders.json')
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw || '[]')
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
