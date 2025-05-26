"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Radio, Users, DollarSign } from "lucide-react"
import { AdvertisingModal } from "@/components/advertising-modal"

export function SchedulePanel() {
  const [view, setView] = useState<"today" | "week" | "advertise">("today")
  const [isAdvertisingModalOpen, setIsAdvertisingModalOpen] = useState(false)

  // Define the schedule with time ranges that can be compared with current time
  const todayScheduleData = [
    { timeStart: "06:00", timeEnd: "09:00", name: "Morning Vibes with AI Alex", type: "music" },
    { timeStart: "09:00", timeEnd: "11:00", name: "Tech Talk with Neural Nancy", type: "talk" },
    { timeStart: "11:00", timeEnd: "14:00", name: "Midday Mix with Digital Dave", type: "music" },
    { timeStart: "14:00", timeEnd: "16:00", name: "Science Hour with Synthetic Sam", type: "talk" },
    { timeStart: "16:00", timeEnd: "19:00", name: "Evening Groove with Virtual Vicky", type: "music" },
    { timeStart: "19:00", timeEnd: "22:00", name: "Night Owl with Algorithmic Andy", type: "music" },
    { timeStart: "22:00", timeEnd: "06:00", name: "Overnight Automation", type: "music" },
  ]
  
  // Function to determine if a show is currently playing
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
      endTimeInMinutes += 24 * 60 // Add 24 hours
      
      // For overnight shows, check if current time is after start time or before end time
      return currentTimeInMinutes >= startTimeInMinutes || 
             currentTimeInMinutes < endTimeInMinutes
    }
    
    // For regular shows, check if current time is between start and end
    return currentTimeInMinutes >= startTimeInMinutes && 
           currentTimeInMinutes < endTimeInMinutes
  }
  
  // Create the schedule with isNow property calculated based on current time
  const todaySchedule = todayScheduleData.map(show => ({
    time: `${show.timeStart} - ${show.timeEnd}`,
    name: show.name,
    type: show.type,
    isNow: isShowPlaying(show.timeStart, show.timeEnd)
  }))

  const weekSchedule = [
    { day: "Monday", shows: ["Morning Vibes", "Tech Talk", "Midday Mix", "Science Hour", "Evening Groove"] },
    { day: "Tuesday", shows: ["Morning Vibes", "Health Chat", "Midday Mix", "Book Club", "Evening Groove"] },
    { day: "Wednesday", shows: ["Morning Vibes", "Tech Talk", "Midday Mix", "Science Hour", "Evening Groove"] },
    { day: "Thursday", shows: ["Morning Vibes", "Finance Talk", "Midday Mix", "History Hour", "Evening Groove"] },
    { day: "Friday", shows: ["Morning Vibes", "Weekend Preview", "Midday Mix", "Movie Reviews", "Party Mix"] },
    { day: "Saturday", shows: ["Weekend Chill", "Sports Talk", "Afternoon Beats", "Saturday Night Party"] },
    { day: "Sunday", shows: ["Sunday Relaxation", "Spiritual Hour", "Family Time", "Week Ahead Preview"] },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView("today")}
          className={`text-sm px-3 py-1 rounded-full ${
            view === "today" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setView("week")}
          className={`text-sm px-3 py-1 rounded-full ${
            view === "week" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setView("advertise")}
          className={`text-sm px-3 py-1 rounded-full ${
            view === "advertise" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          Advertise
        </button>
      </div>

      {view === "today" && (
        <div className="space-y-3">
          {todaySchedule.map((show, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`p-3 rounded-md ${show.isNow ? "bg-[#fff8e1] border border-[#ffd54f]" : "bg-white"} shadow-sm`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-[#333333]">{show.name}</h4>
                  <div className="flex items-center text-sm text-[#666666] mt-1">
                    <Clock size={14} className="mr-1" />
                    <span>{show.time}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {show.type === "music" ? (
                    <div className="flex items-center text-[#2196f3]">
                      <Radio size={16} className="mr-1" />
                      <span className="text-xs">Music</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-[#4caf50]">
                      <Users size={16} className="mr-1" />
                      <span className="text-xs">Talk</span>
                    </div>
                  )}
                </div>
              </div>
              {show.isNow && (
                <div className="mt-1 text-xs bg-[#ffd54f] text-[#5d4037] px-2 py-0.5 rounded-full inline-block">
                  LIVE NOW
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {view === "week" && (
        <div className="space-y-4">
          {weekSchedule.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white rounded-md shadow-sm p-3"
            >
              <h4 className="font-medium text-[#333333] flex items-center">
                <Calendar size={16} className="mr-2" />
                {day.day}
              </h4>
              <div className="mt-2 text-sm text-[#666666]">
                {day.shows.map((show, i) => (
                  <div key={i} className="py-1 border-b border-[#f0f0f0] last:border-0">
                    {show}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {view === "advertise" && (
        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-sm p-4">
            <h4 className="font-medium text-[#333333] flex items-center">
              <DollarSign size={18} className="mr-2 text-[#ff5722]" />
              Advertise on AI Radio
            </h4>
            <p className="mt-2 text-sm text-[#666666]">
              Reach thousands of listeners by advertising your product or service on our shows.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#666666]">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>$50 for a 30-second spot during regular programming</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>2-minute ad breaks during shows</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>3-minute ad breaks between shows</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>AI host will read your script or play your audio</span>
              </li>
            </ul>
            <button
              onClick={() => setIsAdvertisingModalOpen(true)}
              className="mt-4 w-full bg-[#ff5722] text-white py-2 rounded-md hover:bg-[#f4511e] transition-colors"
            >
              Place an Ad ($50)
            </button>
          </div>
        </div>
      )}

      <AdvertisingModal isOpen={isAdvertisingModalOpen} onClose={() => setIsAdvertisingModalOpen(false)} />
    </div>
  )
}
