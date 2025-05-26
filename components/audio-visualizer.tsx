"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface AudioVisualizerProps {
  isPlaying: boolean
  showType: "music" | "talk"
}

export function AudioVisualizer({ isPlaying, showType }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const barCount = showType === "music" ? 70 : 40

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

    // Animation variables
    let bars: number[] = Array(barCount).fill(0)
    let targetBars: number[] = Array(barCount).fill(0)

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update bar heights
      if (isPlaying) {
        targetBars = targetBars.map(() => {
          if (showType === "music") {
            // More dynamic for music
            return Math.random() * 0.8 + 0.2
          } else {
            // More subtle for talk shows
            return Math.random() * 0.4 + 0.1
          }
        })
      } else {
        targetBars = targetBars.map(() => 0.05)
      }

      // Smooth transition to target heights
      bars = bars.map((bar, i) => {
        return bar + (targetBars[i] - bar) * 0.1
      })

      // Draw bars
      const barWidth = canvas.width / barCount
      const barMargin = showType === "music" ? 2 : 1
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)

      if (showType === "music") {
        gradient.addColorStop(0, "rgba(147, 51, 234, 0.2)")
        gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.5)")
        gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)")
      } else {
        gradient.addColorStop(0, "rgba(45, 212, 191, 0.2)")
        gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.5)")
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.8)")
      }

      ctx.fillStyle = gradient

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth
        const height = bars[i] * canvas.height
        const y = canvas.height - height

        // Round the top of the bars
        const radius = barWidth / 2 - barMargin

        ctx.beginPath()
        ctx.moveTo(x + barMargin, y + radius)
        ctx.lineTo(x + barMargin, y + height - radius)
        ctx.arcTo(x + barMargin, y + height, x + barMargin + radius, y + height, radius)
        ctx.lineTo(x + barWidth - barMargin - radius, y + height)
        ctx.arcTo(x + barWidth - barMargin, y + height, x + barWidth - barMargin, y + height - radius, radius)
        ctx.lineTo(x + barWidth - barMargin, y + radius)
        ctx.arcTo(x + barWidth - barMargin, y, x + barWidth - barMargin - radius, y, radius)
        ctx.lineTo(x + barMargin + radius, y)
        ctx.arcTo(x + barMargin, y, x + barMargin, y + radius, radius)
        ctx.fill()
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate)
    } else {
      // Draw minimal bars when paused
      bars = Array(barCount).fill(0.05)
      animate()
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      window.removeEventListener("resize", resize)
    }
  }, [isPlaying, showType, barCount])

  return (
    <div className="w-full h-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPlaying ? 1 : 0.3 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <canvas ref={canvasRef} className="w-full h-full" style={{ filter: "blur(1px)" }} />
      </motion.div>
    </div>
  )
}
