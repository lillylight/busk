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
import { Loader2, CreditCard, Check, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdvertisingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdvertisingModal({ isOpen, onClose }: AdvertisingModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [adScript, setAdScript] = useState("")
  const [selectedShow, setSelectedShow] = useState("")
  const [adType, setAdType] = useState<"script" | "audio">("script")
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
          amount: 50, // $50 for advertising
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
      <DialogContent className="sm:max-w-[500px] bg-[#f5f5f5] border-[#e0e0e0] text-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-xl">Place an Advertisement - $50</DialogTitle>
          <DialogDescription className="text-[#666666]">
            Advertise your product or service on AI Radio.
          </DialogDescription>
        </DialogHeader>

        {paymentStep === "form" && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName" className="text-[#333333]">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                  className="bg-white border-[#e0e0e0] text-[#333333]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="show" className="text-[#333333]">
                  Select Show
                </Label>
                <Select value={selectedShow} onValueChange={setSelectedShow} required>
                  <SelectTrigger className="bg-white border-[#e0e0e0] text-[#333333]">
                    <SelectValue placeholder="Select a show" />
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show} value={show}>
                        {show}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[#333333]">Advertisement Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="script"
                      name="adType"
                      value="script"
                      checked={adType === "script"}
                      onChange={() => setAdType("script")}
                      className="mr-2"
                    />
                    <Label htmlFor="script" className="text-[#333333] cursor-pointer">
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
                      className="mr-2"
                    />
                    <Label htmlFor="audio" className="text-[#333333] cursor-pointer">
                      Audio File
                    </Label>
                  </div>
                </div>
              </div>

              {adType === "script" ? (
                <div className="grid gap-2">
                  <Label htmlFor="adScript" className="text-[#333333]">
                    Advertisement Script
                  </Label>
                  <Textarea
                    id="adScript"
                    value={adScript}
                    onChange={(e) => setAdScript(e.target.value)}
                    placeholder="Enter your advertisement script (max 100 words). Our AI host will read this during the show."
                    required
                    className="bg-white border-[#e0e0e0] text-[#333333] min-h-[100px]"
                  />
                  <p className="text-xs text-[#666666]">
                    Note: If your script is too long, our AI will automatically shorten it while preserving your
                    message.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="audioFile" className="text-[#333333]">
                    Upload Audio File
                  </Label>
                  <div className="border-2 border-dashed border-[#e0e0e0] rounded-md p-6 flex flex-col items-center justify-center bg-white">
                    <Upload className="h-8 w-8 text-[#999999] mb-2" />
                    <p className="text-sm text-[#666666] text-center">
                      Click to upload or drag and drop your audio file (MP3, max 30 seconds)
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

              <div className="grid gap-2">
                <Label htmlFor="card" className="text-[#333333]">
                  Card Number
                </Label>
                <div className="relative">
                  <Input
                    id="card"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    className="bg-white border-[#e0e0e0] text-[#333333] pl-10"
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#999999]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expiry" className="text-[#333333]">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    className="bg-white border-[#e0e0e0] text-[#333333]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cvc" className="text-[#333333]">
                    CVC
                  </Label>
                  <Input
                    id="cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123"
                    maxLength={3}
                    required
                    className="bg-white border-[#e0e0e0] text-[#333333]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="bg-white border-[#e0e0e0] text-[#666666] hover:bg-[#f0f0f0] hover:text-[#333333]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing} className="bg-[#ff5722] hover:bg-[#f4511e] text-white">
                Pay $50
              </Button>
            </DialogFooter>
          </form>
        )}

        {paymentStep === "processing" && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-t-transparent border-[#ff5722]"
              />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-[#ff5722]" />
            </div>
            <p className="text-lg font-medium text-[#333333]">Processing Payment</p>
            <p className="text-sm text-[#666666] mt-2">Please wait while we process your payment...</p>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#4caf50]/20 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-[#4caf50]" />
            </div>
            <p className="text-lg font-medium text-[#333333]">Payment Successful!</p>
            <p className="text-sm text-[#666666] mt-2">Your advertisement has been scheduled successfully.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
