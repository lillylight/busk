"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Check, Upload, Clock, Badge } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { OnchainCheckout } from "@/components/onchain-checkout"

interface AdvertisingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdvertisingModal({ isOpen, onClose }: AdvertisingModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [adScript, setAdScript] = useState("")
  const [selectedShow, setSelectedShow] = useState("")
  const [adType, setAdType] = useState<"script" | "audio">("script")
  const [packageType, setPackageType] = useState<"standard" | "branded">("standard")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "success">("form")
  const { toast } = useToast()

  const shows = [
    "Morning Vibes with AI Alex",
    "Tech Talk with Neural Nancy",
    "Midday Mix with Digital Dave",
    "Science Hour with Synthetic Sam",
    "Evening Groove with Virtual Vicky",
    "Night Owl with Algorithmic Andy",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setPaymentStep("processing")

    try {
      // Call our advertising API
      const amount = packageType === "branded" ? 100 : 50
      const response = await fetch("/api/advertising", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          adScript,
          selectedShow,
          adType,
          packageType,
          amount,
        }),
      })

      if (!response.ok) {
        throw new Error("Payment failed")
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Show success state
      setPaymentStep("success")

      // Wait a moment to show success state
      setTimeout(() => {
        // Close modal and reset form
        onClose()
        resetForm()

        toast({
          title: "Advertisement Placed",
          description: "Your advertisement has been scheduled successfully!",
          duration: 5000,
        })
      }, 1500)
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
      setPaymentStep("form")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setCompanyName("")
    setAdScript("")
    setSelectedShow("")
    setAdType("script")
    setCardNumber("")
    setExpiry("")
    setCvc("")
    setPaymentStep("form")
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return v
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && paymentStep !== "processing") {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-[280px] bg-[#f5f5f5] border-[#e0e0e0] text-[#333333] scale-[0.5] transform max-h-[60vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Place an Advertisement</DialogTitle>
          <DialogDescription className="text-[#666666] text-xs">
            Choose your advertising package
          </DialogDescription>
        </DialogHeader>

        {paymentStep === "form" && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2 py-1">
              {/* Package Selection */}
              <div className="grid gap-1">
                <Label className="text-[#333333] text-xs">Select Package</Label>
                <div className="grid grid-cols-1 gap-1">
                  <div 
                    className={`relative border rounded-md p-2 cursor-pointer transition-all ${
                      packageType === "standard" 
                        ? "border-[#ff5722] bg-[#ff5722]/5" 
                        : "border-[#e0e0e0] hover:border-[#999999]"
                    }`}
                    onClick={() => setPackageType("standard")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#333333] text-xs">Standard Ad</h4>
                        <p className="text-[10px] text-[#666666]">
                          Read during show
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-[#ff5722]">$50</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`relative border rounded-md p-2 cursor-pointer transition-all ${
                      packageType === "branded" 
                        ? "border-[#ff5722] bg-[#ff5722]/5" 
                        : "border-[#e0e0e0] hover:border-[#999999]"
                    }`}
                    onClick={() => setPackageType("branded")}
                  >
                    <Badge className="absolute top-1 right-1 bg-gradient-to-r from-[#ff5722] to-[#f4511e] text-white text-[8px] px-1 py-0">
                      PREMIUM
                    </Badge>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#333333] text-xs">Branded Slot</h4>
                        <p className="text-[10px] text-[#666666]">
                          Full hour sponsor
                        </p>
                        <ul className="text-[9px] text-[#666666] mt-1 space-y-0">
                          <li className="flex items-center gap-1">
                            <Check className="h-2 w-2 text-[#4caf50]" />
                            Every 15 mins
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-2 w-2 text-[#4caf50]" />
                            1 week duration
                          </li>
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-[#ff5722]">$100</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="companyName" className="text-[#333333] text-xs">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  required
                  className="bg-white border-[#e0e0e0] text-[#333333] h-8 text-sm"
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="show" className="text-[#333333] text-xs">
                  Select Show
                </Label>
                <Select value={selectedShow} onValueChange={setSelectedShow} required>
                  <SelectTrigger className="bg-white border-[#e0e0e0] text-[#333333] h-8 text-sm">
                    <SelectValue placeholder="Select a show" />
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show} value={show} className="text-sm">
                        {show}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label className="text-[#333333] text-xs">Advertisement Type</Label>
                <div className="flex gap-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="script"
                      name="adType"
                      value="script"
                      checked={adType === "script"}
                      onChange={() => setAdType("script")}
                      className="mr-1 h-3 w-3"
                    />
                    <Label htmlFor="script" className="text-[#333333] cursor-pointer text-xs">
                      Text Script
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="audio"
                      name="adType"
                      value="audio"
                      checked={adType === "audio"}
                      onChange={() => setAdType("audio")}
                      className="mr-1 h-3 w-3"
                    />
                    <Label htmlFor="audio" className="text-[#333333] cursor-pointer text-xs">
                      Audio File
                    </Label>
                  </div>
                </div>
              </div>

              {adType === "script" ? (
                <div className="grid gap-1">
                  <Label htmlFor="adScript" className="text-[#333333] text-xs">
                    Advertisement Script
                  </Label>
                  <Textarea
                    id="adScript"
                    value={adScript}
                    onChange={(e) => setAdScript(e.target.value)}
                    placeholder="Enter your ad script (max 100 words)"
                    required
                    className="bg-white border-[#e0e0e0] text-[#333333] min-h-[60px] text-sm"
                  />
                  <p className="text-[9px] text-[#666666]">
                    AI will shorten if needed
                  </p>
                </div>
              ) : (
                <div className="grid gap-1">
                  <Label htmlFor="audioFile" className="text-[#333333] text-xs">
                    Upload Audio
                  </Label>
                  <div className="border border-dashed border-[#e0e0e0] rounded-md p-3 flex flex-col items-center justify-center bg-white">
                    <Upload className="h-5 w-5 text-[#999999] mb-1" />
                    <p className="text-[10px] text-[#666666] text-center">
                      Click to upload MP3 (max 30s)
                    </p>
                    <input
                      type="file"
                      id="audioFile"
                      accept="audio/mp3"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}

            </div>

            <DialogFooter className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="bg-white border-[#e0e0e0] text-[#666666] hover:bg-[#f0f0f0] hover:text-[#333333] h-8 text-sm px-3"
              >
                Cancel
              </Button>
              {companyName && selectedShow && (adType === "audio" || adScript) ? (
                <OnchainCheckout
                  amount={packageType === "branded" ? 100 : 50}
                  description={`${packageType === "branded" ? "Branded Time Slot" : "Standard Advertisement"} - ${selectedShow}`}
                  buttonText={`Pay $${packageType === "branded" ? "100" : "50"}`}
                  onSuccess={async () => {
                    setPaymentStep("processing")
                    
                    // Save advertisement details
                    try {
                      const response = await fetch("/api/advertising", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          companyName,
                          adScript,
                          selectedShow,
                          adType,
                          packageType,
                          amount: packageType === "branded" ? 100 : 50,
                        }),
                      })

                      if (!response.ok) {
                        throw new Error("Failed to save advertisement")
                      }

                      setPaymentStep("success")
                      
                      setTimeout(() => {
                        onClose()
                        resetForm()
                        toast({
                          title: "Advertisement Placed",
                          description: "Your advertisement has been scheduled successfully!",
                          duration: 5000,
                        })
                      }, 1500)
                    } catch (error) {
                      console.error("Error saving advertisement:", error)
                      toast({
                        title: "Error",
                        description: "Payment successful but failed to save advertisement. Please contact support.",
                        variant: "destructive",
                      })
                      setPaymentStep("form")
                    }
                  }}
                  className="px-4 py-1.5 text-sm h-8"
                />
              ) : (
                <Button disabled className="bg-gray-400 text-white cursor-not-allowed h-8 text-sm px-3">
                  Complete Form
                </Button>
              )}
            </DialogFooter>
          </form>
        )}

        {paymentStep === "processing" && (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-t-transparent border-[#ff5722]"
              />
              <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-[#ff5722]" />
            </div>
            <p className="text-sm font-medium text-[#333333]">Processing Payment</p>
            <p className="text-xs text-[#666666] mt-1">Please wait...</p>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#4caf50]/20 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-[#4caf50]" />
            </div>
            <p className="text-sm font-medium text-[#333333]">Payment Successful!</p>
            <p className="text-xs text-[#666666] mt-1">Your ad has been scheduled.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
