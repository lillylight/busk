"use client"

import { RadioStation } from "@/components/radio-station"
import { WalletConnect } from "@/components/wallet-connect"
import { useAccount } from "wagmi"
import Link from "next/link"
import { Shield } from "lucide-react"

const ADMIN_ENS = 'aiancestry.base.eth'

export default function Home() {
  const { address } = useAccount()
  
  // TEMPORARY: Show admin button for any connected wallet
  // TODO: Replace with proper wallet check
  const isAdmin = !!address // Show for any connected wallet
  
  // Uncomment and update when ready to restrict:
  // const isAdmin = address && address.toLowerCase() === '0xYOUR_WALLET_ADDRESS'.toLowerCase()

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333333]">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-[#333333]">BUSK.Radio</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
            <WalletConnect />
          </div>
        </header>
        <RadioStation />
      </div>
    </main>
  )
}
