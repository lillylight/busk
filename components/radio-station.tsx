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
  // Track how many songs have played in this show for DJ commentary
  const songCountRef = useRef<number>(0)
  // Track after how many songs the DJ should speak (randomized to 4 or 5 for realism)
  const songAnnounceThresholdRef = useRef<number>(Math.floor(Math.random() * 2) + 4)
  // Track last show name to detect show changes and trigger DJ intro
  const lastShowNameRef = useRef<string>("")

  // (REMOVED DUPLICATE songCountRef BELOW, DO NOT REDECLARE)

  const [currentShow, setCurrentShow] = useState({
    name: "Morning Vibes with AI Alex",
    host: "AI Alex",
    type: "music" as "music" | "talk",
    description: "Start your day with upbeat tunes and positive energy",
    isLive: true,
    voiceProfile: "echo" as "echo" | "shimmer" | "sage", // Default voice profile
    color: "from-[#ff5722] to-[#ff7043]",
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [listeners, setListeners] = useState(142)
  const [activeTab, setActiveTab] = useState("requests")
  const [hostDialogue, setHostDialogue] = useState("")
  const { toast } = useToast()
  const webrtcClient = useRef<WebRTCClient | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  // (REMOVED DUPLICATE songCountRef HERE)
  const [isSongGenerating, setIsSongGenerating] = useState(false)
  const [songInfo, setSongInfo] = useState({
    title: "",
    artist: "",
    requestedBy: "",
  })

  // Initialize audio element and WebRTC client
  useEffect(() => {
    audioService.initialize()
    webrtcClient.current = new WebRTCClient()

    // Set up audio element for AI voice
    audioElementRef.current = document.createElement("audio")
    audioElementRef.current.autoplay = true
    document.body.appendChild(audioElementRef.current)

    return () => {
      audioService.cleanup()
      if (webrtcClient.current) {
        webrtcClient.current.close()
      }
      if (audioElementRef.current) {
        document.body.removeChild(audioElementRef.current)
      }
    }
  }, [])

  // Listen for metadata updates and trigger DJ only after 4-5 songs
  useEffect(() => {
    const handleMetadataUpdate = (metadata: any) => {
      setSongInfo({
        title: metadata.title || "Unknown Track",
        artist: metadata.artist || "Unknown Artist",
        requestedBy: "",
      })

      // Count songs played in this show
      songCountRef.current += 1
      // DJ speaks only after every 4 or 5 songs (randomize for realism, but always between 4-5)
      if (
        (songCountRef.current >= songAnnounceThresholdRef.current) &&
        currentShow.type === "music"
      ) {
        generateDJCommentary(metadata)
        songCountRef.current = 0
        // Randomize next threshold to 4 or 5
        songAnnounceThresholdRef.current = Math.floor(Math.random() * 2) + 4
      }
    }

    audioService.onMetadataUpdate(handleMetadataUpdate)
  }, [currentShow.type])

  // Generate DJ commentary after 4-5 songs
  const generateDJCommentary = async (metadata: any) => {
    try {
      if (!webrtcClient.current) {
        webrtcClient.current = new WebRTCClient()
      }

      await webrtcClient.current.initialize(currentShow.voiceProfile)

      webrtcClient.current.onTrack((event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0]
        }
      })

      const message = `You just heard "${metadata.title}" by ${metadata.artist}. Here's an interesting fact about this style of music before we continue with more great tracks.`
      webrtcClient.current.sendMessage(message)

      setHostDialogue(message)
    } catch (error) {
      console.error("Error generating DJ commentary:", error)
    }
  }

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      // Generate welcome message when starting playback
      if (!hostDialogue) {
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
  }, [isPlaying])

  // Generate welcome message ONLY when a new show starts
  const generateWelcomeMessage = async () => {
    try {
      if (!webrtcClient.current) {
        webrtcClient.current = new WebRTCClient()
      }

      await webrtcClient.current.initialize(currentShow.voiceProfile)

      webrtcClient.current.onTrack((event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0]
        }
      })

      const welcomeMessage = `Welcome to BUSK.Radio! You're listening to ${currentShow.name}. I'm your host ${currentShow.host}, and we've got some amazing music lined up for you today. Stay tuned!`
      webrtcClient.current.sendMessage(welcomeMessage)

      setHostDialogue(welcomeMessage)
      // Reset song counter and threshold for new show
      songCountRef.current = 0
      songAnnounceThresholdRef.current = Math.floor(Math.random() * 2) + 4
    } catch (error) {
      console.error("Error generating welcome message:", error)

      // Fallback to text-based dialogue
      const welcome = await generateHostDialogue({
        showType: currentShow.type,
        hostName: currentShow.host.split("&")[0].trim(),
        personality: "energetic",
        voiceProfile: currentShow.voiceProfile,
        context: `Current show: ${currentShow.name}. This is a welcome message for a new listener.`,
      })

      if (welcome && welcome.trim().length > 0) {
        setHostDialogue(welcome)
      }
      // Reset song counter and threshold for new show
      songCountRef.current = 0
      songAnnounceThresholdRef.current = Math.floor(Math.random() * 2) + 4
    }
  }

  useEffect(() => {
    // Simulate fluctuating listener count
    const interval = setInterval(() => {
      setListeners((prev) => Math.max(100, prev + Math.floor(Math.random() * 11) - 5))
    }, 5000)

    // Update show based on current time
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
          voiceProfile: "echo" as "echo" | "shimmer" | "sage",
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
          voiceProfile: "shimmer" as "echo" | "shimmer" | "sage",
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
          voiceProfile: "echo" as "echo" | "shimmer" | "sage",
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
          voiceProfile: "sage" as "echo" | "shimmer" | "sage",
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
          voiceProfile: "shimmer" as "echo" | "shimmer" | "sage",
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
          voiceProfile: "echo" as "echo" | "shimmer" | "sage",
          color: "from-[#3f51b5] to-[#7986cb]",
          startTime: 19 * 60, // 19:00
          endTime: 22 * 60, // 22:00
        },
        {
          name: "Overnight Automation",
          host: "AI DJ",
          type: "music" as "music" | "talk",
          description: "AI-curated playlist to keep you company through the night",
          isLive: true,
          voiceProfile: "echo" as "echo" | "shimmer" | "sage",
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

      // Only update if it's a different show
      if (currentShowBasedOnTime.name !== currentShow.name) {
        setCurrentShow(currentShowBasedOnTime)

        if (isPlaying) {
          toast({
            title: "Show Changed",
            description: `Now playing: ${currentShowBasedOnTime.name}`,
            duration: 5000,
          })
        }
      }
    }

    // Initial update based on current time
    updateShowBasedOnTime()

    // Update show every minute to check for schedule changes
    const showInterval = setInterval(updateShowBasedOnTime, 60000) // Check every minute

    // On show change, trigger DJ intro ONLY if new show
    if (currentShow.name !== lastShowNameRef.current) {
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
  const handleRequestSuccess = async (requestType: string, message: string, userName: string, bypassCode?: string) => {
    // Only allow DJ to speak for paid shoutouts
    if (requestType !== "shoutout") {
      toast({
        title: "Request Processed",
        description: "Your request has been processed successfully!",
        duration: 5000,
      })
      return
    }

    try {
      if (!webrtcClient.current) {
        webrtcClient.current = new WebRTCClient()
      }

      await webrtcClient.current.initialize(currentShow.voiceProfile)

      webrtcClient.current.onTrack((event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0]
        }
      })

      const aiMessage = `Big shoutout to ${userName}! They say: "${message}". Thanks for tuning in and being part of our BUSK.Radio community!`
      webrtcClient.current.sendMessage(aiMessage)
      setHostDialogue(aiMessage)

      toast({
        title: "Shoutout Processed",
        description: "Your paid shoutout has been broadcast!",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error processing shoutout:", error)
      toast({
        title: "Shoutout Error",
        description: "There was an error broadcasting your shoutout.",
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
