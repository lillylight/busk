"use client"

import { RadioStation } from "@/components/radio-station"
import { WalletConnect } from "@/components/wallet-connect"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333333]">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-[#333333]">BUSK.Radio</h1>
          <WalletConnect />
        </header>
        <RadioStation />
      </div>
    </main>
  )
}
