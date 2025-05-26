"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users } from "lucide-react"
import audioService from "@/lib/audio-service"

interface CoverArtProps {
  currentShow: {
    name: string
    host: string
    type: "music" | "talk"
    description: string
    voiceProfile: string
    color: string
  }
  isPlaying: boolean
  hostDialogue: string
  listeners: number
  isSongGenerating?: boolean
}

export function CoverArt({ currentShow, isPlaying, hostDialogue, listeners, isSongGenerating = false }: CoverArtProps) {
  const [songInfo, setSongInfo] = useState({
    title: "",
    artist: "",
    coverUrl: null as string | null,
  })

  // Listen for metadata updates
  useEffect(() => {
    const handleMetadataUpdate = (metadata: any) => {
      setSongInfo({
        title: metadata.title || "Unknown Track",
        artist: metadata.artist || "Unknown Artist",
        coverUrl: metadata.coverUrl,
      })
    }

    audioService.onMetadataUpdate(handleMetadataUpdate)

    // Initial metadata
    setSongInfo(audioService.getCurrentMetadata())

    return () => {
      // No cleanup needed for the listener as it's managed by the service
    }
  }, [])

  // Generate a gradient background based on the show type
  const getGradient = () => {
    if (currentShow.type === "music") {
      return "bg-gradient-to-br from-[#ff5722] to-[#ff9800]"
    } else {
      return "bg-gradient-to-br from-[#2196f3] to-[#03a9f4]"
    }
  }

  return (
    <div className="relative aspect-square rounded-md shadow-md overflow-hidden">
      {/* Cover image if available */}
      {songInfo.coverUrl ? (
        <div className="absolute inset-0">
          <img
            src={songInfo.coverUrl || "/placeholder.svg"}
            alt={`${songInfo.artist} - ${songInfo.title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      ) : (
        <div className={`absolute inset-0 ${getGradient()}`}></div>
      )}

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        {currentShow.type === "music" ? (
          <div className="w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full border-4 border-white"></div>
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 rounded-full border-2 border-white"></div>
          </div>
        ) : (
          <div className="w-full h-full grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-white"></div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentShow.name}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Only show title for music shows */}
              {currentShow.type === "music" && <h2 className="text-2xl font-medium">{currentShow.name}</h2>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Host dialogue */}
        <div className="mt-4 flex-1 flex flex-col justify-center">
          {hostDialogue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black/20 backdrop-blur-sm p-4 rounded-lg"
            >
              <p className="text-white/90 italic text-sm">{hostDialogue}</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {currentShow.type === "music" && (
              <motion.div
                key={`${songInfo.artist}-${songInfo.title}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-xl font-medium">{songInfo.title}</p>
                <p className="text-white/80">{songInfo.artist}</p>
                {isSongGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center mt-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"
                    />
                    <p className="text-sm text-white/80">Generating your song request...</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            {/* Listeners count */}
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="text-sm">{listeners} listeners</span>
            </div>

            {/* LIVE indicator */}
            <div className="flex items-center">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="h-3 w-3 bg-red-500 rounded-full mr-2"
              />
              <span className="text-xs font-medium uppercase">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
