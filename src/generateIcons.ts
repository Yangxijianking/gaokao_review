import { db } from './db'

export async function generatePWAIcons() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const sizes = [192, 512]

  for (const size of sizes) {
    canvas.width = size
    canvas.height = size

    // Background
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#2563eb')
    grad.addColorStop(1, '#1d4ed8')

    const r = size * 0.18
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(size - r, 0)
    ctx.quadraticCurveTo(size, 0, size, r)
    ctx.lineTo(size, size - r)
    ctx.quadraticCurveTo(size, size, size - r, size)
    ctx.lineTo(r, size)
    ctx.quadraticCurveTo(0, size, 0, size - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.fillStyle = grad
    ctx.fill()

    // Emoji
    ctx.font = `${size * 0.5}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎓', size / 2, size * 0.45)

    // Text
    ctx.font = `bold ${size * 0.12}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText('高三复习', size / 2, size * 0.82)

    // Download
    const link = document.createElement('a')
    link.download = `icon-${size}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}
