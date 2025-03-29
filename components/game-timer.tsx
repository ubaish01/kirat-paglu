"use client"

import { useState, useEffect } from "react"

type GameTimerProps = {
  startTime: number
}

export function GameTimer({ startTime }: GameTimerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTime
      setCurrentTime(elapsed)
    }, 100) // Update every 100ms for smoother display

    return () => clearInterval(interval)
  }, [startTime])

  // Format time in minutes and seconds
  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((timeInMs % 1000) / 10)

    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="absolute top-4 left-4 z-20 bg-black/70 text-white px-4 py-2 rounded-md font-mono">
      <div className="text-xl">{formatTime(currentTime)}</div>
    </div>
  )
}

