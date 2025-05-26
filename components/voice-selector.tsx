"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface VoiceSelectorProps {
  selectedVoice: string
  onSelectVoice: (voice: string) => void
}

export function VoiceSelector({ selectedVoice, onSelectVoice }: VoiceSelectorProps) {
  const voices = ["echo", "shimmer", "sage"]

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {voices.map((voice) => (
          <button
            key={voice}
            onClick={() => onSelectVoice(voice)}
            className="relative aspect-square bg-white rounded-md shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center p-4"
          >
            <span className="text-[#333333]">{voice}</span>
            <div className="w-2 h-2 rounded-full bg-[#e0e0e0] mt-4"></div>
            {selectedVoice === voice && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-4 right-4">
                <Check size={16} className="text-[#ff5722]" />
              </motion.div>
            )}
          </button>
        ))}
        <button className="aspect-square bg-[#999999] rounded-md shadow-sm flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
