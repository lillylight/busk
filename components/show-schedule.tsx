"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShowScheduleProps {
  currentShow?: {
    name: string
    type: "music" | "talk"
    color: string
  }
}

export function ShowSchedule({ currentShow }: ShowScheduleProps) {
  const [hoveredShow, setHoveredShow] = useState<number | null>(null)

  // Function to determine if a show is currently playing based on time range
  const isShowPlaying = (timeStart: string, timeEnd: string) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Convert time strings to hours and minutes
    const [startHour, startMinute] = timeStart.split(":").map(Number)
    const [endHour, endMinute] = timeEnd.split(":").map(Number)
    
    // Convert to minutes since midnight for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    const startTimeInMinutes = startHour * 60 + startMinute
    let endTimeInMinutes = endHour * 60 + endMinute
    
    // Handle overnight shows (e.g., 22:00 - 06:00)
    if (endTimeInMinutes < startTimeInMinutes) {
      // For overnight shows, check if current time is after start time or before end time
      return currentTimeInMinutes >= startTimeInMinutes || 
             currentTimeInMinutes < (endHour * 60 + endMinute)
    }
    
    // For regular shows, check if current time is between start and end
    return currentTimeInMinutes >= startTimeInMinutes && 
           currentTimeInMinutes < endTimeInMinutes
  }

  // Always show the current show at the top if defined and present in the schedule
  let schedule = [
    {
      time: "06:00 - 09:00",
      timeStart: "06:00",
      timeEnd: "09:00",
      name: "Morning Vibes with AI Alex",
      type: "music" as const,
      description: "Start your day with upbeat tunes and positive energy",
      isNow: isShowPlaying("06:00", "09:00") || currentShow?.name === "Morning Vibes with AI Alex",
      color: "from-purple-600 to-pink-600",
    },
    {
      time: "09:00 - 11:00",
      timeStart: "09:00",
      timeEnd: "11:00",
      name: "Tech Talk with Neural Nancy",
      type: "talk" as const,
      description: "Discussing the latest in technology and AI advancements",
      isNow: isShowPlaying("09:00", "11:00") || currentShow?.name === "Tech Talk with Neural Nancy",
      color: "from-blue-600 to-cyan-600",
    },
    {
      time: "11:00 - 14:00",
      timeStart: "11:00",
      timeEnd: "14:00",
      name: "Midday Mix with Digital Dave",
      type: "music" as const,
      description: "A blend of contemporary hits and classic favorites",
      isNow: isShowPlaying("11:00", "14:00") || currentShow?.name === "Midday Mix with Digital Dave",
      color: "from-purple-600 to-pink-600",
    },
    {
      time: "14:00 - 16:00",
      timeStart: "14:00",
      timeEnd: "16:00",
      name: "Science Hour with Synthetic Sam",
      type: "talk" as const,
      description: "Exploring fascinating scientific discoveries and theories",
      isNow: isShowPlaying("14:00", "16:00") || currentShow?.name === "Science Hour with Synthetic Sam",
      color: "from-emerald-600 to-teal-600",
    },
    {
      time: "16:00 - 19:00",
      timeStart: "16:00",
      timeEnd: "19:00",
      name: "Evening Groove with Virtual Vicky",
      type: "music" as const,
      description: "Smooth transitions into your evening with relaxing beats",
      isNow: isShowPlaying("16:00", "19:00") || currentShow?.name === "Evening Groove with Virtual Vicky",
      color: "from-purple-600 to-pink-600",
    },
    {
      time: "19:00 - 22:00",
      timeStart: "19:00",
      timeEnd: "22:00",
      name: "Night Owl with Algorithmic Andy",
      type: "music" as const,
      description: "Late night vibes and chill electronic music",
      isNow: isShowPlaying("19:00", "22:00") || currentShow?.name === "Night Owl with Algorithmic Andy",
      color: "from-purple-600 to-pink-600",
    },
    {
      time: "22:00 - 06:00",
      timeStart: "22:00",
      timeEnd: "06:00",
      name: "Overnight Automation",
      type: "music" as const,
      description: "AI-curated playlist to keep you company through the night",
      isNow: isShowPlaying("22:00", "06:00") || currentShow?.name === "Overnight Automation",
      color: "from-purple-600 to-pink-600",
    },
  ];

  if (currentShow) {
    const idx = schedule.findIndex(show => show.name === currentShow.name);
    if (idx > 0) {
      // Move the current show to the top
      const [current] = schedule.splice(idx, 1);
      schedule = [current, ...schedule];
    }
  }

  return (
    <Card className="border-0 bg-zinc-900/50 backdrop-blur-lg shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          24/7 Show Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedule.map((show, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredShow(index)}
              onMouseLeave={() => setHoveredShow(null)}
              className={cn(
                "p-3 rounded-lg border transition-all duration-200",
                show.isNow
                  ? "border-transparent bg-gradient-to-r shadow-lg"
                  : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50",
                show.isNow && show.color,
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center text-zinc-100">
                    {show.name}
                    {show.isNow && <Badge className="ml-2 bg-white/20 text-white">LIVE NOW</Badge>}
                  </h3>
                  <p className="text-sm text-zinc-400 flex items-center mt-1">
                    <Clock className="mr-1 h-3 w-3" /> {show.time}
                  </p>
                  <p className="text-sm mt-2 text-zinc-300">{show.description}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center",
                    show.type === "music"
                      ? "bg-purple-900/30 text-purple-300 border-purple-800"
                      : "bg-emerald-900/30 text-emerald-300 border-emerald-800",
                  )}
                >
                  {show.type === "music" ? (
                    <>
                      <Radio className="mr-1 h-3 w-3" /> Music
                    </>
                  ) : (
                    <>
                      <Users className="mr-1 h-3 w-3" /> Talk Show
                    </>
                  )}
                </Badge>
              </div>

              {hoveredShow === index && !show.isNow && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-0.5 mt-3 bg-gradient-to-r",
                    show.type === "music" ? "from-purple-600 to-pink-600" : "from-emerald-600 to-teal-600",
                  )}
                />
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
