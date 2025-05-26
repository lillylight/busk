"use client"

import { RadioStation } from "@/components/radio-station"
import { Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { toast } = useToast()

  const handleConnectCrypto = () => {
    toast({
      title: "Connect Crypto",
      description: "Crypto wallet connection feature coming soon!",
      duration: 3000,
    })
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333333]">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-[#333333]">BUSK.Radio</h1>
          <button
            onClick={handleConnectCrypto}
            className="flex items-center gap-2 bg-[#f0b90b] hover:bg-[#e0a800] text-white px-4 py-2 rounded-full transition-colors"
          >
            <Wallet size={16} />
            <span className="text-sm font-medium">Connect Wallet</span>
          </button>
        </header>
        <RadioStation />
      </div>
    </main>
  )
}
