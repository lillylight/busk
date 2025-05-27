"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Share2 } from "lucide-react"
import { CoverArt } from "@/components/cover-art"
import { RequestsPanel } from "@/components/requests-panel"
import { SchedulePanel } from "@/components/schedule-panel"
import { AboutPanel } from "@/components/about-panel"
import { AudioWaveform } from "@/components/audio-waveform"
import { useToast } from "@/hooks/use-toast"
import { generateHostDialogue } from "@/lib/ai-dialogue"
import { WebRTCClient } from "@/lib/webrtc-client"
import audioService from "@/lib/audio-service"

export function RadioStation() {
  // Track last show name to detect show changes and trigger DJ intro
  const lastShowNameRef = useRef<string>("")
  // Track songs played in the last 20 minutes
  const recentSongsRef = useRef<Array<{title: string, artist: string}>>([])
  // Track when we last did commentary
  const lastCommentaryTimeRef = useRef<number>(Date.now())

  // (REMOVED DUPLICATE songCountRef BELOW, DO NOT REDECLARE)

  // Initialize with a placeholder that will be immediately updated
  const [currentShow, setCurrentShow] = useState({
    name: "Loading...",
    host: "Loading...",
    type: "music" as "music" | "talk",
    description: "Loading show information...",
    isLive: true,
    voiceProfile: "echo" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
    color: "from-[#607d8b] to-[#90a4ae]",
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [listeners, setListeners] = useState(142)
  const [activeTab, setActiveTab] = useState("requests")
  const [hostDialogue, setHostDialogue] = useState("")
  const { toast } = useToast()
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  // (REMOVED DUPLICATE songCountRef HERE)
  const [isSongGenerating, setIsSongGenerating] = useState(false)
  const [songInfo, setSongInfo] = useState({
    title: "",
    artist: "",
    requestedBy: "",
  })

  // Initialize audio element
  useEffect(() => {
    audioService.initialize()

    // Set up audio element for AI voice
    audioElementRef.current = document.createElement("audio")
    audioElementRef.current.autoplay = true
    document.body.appendChild(audioElementRef.current)

    return () => {
      audioService.cleanup()
      if (audioElementRef.current) {
        document.body.removeChild(audioElementRef.current)
      }
    }
  }, [])

  // Listen for metadata updates and track songs
  useEffect(() => {
    let lastSongId = ""
    
    const handleMetadataUpdate = (metadata: any) => {
      const currentSongId = `${metadata.title}-${metadata.artist}`
      
      setSongInfo({
        title: metadata.title || "Unknown Track",
        artist: metadata.artist || "Unknown Artist",
        requestedBy: "",
      })

      // Track unique songs for music shows
      if (currentShow.type === "music" && currentShow.name !== "Loading...") {
        if (currentSongId !== lastSongId && metadata.title !== "Unknown Track") {
          lastSongId = currentSongId
          
          // Add to recent songs list
          recentSongsRef.current.push({
            title: metadata.title,
            artist: metadata.artist
          })
          
          // Keep only last 10 songs
          if (recentSongsRef.current.length > 10) {
            recentSongsRef.current.shift()
          }
          
          console.log(`New song: "${metadata.title}" by ${metadata.artist}`)
          
          // Check if 20 minutes have passed since last commentary
          const now = Date.now()
          const timeSinceLastCommentary = now - lastCommentaryTimeRef.current
          
          if (timeSinceLastCommentary >= 20 * 60 * 1000) { // 20 minutes
            generateDJCommentary()
            lastCommentaryTimeRef.current = now
          }
        }
      }
    }

    audioService.onMetadataUpdate(handleMetadataUpdate)
  }, [currentShow])

  // Generate DJ commentary after 20 minutes
  const generateDJCommentary = async () => {
    try {
      // Get current time for schedule context
      const now = new Date()
      const currentHour = now.getHours()
      const timeOfDay = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : currentHour < 21 ? "evening" : "night"
      
      // Get recent songs to mention - ensure no duplicates
      const recentSongs = recentSongsRef.current.slice(-3) // Last 3 songs
      const uniqueSongs = Array.from(new Map(recentSongs.map(s => [`${s.title}-${s.artist}`, s])).values())
      const songList = uniqueSongs.map(s => `"${s.title}" by ${s.artist}`).join(", ")
      
      // Create contextual commentary based on show type and time
      let commentaryOptions = []
      
      // Special cool DJ vibe for One Eyed Goat
      if (currentShow.host === "One Eyed Goat") {
        commentaryOptions = [
          `Yo, yo, yo! This is the One Eyed Goat keeping you company through the ${timeOfDay}. We've been vibing to some fire tracks including ${songList}. Man, this playlist hits different when the city's quiet, you feel me? Keep it locked to ${currentShow.name}!`,
          `What's good, night owls? One Eyed Goat here on BUSK Radio. The last 20 minutes have been straight heat with tracks like ${songList}. If you're still up grinding or just chilling, I got you covered all ${timeOfDay} long. Hit me up with those shoutouts!`,
          `Ayy, this is your boy One Eyed Goat on the late night tip. We've been blessing your speakers with ${songList} and more. That's what I'm talking about! We're keeping it smooth and steady here on ${currentShow.name}. Don't sleep on us, fam!`
        ]
      } else {
        commentaryOptions = [
          `This is ${currentShow.host} on ${currentShow.name} here at BUSK Radio. Over the past 20 minutes, we've enjoyed some incredible tracks including ${songList}. The production quality has been absolutely stellar. We're keeping the ${timeOfDay} vibes going strong!`,
          `You're listening to ${currentShow.name} with me, ${currentShow.host}, right here on BUSK Radio. We've had an amazing set featuring ${songList}. Each track perfectly captures the ${timeOfDay} mood. Stay tuned, we've got more great music coming up!`,
          `${currentShow.host} here on BUSK Radio's ${currentShow.name}. The last 20 minutes have been a musical journey with ${songList} and more. These tracks really capture that ${currentShow.type === "music" ? "musical energy" : "creative spirit"} we love to share with you. Remember, you can always send in your shoutouts and requests!`
        ]
      }
      
      // Pick a random commentary style
      const djCommentary = commentaryOptions[Math.floor(Math.random() * commentaryOptions.length)]
      
      setHostDialogue(djCommentary)
      
      // Clear the dialogue after 30 seconds
      setTimeout(() => {
        setHostDialogue("")
      }, 30000)
      
      // Use TTS for DJ commentary (broadcast to all) - this should take about 30 seconds
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: djCommentary,
          voice: currentShow.voiceProfile || 'echo',
          model: 'gpt-4o-mini-tts', // Use new model with custom voice instructions
          speed: 0.95, // Natural speaking pace
        }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        
        // Play the commentary
        await audio.play();
        
        // Clean up after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (error) {
      console.error("Error generating DJ commentary:", error)
    }
  }

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      // Only generate welcome message if we have a real show loaded (not "Loading...")
      if (!hostDialogue && currentShow.name !== "Loading...") {
        generateWelcomeMessage()
      }

      audioService.play().catch((error) => {
        console.error("Audio playback error:", error)
        toast({
          title: "Playback Error",
          description: "Could not play audio. Please try again.",
          variant: "destructive",
        })
        setIsPlaying(false)
      })
    } else {
      audioService.pause()
    }
  }, [isPlaying, currentShow.name])

  // Generate welcome message ONLY when a new show starts
  const generateWelcomeMessage = async () => {
    try {
      const welcomeMessage = `Welcome to BUSK Radio! You're listening to ${currentShow.name}. I'm your host ${currentShow.host}, and we've got some amazing music lined up for you today. Stay tuned!`
      
      setHostDialogue(welcomeMessage)
      
      // Clear the welcome message after 15 seconds
      setTimeout(() => {
        setHostDialogue("")
      }, 15000)
      
      // Use TTS for welcome message (same as DJ commentary)
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: welcomeMessage,
          voice: currentShow.voiceProfile || 'echo',
          model: 'gpt-4o-mini-tts', // Use new model with custom voice instructions
          speed: 0.95,
        }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        
        // Play the welcome message
        await audio.play();
        
        // Clean up after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
      
      // Reset commentary timer for new show
      lastCommentaryTimeRef.current = Date.now()
      recentSongsRef.current = []
    } catch (error) {
      console.error("Error generating welcome message:", error)
      // Reset commentary timer for new show even on error
      lastCommentaryTimeRef.current = Date.now()
      recentSongsRef.current = []
    }
  }

  // Update show based on current time - moved outside to be accessible
  const updateShowBasedOnTime = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Define all shows with their time slots
    const shows = [
      {
        name: "Morning Vibes with AI Alex",
        host: "AI Alex",
        type: "music" as "music" | "talk",
        description: "Start your day with upbeat tunes and positive energy",
        isLive: true,
        voiceProfile: "nova" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#ff5722] to-[#ff7043]",
        startTime: 6 * 60, // 06:00
        endTime: 9 * 60, // 09:00
      },
      {
        name: "Tech Talk with Neural Nancy",
        host: "Neural Nancy & Tech Tim",
        type: "talk" as "music" | "talk",
        description: "Discussing the latest in technology and AI advancements",
        isLive: true,
        voiceProfile: "shimmer" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#2196f3] to-[#42a5f5]",
        startTime: 9 * 60, // 09:00
        endTime: 11 * 60, // 11:00
      },
      {
        name: "Midday Mix with Digital Dave",
        host: "Digital Dave",
        type: "music" as "music" | "talk",
        description: "A blend of contemporary hits and classic favorites",
        isLive: true,
        voiceProfile: "alloy" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#ff9800] to-[#ffb74d]",
        startTime: 11 * 60, // 11:00
        endTime: 14 * 60, // 14:00
      },
      {
        name: "Science Hour with Synthetic Sam",
        host: "Synthetic Sam & Dr. Data",
        type: "talk" as "music" | "talk",
        description: "Exploring fascinating scientific discoveries with expert guests",
        isLive: true,
        voiceProfile: "onyx" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#4caf50] to-[#66bb6a]",
        startTime: 14 * 60, // 14:00
        endTime: 16 * 60, // 16:00
      },
      {
        name: "Evening Groove with Virtual Vicky",
        host: "Virtual Vicky",
        type: "music" as "music" | "talk",
        description: "Smooth transitions into your evening with relaxing beats",
        isLive: true,
        voiceProfile: "nova" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#9c27b0] to-[#ba68c8]",
        startTime: 16 * 60, // 16:00
        endTime: 19 * 60, // 19:00
      },
      {
        name: "Night Owl with Algorithmic Andy",
        host: "Algorithmic Andy",
        type: "music" as "music" | "talk",
        description: "Late night vibes and chill electronic music",
        isLive: true,
        voiceProfile: "echo" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx",
        color: "from-[#3f51b5] to-[#7986cb]",
        startTime: 19 * 60, // 19:00
        endTime: 22 * 60, // 22:00
      },
      {
        name: "Overnight Automation",
        host: "One Eyed Goat",
        type: "music" as "music" | "talk",
        description: "AI-curated playlist to keep you company through the night",
        isLive: true,
        voiceProfile: "onyx" as "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx", // Onyx is a deep male voice
        color: "from-[#607d8b] to-[#90a4ae]",
        startTime: 22 * 60, // 22:00
        endTime: 6 * 60, // 06:00 (next day)
      },
    ]

    // Find the current show based on time
    let currentShowBasedOnTime = shows[shows.length - 1] // Default to overnight show

    for (const show of shows) {
      if (show.startTime <= show.endTime) {
        // Regular time slot (e.g., 9:00-11:00)
        if (currentTimeInMinutes >= show.startTime && currentTimeInMinutes < show.endTime) {
          currentShowBasedOnTime = show
          break
        }
      } else {
        // Overnight time slot (e.g., 22:00-06:00)
        if (currentTimeInMinutes >= show.startTime || currentTimeInMinutes < show.endTime) {
          currentShowBasedOnTime = show
          break
        }
      }
    }

    // Update the show
    setCurrentShow(currentShowBasedOnTime)
  }

  // Initialize show based on current time immediately
  useEffect(() => {
    updateShowBasedOnTime()
  }, [])

  useEffect(() => {
    // Simulate fluctuating listener count
    const interval = setInterval(() => {
      setListeners((prev) => Math.max(100, prev + Math.floor(Math.random() * 11) - 5))
    }, 5000)

    // Update show every minute to check for schedule changes
    const showInterval = setInterval(updateShowBasedOnTime, 60000) // Check every minute

    // On show change, trigger DJ intro ONLY if new show
    if (currentShow.name !== lastShowNameRef.current && currentShow.name !== "Loading...") {
      if (isPlaying) {
        generateWelcomeMessage()
      }
      lastShowNameRef.current = currentShow.name
    }

    return () => {
      clearInterval(interval)
      clearInterval(showInterval)
    }
  }, [isPlaying, currentShow.name, toast])

  // Generate host dialogue periodically

  // Add a function to handle request success
  const handleRequestSuccess = async (requestType: string, message: string, userName: string, userLocation?: string) => {
    try {
      // Import WebRTCSession
      const { WebRTCSession } = await import('@/lib/webrtc-session')
      const session = new WebRTCSession()

      if (requestType === "callIn" && userLocation) {
        // Handle call-in with real-time interaction
        // Parse duration from message (if provided)
        const duration = message ? parseInt(message) : 30
        await session.startCallIn(userName, userLocation, currentShow.voiceProfile, currentShow.name, duration, currentShow.host)
        
        toast({
          title: "Call Connected",
          description: "You're now live on air!",
          duration: 3000,
        })
      } else if (requestType === "shoutout") {
        // Handle shoutout with TTS
        await session.triggerResponse(message, true, false, userName)
        
        toast({
          title: "Shoutout Queued",
          description: "Your shoutout will be read on air shortly!",
          duration: 5000,
        })
      } else {
        // Handle other request types
        const responseMessage = `Request from ${userName}: ${message}`
        await session.triggerResponse(responseMessage, false, false, userName)
        
        toast({
          title: "Request Submitted",
          description: "Your request has been processed!",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error processing request:", error)
      toast({
        title: "Request Error",
        description: "There was an error processing your request.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "BUSK.Radio",
          text: `I'm listening to ${currentShow.name} on BUSK.Radio!`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing:", error))
    } else {
      toast({
        title: "Share",
        description: "Copy this link to share: " + window.location.href,
        duration: 5000,
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CoverArt
          currentShow={currentShow}
          isPlaying={isPlaying}
          hostDialogue={hostDialogue}
          listeners={listeners}
          isSongGenerating={isSongGenerating}
        />

        <div className="space-y-6">
          <div className="border-b border-[#e0e0e0] pb-2">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("requests")}
                className={`text-sm uppercase tracking-wider ${
                  activeTab === "requests" ? "text-[#333333] font-medium" : "text-[#999999]"
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`text-sm uppercase tracking-wider ${
                  activeTab === "schedule" ? "text-[#333333] font-medium" : "text-[#999999]"
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`text-sm uppercase tracking-wider ${
                  activeTab === "about" ? "text-[#333333] font-medium" : "text-[#999999]"
                }`}
              >
                About
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-[400px] overflow-y-auto"
            >
              {activeTab === "requests" && (
                <RequestsPanel currentShow={currentShow} onRequestSuccess={handleRequestSuccess} />
              )}
              {activeTab === "schedule" && <SchedulePanel />}
              {activeTab === "about" && <AboutPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-md shadow-sm">
        {/* Improved time display */}

        {/* Center section with waveform and song/show info */}
        <div className="flex-1 mx-6">
          {/* Show title or song info based on show type */}
          {currentShow.type === "music" ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#333333]">{songInfo.title}</h3>
                  <p className="text-sm text-[#666666]">{songInfo.artist}</p>
                </div>
              </div>
              {/* Audio waveform visualization */}
              {isPlaying && <AudioWaveform isPlaying={isPlaying} color="#ff5722" />}
            </div>
          ) : (
            <div className="space-y-1">
              <div>
                <h3 className="font-medium text-[#333333]">{currentShow.name}</h3>
                <p className="text-sm text-[#666666]">with {currentShow.host}</p>
              </div>
              {/* Audio waveform visualization */}
              {isPlaying && <AudioWaveform isPlaying={isPlaying} color="#2196f3" />}
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-[#ff5722] hover:bg-[#f4511e] text-white flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-[#333333] hover:bg-[#222222] text-white flex items-center justify-center transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
