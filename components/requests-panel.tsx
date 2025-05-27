"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Music, MessageSquare, Send, Clock, Users, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { OnchainCheckout } from "@/components/onchain-checkout"

interface RequestsPanelProps {
  currentShow: {
    type: "music" | "talk"
    name: string
  }
  onRequestSuccess?: (requestType: string, message: string, userName: string, userLocation?: string) => void
}

export function RequestsPanel({ currentShow, onRequestSuccess }: RequestsPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [requestType, setRequestType] = useState("")
  const [userName, setUserName] = useState("")
  const [userLocation, setUserLocation] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [callInCountdown, setCallInCountdown] = useState<number>(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const { toast } = useToast()

  // For future: dual-host selection (stub)
  const [selectedHost, setSelectedHost] = useState<string>("")

  const musicRequests = [
    {
      id: "shoutout",
      name: "Shoutout",
      description: "Get your name mentioned on air",
      icon: <MessageSquare size={20} />,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "dedication",
      name: "Song Dedication",
      description: "Dedicate a song to someone special",
      icon: <Music size={20} />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "request",
      name: "Song Request",
      description: "Request a song to be generated and played",
      icon: <Music size={20} />,
      color: "from-green-500 to-emerald-500",
    },
    { 
      id: "callIn", 
      name: "Call In", 
      description: "Talk to the DJ live on air", 
      icon: <Mic size={20} />,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "tipJar",
      name: "Tip Your DJ",
      description: "Show appreciation for your favorite DJ",
      icon: <Heart size={20} />,
      color: "from-pink-500 to-rose-500",
    },
  ]

  const talkRequests = [
    {
      id: "question",
      name: "Ask a Question",
      description: "Have your question answered on air",
      icon: <MessageSquare size={20} />,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "topic",
      name: "Suggest a Topic",
      description: "Suggest a topic for discussion",
      icon: <MessageSquare size={20} />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "debate",
      name: "Join a Debate",
      description: "Join a debate on the current topic",
      icon: <Mic size={20} />,
      color: "from-green-500 to-emerald-500",
    },
    { 
      id: "callIn", 
      name: "Call In", 
      description: "Talk to the host live on air", 
      icon: <Mic size={20} />,
      color: "from-orange-500 to-red-500",
    },
  ]

  const requests = currentShow.type === "music" ? musicRequests : talkRequests

  const handleRequestClick = (id: string) => {
    if (id === "tipJar") {
      setShowTipModal(true)
      return
    }
    setSelectedRequest(id)
    setRequestType(id)
  }

  // Countdown timer for call-in only
  useEffect(() => {
    if (callInCountdown > 0) {
      const timer = setTimeout(() => {
        setCallInCountdown(callInCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [callInCountdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (requestType === "callIn") {
      if (!userName.trim() || !userLocation.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter your name and location",
          variant: "destructive",
        })
        return
      }
      // Show payment modal before proceeding
      setShowPaymentModal(true)
      return
    } else {
      if (!userName.trim() || !message.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter your name and message",
          variant: "destructive",
        })
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      if (onRequestSuccess) {
        if (requestType === "callIn") {
          onRequestSuccess(requestType, "", userName, userLocation)
        } else {
          onRequestSuccess(requestType, message, userName)
        }
      }
      
      // Show queue position for non-call-in requests
      if (requestType !== "callIn") {
        setQueuePosition(Math.floor(Math.random() * 5) + 1)
        setTimeout(() => setQueuePosition(null), 5000)
      }
      
      // Reset form
      setMessage("")
      setUserLocation("")
      setSelectedRequest(null)
      
      toast({
        title: "Request Submitted",
        description: requestType === "shoutout" 
          ? "Your shoutout will be read on air soon!" 
          : "Your request has been submitted successfully!",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment confirmation for call-in
  const handlePayment = (duration: number) => {
    setShowPaymentModal(false)
    setCallInCountdown(duration)
    
    if (onRequestSuccess) {
      // Pass duration as part of the message
      onRequestSuccess("callIn", duration.toString(), userName, userLocation)
    }
    
    toast({
      title: "Payment Successful",
      description: `You have ${duration} seconds to interact with the DJ!`,
      duration: 3500,
    })
    
    // Reset form
    setUserName("")
    setUserLocation("")
    setSelectedRequest(null)
  }

  return (
    <div className="space-y-4">
      {/* Tip Jar Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border border-[#e0e0e0]"
          >
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Heart className="text-pink-500" size={24} />
              Tip Your DJ
            </h4>
            <p className="mb-4 text-sm text-[#666666]">
              Show your appreciation for the amazing music and entertainment!
            </p>
            <div className="space-y-3 mb-4">
              {[
                { amount: 1, label: "Coffee", emoji: "☕" },
                { amount: 5, label: "Lunch", emoji: "🍔" },
                { amount: 10, label: "Pizza", emoji: "🍕" },
                { amount: 25, label: "Concert Ticket", emoji: "🎫" },
              ].map((option) => (
                <div key={option.amount} className="flex items-center gap-3 p-3 border border-[#e0e0e0] rounded-lg">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[#333333]">{option.label}</p>
                  </div>
                  <OnchainCheckout
                    amount={option.amount}
                    description={`Tip for DJ - ${option.label}`}
                    buttonText={`Tip $${option.amount}`}
                    onSuccess={() => {
                      setShowTipModal(false)
                      toast({
                        title: "Thank you for your tip!",
                        description: `Your $${option.amount} tip means a lot to us! ${option.emoji}`,
                        duration: 5000,
                      })
                    }}
                    className="px-6 py-2"
                  />
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setShowTipModal(false)}
            >
              Maybe Later
            </Button>
          </motion.div>
        </div>
      )}

      {/* Payment Modal for Call-In */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border border-[#e0e0e0]"
          >
            <h4 className="font-semibold text-lg mb-3">Select Call-In Duration</h4>
            <p className="mb-4 text-sm text-[#666666]">
              Choose how long you'd like to talk with the DJ
            </p>
            <div className="space-y-3 mb-4">
              {[
                { duration: 30, price: 2, label: "30 seconds" },
                { duration: 60, price: 4, label: "1 minute" },
                { duration: 90, price: 6, label: "1.5 minutes" },
              ].map((option) => (
                <div key={option.duration} className="flex items-center gap-3 p-3 border border-[#e0e0e0] rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-[#333333]">{option.label}</p>
                  </div>
                  {option.duration === 60 && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white mr-3">
                      Popular
                    </Badge>
                  )}
                  <OnchainCheckout
                    amount={option.price}
                    description={`Call-in with DJ - ${option.label}`}
                    buttonText={`Pay $${option.price}`}
                    onSuccess={() => {
                      setShowPaymentModal(false)
                      handlePayment(option.duration)
                    }}
                    className="px-6 py-2"
                  />
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}

      {/* Queue Position Notification */}
      {queuePosition && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg flex items-center gap-2"
        >
          <Users size={20} />
          <span className="font-medium">You're #{queuePosition} in the queue</span>
        </motion.div>
      )}

      {/* Call-In Timer (only shows during active call) */}
      {callInCountdown > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Mic className="animate-pulse" size={20} />
            <span className="font-semibold">You're LIVE on air!</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <span className="font-mono text-lg">{callInCountdown}s</span>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {currentShow.type === "music" ? "Music Show Requests" : "Talk Show Interactions"}
        </h3>
        <p className="text-sm text-[#666666]">
          Select an option to interact with {currentShow.name}
        </p>
      </div>

      {!selectedRequest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requests.map((request, index) => (
            <motion.button
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRequestClick(request.id)}
              className="relative overflow-hidden bg-white rounded-lg border border-[#e0e0e0] hover:border-[#ff5722] shadow-sm hover:shadow-md transition-all p-4 text-left group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${request.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${request.color} text-white`}>
                  {request.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#333333]">{request.name}</h4>
                  <p className="text-sm text-[#666666] mt-1">{request.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-[#e0e0e0]"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-1 flex items-center gap-2">
                {requests.find(r => r.id === selectedRequest)?.icon}
                {requests.find(r => r.id === selectedRequest)?.name}
              </h4>
              <p className="text-sm text-[#666666] mb-4">
                {requests.find(r => r.id === selectedRequest)?.description}
              </p>
            </div>
            
            <div className="space-y-3">
              <Input
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full"
              />
              
              {selectedRequest === "callIn" ? (
                <Input
                  placeholder="Your Location (e.g. Lagos, Nigeria)"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  required
                  className="w-full"
                />
              ) : (
                <Textarea
                  placeholder={
                    selectedRequest === "shoutout" 
                      ? "Your shoutout message..." 
                      : "Your message..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] w-full resize-none"
                  required
                />
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedRequest(null)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"
                    />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}
