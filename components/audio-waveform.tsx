"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface AudioWaveformProps {
  isPlaying: boolean
  color?: string
}

export function AudioWaveform({ isPlaying, color = "#ff5722" }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }

    resize()
    window.addEventListener("resize", resize)

    // Number of bars
    const barCount = 27

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw bars
      const barWidth = canvas.width / barCount
      const barMargin = 2 * window.devicePixelRatio

      for (let i = 0; i < barCount; i++) {
        // Generate random height for each bar if playing
        const heightPercent = isPlaying
          ? Math.random() * 0.8 + 0.2 // Between 20% and 100% when playing
          : 0.1 // Small fixed height when paused

        const height = canvas.height * heightPercent
        const x = i * barWidth
        const y = (canvas.height - height) / 2

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, `${color}80`) // Semi-transparent at top
        gradient.addColorStop(0.5, color) // Full color in middle
        gradient.addColorStop(1, `${color}80`) // Semi-transparent at bottom

        ctx.fillStyle = gradient

        // Draw rounded bar
        const radius = Math.min(barWidth / 2 - barMargin, height / 2)

        ctx.beginPath()
        ctx.moveTo(x + barMargin + radius, y)
        ctx.lineTo(x + barWidth - barMargin - radius, y)
        ctx.arcTo(x + barWidth - barMargin, y, x + barWidth - barMargin, y + radius, radius)
        ctx.lineTo(x + barWidth - barMargin, y + height - radius)
        ctx.arcTo(x + barWidth - barMargin, y + height, x + barWidth - barMargin - radius, y + height, radius)
        ctx.lineTo(x + barMargin + radius, y + height)
        ctx.arcTo(x + barMargin, y + height, x + barMargin, y + height - radius, radius)
        ctx.lineTo(x + barMargin, y + radius)
        ctx.arcTo(x + barMargin, y, x + barMargin + radius, y, radius)
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", resize)
    }
  }, [isPlaying, color])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-8">
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  )
}
