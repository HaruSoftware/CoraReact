import { useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContextValue'
import './NetworkBackground.css'

type Point = { x: number; y: number; vx: number; vy: number }

function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const drawingCanvas: HTMLCanvasElement = canvas
    const context = drawingCanvas.getContext('2d')
    if (!context) return
    const drawingContext: CanvasRenderingContext2D = context

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: -1000, y: -1000 }
    let points: Point[] = []
    let animationFrame = 0

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      drawingCanvas.width = window.innerWidth * pixelRatio
      drawingCanvas.height = window.innerHeight * pixelRatio
      drawingCanvas.style.width = `${window.innerWidth}px`
      drawingCanvas.style.height = `${window.innerHeight}px`
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const count = Math.min(90, Math.max(34, Math.round((window.innerWidth * window.innerHeight) / 18000)))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: reducedMotion ? 0 : (Math.random() - 0.5) * 0.32,
        vy: reducedMotion ? 0 : (Math.random() - 0.5) * 0.32,
      }))
      draw()
    }

    function draw() {
      const width = window.innerWidth
      const height = window.innerHeight
      const isDark = resolvedTheme === 'dark'
      const pointColor = isDark ? '145, 208, 190' : '28, 112, 94'
      drawingContext.clearRect(0, 0, width, height)

      points.forEach((point, index) => {
        if (!reducedMotion) {
          const dx = pointer.x - point.x
          const dy = pointer.y - point.y
          const distance = Math.hypot(dx, dy)
          if (distance < 150 && distance > 0) {
            point.vx += (dx / distance) * 0.006
            point.vy += (dy / distance) * 0.006
          }
          point.vx = Math.max(-0.55, Math.min(0.55, point.vx * 0.995))
          point.vy = Math.max(-0.55, Math.min(0.55, point.vy * 0.995))
          point.x += point.vx
          point.y += point.vy
          if (point.x < 0 || point.x > width) point.vx *= -1
          if (point.y < 0 || point.y > height) point.vy *= -1
        }

        drawingContext.beginPath()
        drawingContext.arc(point.x, point.y, isDark ? 1.6 : 1.25, 0, Math.PI * 2)
        drawingContext.fillStyle = `rgba(${pointColor}, ${isDark ? 0.55 : 0.35})`
        drawingContext.fill()

        for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
          const other = points[otherIndex]
          const distance = Math.hypot(point.x - other.x, point.y - other.y)
          if (distance > 135) continue
          drawingContext.beginPath()
          drawingContext.moveTo(point.x, point.y)
          drawingContext.lineTo(other.x, other.y)
          drawingContext.strokeStyle = `rgba(${pointColor}, ${(1 - distance / 135) * (isDark ? 0.19 : 0.12)})`
          drawingContext.lineWidth = 0.7
          drawingContext.stroke()
        }
      })

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw)
    }

    function acompanharPonteiro(event: PointerEvent) {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', acompanharPonteiro, { passive: true })
    resize()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', acompanharPonteiro)
    }
  }, [resolvedTheme])

  return <canvas ref={canvasRef} className="network-background" aria-hidden="true" />
}

export default NetworkBackground