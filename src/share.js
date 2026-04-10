/**
 * 生成分享图片 — 纯 Canvas 绘制
 * Colors and typography aligned with Impeccable warm earth palette
 */

import qrcode from 'qrcode-generator'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const SITE_URL = 'https://Gnod.github.io/SBTI/'

/**
 * 生成分享卡片并下载
 */
export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode) {
  const dpr = 2
  const W = 720
  const H = 1400
  // 注：画布高度固定，内容超出时底部会被截断
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 背景 — warm paper
  ctx.fillStyle = '#f6f1eb'
  ctx.fillRect(0, 0, W, H)

  // 卡片白底
  const cardX = 32, cardY = 32, cardW = W - 64, cardH = H - 64
  roundRect(ctx, cardX, cardY, cardW, cardH, 16)
  ctx.fillStyle = '#fdfbf8'
  ctx.fill()

  let y = cardY + 52

  // Kicker
  ctx.textAlign = 'center'
  ctx.font = '400 20px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a7b6c'
  const kickerText = mode === 'drunk' ? '隐藏人格已激活' : mode === 'fallback' ? '系统强制兜底' : '你的主类型'
  ctx.fillText(kickerText, W / 2, y)
  y += 58

  // 类型代码 — serif display
  ctx.font = '400 76px Georgia, "Songti SC", serif'
  ctx.fillStyle = '#b4541a'
  ctx.fillText(primary.code, W / 2, y)
  y += 42

  // 中文名 — serif heading
  ctx.font = '700 34px "Songti SC", "STSong", Georgia, serif'
  ctx.fillStyle = '#271e17'
  ctx.fillText(primary.cn, W / 2, y)
  y += 38

  // 匹配度 — divider style
  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  ctx.font = '500 19px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'

  // Top divider line
  ctx.strokeStyle = '#e4dbd0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + 60, y - 10)
  ctx.lineTo(cardX + cardW - 60, y - 10)
  ctx.stroke()

  ctx.fillStyle = '#b4541a'
  ctx.fillText(badgeText, W / 2, y + 12)

  // Bottom divider line
  ctx.beginPath()
  ctx.moveTo(cardX + 60, y + 28)
  ctx.lineTo(cardX + cardW - 60, y + 28)
  ctx.stroke()

  y += 52

  // Intro
  ctx.font = 'italic 600 21px "Songti SC", "STSong", Georgia, serif'
  ctx.fillStyle = '#271e17'
  const introLines = wrapText(ctx, primary.intro || '', cardW - 80)
  for (const line of introLines) {
    ctx.fillText(line, W / 2, y)
    y += 30
  }
  y += 20

  // Desc
  ctx.font = '400 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#5a4e42'
  ctx.textAlign = 'left'
  const descLines = wrapText(ctx, primary.desc || '', cardW - 96)
  for (const line of descLines) {
    ctx.fillText(line, cardX + 48, y)
    y += 26
  }
  ctx.textAlign = 'center'
  y += 20

  // 雷达图
  const radarCx = W / 2
  const radarCy = y + 150
  const radarR = 130
  drawShareRadar(ctx, radarCx, radarCy, radarR, userLevels, dimOrder, dimDefs)
  y = radarCy + radarR + 44

  // 二维码
  const qrSize = 100
  const qr = qrcode(0, 'M')
  qr.addData(SITE_URL)
  qr.make()
  const moduleCount = qr.getModuleCount()
  const cellSize = qrSize / moduleCount
  const qrX = W / 2 - qrSize / 2
  const qrY = y + 4

  // 二维码白底
  const qrPad = 6
  roundRect(ctx, qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 6)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // 绘制二维码模块
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillStyle = '#271e17'
        ctx.fillRect(qrX + col * cellSize, qrY + row * cellSize, cellSize + 0.5, cellSize + 0.5)
      }
    }
  }

  y = qrY + qrSize + 20

  ctx.textAlign = 'center'
  ctx.font = '400 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8a7b6c'
  ctx.fillText('扫码体验 SBTI 人格测试', W / 2, y)
  y += 24

  // 底部水印
  ctx.font = '400 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#c4b8a8'
  ctx.fillText('SBTI 人格测试 · 仅供娱乐', W / 2, H - cardY - 24)

  // 下载
  const link = document.createElement('a')
  link.download = `SBTI-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * 在分享图上绘制雷达图 — warm accent palette
 */
function drawShareRadar(ctx, cx, cy, maxR, userLevels, dimOrder, dimDefs) {
  const n = dimOrder.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2

  // 背景圆环
  for (let lv = 3; lv >= 1; lv--) {
    const r = (lv / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = lv === 3 ? 'rgba(180,84,26,0.05)' : lv === 2 ? 'rgba(180,84,26,0.03)' : 'rgba(180,84,26,0.015)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(180,84,26,0.1)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // 轴线 + 标签
  ctx.font = '400 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(180,84,26,0.08)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const lr = maxR + 24
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    const label = (dimDefs[dimOrder[i]]?.name || dimOrder[i]).replace(/^[A-Za-z0-9]+\s*/, '')
    ctx.fillStyle = '#8a7b6c'
    ctx.fillText(label, lx, ly)
  }

  // 数据多边形
  const values = dimOrder.map((d) => LEVEL_NUM[userLevels[d]] || 2)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(180,84,26,0.15)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(180,84,26,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 数据点
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#b4541a'
    ctx.fill()
  }
}

/**
 * 圆角矩形
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * 文字自动换行
 */
function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
