"use client"

import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

interface VibeSelectorProps {
  selectedVibe: string
  onSelectVibe: (vibe: string) => void
}

export function VibeSelector({ selectedVibe, onSelectVibe }: VibeSelectorProps) {
  const vibes = ["Cowboy", "True Crime Buff", "Cheerleader", "Chill Surfer", "Medieval Knight"]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {vibes.map((vibe) => (
          <button
            key={vibe}
            onClick={() => onSelectVibe(vibe)}
            className={`relative bg-white rounded-md shadow-sm hover:shadow-md transition-shadow p-6 text-left ${
              selectedVibe === vibe ? "ring-1 ring-[#ff5722]" : ""
            }`}
          >
            <span className="text-[#333333]">{vibe}</span>
            <div
              className={`absolute left-4 bottom-4 w-2 h-2 rounded-full ${
                selectedVibe === vibe ? "bg-[#ff5722]" : "bg-[#e0e0e0]"
              }`}
            ></div>
          </button>
        ))}
        <button className="bg-[#e0e0e0] rounded-md shadow-sm flex items-center justify-center p-6">
          <RefreshCw size={24} className="text-[#999999]" />
        </button>
      </div>

      {selectedVibe === "Cowboy" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-[#333333] font-medium">
            Voice: Warm, relaxed, and friendly, with a steady cowboy drawl that feels approachable.
          </p>
          <p className="text-[#666666] mt-2">
            Punctuation: Light and natural, with gentle pauses that create a conversational rhythm without feeling
            rushed.
          </p>
        </motion.div>
      )}
    </div>
  )
}
