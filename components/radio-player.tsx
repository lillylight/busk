"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Disc } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { generateHostDialogue } from "@/lib/ai-dialogue"

interface RadioPlayerProps {
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  currentShow: {
    type: "music" | "talk"
    name: string
    host: string
    voiceProfile: "echo" | "shimmer" | "sage"
    color: string
  }
}

export function RadioPlayer({ isPlaying, setIsPlaying, currentShow }: RadioPlayerProps) {
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState("00:00:00")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callerAudioStream, setCallerAudioStream] = useState<MediaStream | null>(null)
  const callerAudioRef = useRef<HTMLAudioElement | null>(null)
  const [songInfo, setSongInfo] = useState({
    title: "Cosmic Waves",
    artist: "AI Symphony"
  })
  const [hostDialogue, setHostDialogue] = useState("")
  const [isDialogueVisible, setIsDialogueVisible] = useState(false)
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  useEffect(() => {
    audioRef.current = new Audio("http://stream.syntheticfm.com:8040/live")
    audioRef.current.loop = true
    audioRef.current.volume = isCallActive ? (volume * 0.5) / 100 : volume / 100

    // Initialize caller audio element
    callerAudioRef.current = new Audio()
    if (callerAudioStream) {
      callerAudioRef.current.srcObject = callerAudioStream
      callerAudioRef.current.play()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  // Handle play/pause and trigger AI DJ introduction
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().then(() => {
          // Wait 4 seconds before triggering AI DJ introduction
          setTimeout(async () => {
            try {
              const dialogue = await generateHostDialogue({
                showType: currentShow.type,
                hostName: currentShow.host.split("&")[0].trim(),
                personality: "energetic",
                voiceProfile: currentShow.voiceProfile,
                context: `Current show: ${currentShow.name}. Now starting the live stream.`,
              })

              if (dialogue && dialogue.trim().length > 0) {
                setHostDialogue(dialogue)
                setIsDialogueVisible(true)

                // Hide dialogue after 10 seconds
                setTimeout(() => {
                  setIsDialogueVisible(false)
                }, 10000)
              }
            } catch (error) {
              console.error("Error generating initial dialogue:", error)
            }
          }, 4000)
        }).catch((error) => {
          console.error("Audio playback error:", error)
          toast({
            title: "Playback Error",
            description: "Could not play audio. Please try again.",
            variant: "destructive",
          })
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, toast, setIsPlaying, currentShow])

  // Handle volume changes and call status
  useEffect(() => {
    if (audioRef.current) {
      // Reduce stream volume by 50% during calls
      const adjustedVolume = isCallActive ? (volume * 0.5) / 100 : volume / 100
      audioRef.current.volume = isMuted ? 0 : adjustedVolume
    }

    // Adjust caller audio volume
    if (callerAudioRef.current) {
      callerAudioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted, isCallActive, callerAudioStream])

  // Update the clock every second when playing
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        const date = new Date()
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        const seconds = date.getSeconds().toString().padStart(2, "0")
        setCurrentTime(`${hours}:${minutes}:${seconds}`)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // Generate host dialogue periodically
  useEffect(() => {
    let dialogueInterval: NodeJS.Timeout
    let visibilityTimeout: NodeJS.Timeout

    const generateDialogue = async () => {
      try {
        const dialogue = await generateHostDialogue({
          showType: currentShow.type,
          hostName: currentShow.host.split("&")[0].trim(),
          personality: "energetic",
          voiceProfile: currentShow.voiceProfile,
          context: `Current show: ${currentShow.name}. ${
            currentShow.type === "music" ? `Current song: ${songInfo.title} by ${songInfo.artist}.` : ""
          }`,
        })

        // Only show dialogue if we got a valid response
        if (dialogue && dialogue.trim().length > 0) {
          setHostDialogue(dialogue)
          setIsDialogueVisible(true)

          // Hide dialogue after 10 seconds
          visibilityTimeout = setTimeout(() => {
            setIsDialogueVisible(false)
          }, 10000)
        }
      } catch (error) {
        console.error("Error generating dialogue:", error)
        // Don't show error to user, just silently fail
      }
    }

    if (isPlaying) {
      // Generate initial dialogue with a slight delay to avoid initial loading issues
      const initialTimeout = setTimeout(() => {
        generateDialogue()
      }, 2000)

      // Generate new dialogue every 30-60 seconds
      dialogueInterval = setInterval(
        () => {
          generateDialogue()
        },
        Math.random() * 30000 + 30000,
      ) // Random interval between 30-60 seconds

      return () => {
        clearTimeout(initialTimeout)
        if (dialogueInterval) clearInterval(dialogueInterval)
        if (visibilityTimeout) clearTimeout(visibilityTimeout)
      }
    }

    return () => {
      if (dialogueInterval) clearInterval(dialogueInterval)
      if (visibilityTimeout) clearTimeout(visibilityTimeout)
    }
  }, [isPlaying, currentShow, songInfo])

  // Simulate song changes for music shows
  useEffect(() => {
    if (!isPlaying || currentShow.type !== "music") return

    const songInterval = setInterval(() => {
      const songs = [
        { title: "Cosmic Waves", artist: "AI Symphony" },
        { title: "Digital Dreams", artist: "Neural Beats" },
        { title: "Quantum Harmony", artist: "Algorithm Ensemble" },
        { title: "Synthetic Soul", artist: "Machine Melodies" },
      ]

      const newSong = songs[Math.floor(Math.random() * songs.length)]
      setSongInfo(newSong)

      toast({
        title: "Now Playing",
        description: `${newSong.title} by ${newSong.artist}`,
        duration: 3000,
      })
    }, 45000) // Change song every 45 seconds

    return () => clearInterval(songInterval)
  }, [isPlaying, currentShow.type, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors",
            `bg-gradient-to-r ${currentShow.color}`,
          )}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </motion.button>
        <div className="text-center">
          <div className="text-2xl font-bold">{currentTime}</div>
          <div className="text-sm text-zinc-400 flex items-center justify-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            LIVE
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDialogueVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-800/70 backdrop-blur-sm p-4 rounded-lg border border-zinc-700"
          >
            <p className="text-sm text-zinc-300 italic">{hostDialogue}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="text-center">
          {currentShow.type === "music" ? (
            <motion.div
              key={songInfo.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center mb-2">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 mr-2"
                >
                  <Disc className="h-5 w-5 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold">{songInfo.title}</h3>
              </div>
              <p className="text-zinc-400">{songInfo.artist}</p>

            </motion.div>
          ) : (
            <h3 className="text-xl font-semibold">
              {currentShow.name} <span className="text-sm font-normal text-zinc-400">with {currentShow.host}</span>
            </h3>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-400 hover:text-white transition-colors">
          {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={(value) => {
            setVolume(value[0])
            setIsMuted(value[0] === 0)
          }}
          className="cursor-pointer"
        />
      </div>


    </div>
  )
}
