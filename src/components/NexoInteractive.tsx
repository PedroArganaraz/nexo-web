'use client'

import { useEffect, useRef } from 'react'

const BS               = 4
const GRAVITY          = 0.55
const BOUNCE           = 0.28
const STOP_VY          = 0.85
const TRIGGER_R        = 110
const MAX_FALL_DELAY   = 480
const FLOOR_MARGIN     = 65
const REBUILD_IDLE_MS  = 4000
const COL_DELAY_MS     = 95
const BLOCK_STAGGER_MS = 28
const RISE_DURATION_MS = 520
const CLEAN_FADE_MS    = 350
const FLASH_IN_MS      = 150
const FLASH_OUT_MS     = 150
const LETTER_BOUNDS    = [0, 0.235, 0.495, 0.695, 1.0]

const S_REST = 0
const S_WAIT = 1
const S_FALL = 2
const S_LAND = 3
const S_RISE = 4

interface Block {
  ox: number; oy: number   // home (never changes)
  cy: number               // current Y — X is always ox
  vy: number
  letter: number
  state: number
  triggerAt: number
  landY: number            // pre-reserved landing row
  riseStartTime: number
  riseFromY: number
  color: string
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function colSlot(bk: Block)      { return Math.round(bk.ox / BS) }

export default function NexoInteractive() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let W = 0, H = 0
    let blocks: Block[] = []
    // col slot → current top-of-pile Y  (like original's colStack dict)
    let colStack: Record<number, number> = {}
    let lastMove = Date.now()
    // 0 = full tiles, 1 = full clean image; everFell prevents animation on first load
    const letterTrans = [0, 1, 2, 3].map(() => ({
      restAlpha: 1.0, restStartAt: 0, everFell: false,
    }))
    let logoCanvas: HTMLCanvasElement | null = null
    let logoX = 0, logoY = 0, logoW = 0, logoH = 0
    let flashActive    = false
    let flashStartAt   = 0
    let prevAnyNotRest = false

    // Per-letter rebuild state (mirrors original's ls[])
    const ls = [0, 1, 2, 3].map(() => ({ rebuilding: false, lastTouched: 0 }))
    // Tokens to invalidate stale setTimeout callbacks after interruption
    const rebuildTokens = [0, 0, 0, 0]

    const img = new window.Image()

    // Floor = visible bottom of canvas in canvas coords, so blocks always land on-screen
    const floorY = () => {
      const rect = canvas.getBoundingClientRect()
      const visibleBottom = Math.min(H, Math.max(0, window.innerHeight - rect.top))
      return Math.max(BS * 4, visibleBottom - FLOOR_MARGIN)
    }

    // Pre-reserve a landing slot and return its Y
    const reserveLandY = (bk: Block): number => {
      const slot = colSlot(bk)
      const floor = floorY()
      if (colStack[slot] === undefined) {
        colStack[slot] = floor - BS
      } else {
        colStack[slot] -= BS
      }
      return colStack[slot]
    }

    const buildBlocks = () => {
      W = canvas.width
      H = canvas.height
      if (W <= 0 || H <= 0) return

      const sc = Math.min((W * 0.62) / img.naturalWidth, (H * 0.28) / img.naturalHeight)
      logoW = Math.round(img.naturalWidth * sc)
      logoH = Math.round(img.naturalHeight * sc)
      logoX = Math.round((W - logoW) / 2)
      logoY = Math.round((H - logoH) / 2)

      logoCanvas = document.createElement('canvas')
      logoCanvas.width = W; logoCanvas.height = H
      logoCanvas.getContext('2d')!.drawImage(img, logoX, logoY, logoW, logoH)

      const off = document.createElement('canvas')
      off.width = W; off.height = H
      const octx = off.getContext('2d')!
      octx.drawImage(img, logoX, logoY, logoW, logoH)
      const data = octx.getImageData(0, 0, W, H).data

      const raw: Block[] = []
      for (let py = 0; py < H; py += BS) {
        for (let px = 0; px < W; px += BS) {
          let ra = 0, ga = 0, ba = 0, aa = 0, cnt = 0
          for (let dy = 0; dy < BS && py + dy < H; dy++) {
            for (let dx = 0; dx < BS && px + dx < W; dx++) {
              const i = ((py + dy) * W + (px + dx)) * 4
              ra += data[i]; ga += data[i+1]; ba += data[i+2]; aa += data[i+3]
              cnt++
            }
          }
          const alpha = aa / cnt
          if (alpha < 10) continue
          const r = ra / cnt, g = ga / cnt, b = ba / cnt
          const darkness = (255 - r * 0.299 - g * 0.587 - b * 0.114) * (alpha / 255)
          if (darkness < 55) continue

          const relX = (px - logoX) / logoW
          let letter = 3
          for (let li = 0; li < 4; li++) {
            if (relX >= LETTER_BOUNDS[li] && relX < LETTER_BOUNDS[li + 1]) { letter = li; break }
          }
          raw.push({
            ox: px, oy: py,
            cy: py,
            vy: 0, letter,
            state: S_REST,
            triggerAt: 0, landY: 0,
            riseStartTime: 0, riseFromY: 0,
            color: `rgba(${r | 0},${g | 0},${b | 0},${(alpha / 255).toFixed(3)})`,
          })
        }
      }

      // Remove isolated stray pixels
      const set = new Set(raw.map(bk => `${bk.ox / BS | 0},${bk.oy / BS | 0}`))
      blocks = raw.filter(bk => {
        const gx = bk.ox / BS | 0, gy = bk.oy / BS | 0
        return (
          set.has(`${gx-1},${gy}`) || set.has(`${gx+1},${gy}`) ||
          set.has(`${gx},${gy-1}`) || set.has(`${gx},${gy+1}`)
        )
      })

      colStack = {}
      letterTrans.forEach(lt => { lt.restAlpha = 1.0; lt.restStartAt = 0; lt.everFell = false })
    }

    const resize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w <= 0 || h <= 0) return
      if (w === canvas.width && h === canvas.height) return
      canvas.width = w; canvas.height = h
      buildBlocks()
    }

    const scatter = (mx: number, my: number) => {
      lastMove = Date.now()
      const now = Date.now()
      const r2  = TRIGGER_R * TRIGGER_R

      blocks.forEach(bk => {
        // Interrupt a rising block — knock it back to wait
        if (bk.state === S_RISE) {
          const dx = bk.ox + BS / 2 - mx, dy = bk.cy + BS / 2 - my
          if (dx * dx + dy * dy < r2) {
            bk.state     = S_WAIT
            bk.triggerAt = now + Math.random() * MAX_FALL_DELAY
            ls[bk.letter].lastTouched = now
            rebuildTokens[bk.letter]++        // invalidate pending timeouts
            letterTrans[bk.letter].restAlpha   = 0
            letterTrans[bk.letter].restStartAt = 0
          }
          return
        }

        if (bk.state !== S_REST && bk.state !== S_LAND) return
        const dx = bk.ox + BS / 2 - mx, dy = bk.cy + BS / 2 - my
        if (dx * dx + dy * dy < r2) {
          if (bk.state === S_REST) {
            bk.state     = S_WAIT
            bk.triggerAt = now + Math.random() * MAX_FALL_DELAY
          }
          ls[bk.letter].lastTouched = now
          letterTrans[bk.letter].restAlpha   = 0
          letterTrans[bk.letter].restStartAt = 0
        }
      })
    }

    const startRebuild = (li: number, now: number) => {
      const fallen = blocks.filter(bk => bk.letter === li && bk.state === S_LAND)
      if (fallen.length === 0) return

      // Free only this letter's column slots
      const slots = new Set(fallen.map(bk => colSlot(bk)))
      slots.forEach(slot => delete colStack[slot])

      // Group by home column, sorted left→right
      const colMap = new Map<number, Block[]>()
      for (const bk of fallen) {
        const c = colSlot(bk)
        if (!colMap.has(c)) colMap.set(c, [])
        colMap.get(c)!.push(bk)
      }

      const token = ++rebuildTokens[li]
      const sortedCols = [...colMap.keys()].sort((a, b) => a - b)
      let colDelay = 0
      for (const col of sortedCols) {
        const colBlocks = colMap.get(col)!.sort((a, b) => b.oy - a.oy)
        let blockDelay = 0
        for (const bk of colBlocks) {
          const d = colDelay + blockDelay
          setTimeout(() => {
            if (rebuildTokens[li] !== token) return   // interrupted
            const startY  = floorY() + BS
            bk.cy         = startY
            bk.vy         = 0
            bk.riseFromY  = startY
            bk.riseStartTime = Date.now()
            bk.state      = S_RISE
          }, d)
          blockDelay += BLOCK_STAGGER_MS
        }
        colDelay += COL_DELAY_MS
      }

      ls[li].rebuilding  = true
      ls[li].lastTouched = now
    }

    const tick = () => {
      const now = Date.now()
      ctx.clearRect(0, 0, W, H)

      // Per-letter rebuild eligibility
      for (let li = 0; li < 4; li++) {
        if (ls[li].rebuilding) {
          if (!blocks.some(bk => bk.letter === li && bk.state === S_RISE))
            ls[li].rebuilding = false
          continue
        }
        if (
          blocks.some(bk => bk.letter === li && bk.state === S_LAND) &&
          now - ls[li].lastTouched > REBUILD_IDLE_MS
        ) {
          startRebuild(li, now)
        }
      }

      // Which letters have any non-resting block?
      const tileMode = [false, false, false, false]
      for (const bk of blocks) {
        if (bk.state !== S_REST) tileMode[bk.letter] = true
      }

      // Update per-letter crossfade alpha (ports letterTrans from reference)
      for (let li = 0; li < 4; li++) {
        const lt = letterTrans[li]
        if (tileMode[li]) {
          lt.restAlpha   = 0
          lt.restStartAt = 0
          lt.everFell    = true
        } else if (lt.everFell) {
          if (lt.restStartAt === 0) lt.restStartAt = now
          lt.restAlpha = Math.min(1, (now - lt.restStartAt) / CLEAN_FADE_MS)
        }
        // else: never fell → restAlpha stays 1.0 (clean image shown from start)
      }

      // Physics pass (state updates only, no drawing)
      for (const bk of blocks) {
        if (bk.state === S_WAIT && now >= bk.triggerAt) {
          bk.vy    = 0.4 + Math.random() * 0.6
          bk.landY = reserveLandY(bk)
          bk.state = S_FALL
        }
        if (bk.state === S_FALL) {
          bk.vy += GRAVITY
          bk.cy += bk.vy
          if (bk.cy >= bk.landY) {
            bk.cy  = bk.landY
            bk.vy *= -BOUNCE
            if (Math.abs(bk.vy) < STOP_VY) { bk.vy = 0; bk.state = S_LAND }
          }
        }
        if (bk.state === S_RISE) {
          const t = Math.min((now - bk.riseStartTime) / RISE_DURATION_MS, 1)
          bk.cy = bk.riseFromY + (bk.oy - bk.riseFromY) * easeOutCubic(t)
          if (t >= 1) { bk.cy = bk.oy; bk.state = S_REST }
        }
      }

      // Draw tiles per letter, fading out as restAlpha rises
      for (let li = 0; li < 4; li++) {
        const tileAlpha = 1 - letterTrans[li].restAlpha
        if (tileAlpha <= 0.005) continue
        ctx.save()
        ctx.globalAlpha = tileAlpha
        for (const bk of blocks) {
          if (bk.letter !== li) continue
          ctx.fillStyle = bk.color
          // In motion: live Y; fading to rest: snap to home Y
          ctx.fillRect(bk.ox, tileMode[li] ? bk.cy : bk.oy, BS, BS)
        }
        ctx.restore()
      }

      // Draw clean image per letter, fading in as restAlpha rises
      if (logoCanvas) {
        for (let li = 0; li < 4; li++) {
          const ra = letterTrans[li].restAlpha
          if (ra <= 0.005) continue
          ctx.save()
          ctx.globalAlpha = ra
          const x1 = logoX + Math.round(LETTER_BOUNDS[li] * logoW)
          const x2 = logoX + Math.round(LETTER_BOUNDS[li + 1] * logoW)
          ctx.beginPath()
          ctx.rect(x1 - 1, logoY - 1, x2 - x1 + 2, logoH + 2)
          ctx.clip()
          ctx.drawImage(logoCanvas, 0, 0)
          ctx.restore()
        }
      }

      // Flash transition: fires once all blocks return to rest after having fallen
      const anyNotRest  = blocks.some(bk => bk.state !== S_REST)
      const anyEverFell = letterTrans.some(lt => lt.everFell)
      if (!anyNotRest && prevAnyNotRest && anyEverFell) {
        flashActive  = true
        flashStartAt = now
      }
      prevAnyNotRest = anyNotRest

      if (flashActive) {
        const elapsed = now - flashStartAt
        let alpha = 0
        if (elapsed < FLASH_IN_MS) {
          alpha = elapsed / FLASH_IN_MS
        } else if (elapsed < FLASH_IN_MS + FLASH_OUT_MS) {
          alpha = 1 - (elapsed - FLASH_IN_MS) / FLASH_OUT_MS
        } else {
          flashActive = false
        }
        if (alpha > 0) {
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, W, H)
          ctx.restore()
        }
      }

      animId = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(resize)

    img.onload = () => {
      resize()
      ro.observe(container)

      const toCanvasCoords = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect()
        const sx = canvas.width / rect.width
        const sy = canvas.height / rect.height
        return [(clientX - rect.left) * sx, (clientY - rect.top) * sy] as const
      }

      canvas.addEventListener('mousemove', e => {
        const [cx, cy] = toCanvasCoords(e.clientX, e.clientY)
        scatter(cx, cy)
      })

      let touchStartX = 0, touchStartY = 0

      canvas.addEventListener('touchstart', e => {
        const t = e.touches[0]
        touchStartX = t.clientX
        touchStartY = t.clientY
        const [cx, cy] = toCanvasCoords(t.clientX, t.clientY)
        scatter(cx, cy)
      }, { passive: true })

      canvas.addEventListener('touchmove', e => {
        const t = e.touches[0]
        const dx = Math.abs(t.clientX - touchStartX)
        const dy = Math.abs(t.clientY - touchStartY)
        if (dy > dx) return   // vertical swipe → let page scroll through
        e.preventDefault()
        const [cx, cy] = toCanvasCoords(t.clientX, t.clientY)
        scatter(cx, cy)
      }, { passive: false })

      animId = requestAnimationFrame(tick)
    }

    img.src = '/images/NEXO_transparent.png'

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <section className="relative w-full bg-white h-[250px] md:h-screen">
      <div
        ref={containerRef}
        className="relative w-full h-full"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
        />
      </div>
    </section>
  )
}
