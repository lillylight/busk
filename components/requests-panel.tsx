"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Music, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

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
  const [djInteractionActive, setDjInteractionActive] = useState(false)
  const [djInteractionTimer, setDjInteractionTimer] = useState<NodeJS.Timeout | null>(null)
  const [callInDuration, setCallInDuration] = useState<number>(30) // seconds
  const [callInCountdown, setCallInCountdown] = useState<number>(30)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { toast } = useToast()

  // For future: dual-host selection (stub)
  const [selectedHost, setSelectedHost] = useState<string>("") // For dual-host talk shows

  const musicRequests = [
    {
      id: "shoutout",
      name: "Shoutout",
      description: "Get your name mentioned on air",
      icon: <MessageSquare size={20} />,
    },
    {
      id: "dedication",
      name: "Song Dedication",
      description: "Dedicate a song to someone special",
      icon: <Music size={20} />,
    },
    {
      id: "request",
      name: "Song Request",
      description: "Request a song to be generated and played",
      icon: <Music size={20} />,
    },
    { id: "callIn", name: "Call In", description: "Talk to the DJ live on air", icon: <Mic size={20} /> },
  ]

  const talkRequests = [
    {
      id: "question",
      name: "Ask a Question",
      description: "Have your question answered on air",
      icon: <MessageSquare size={20} />,
    },
    {
      id: "topic",
      name: "Suggest a Topic",
      description: "Suggest a topic for discussion",
      icon: <MessageSquare size={20} />,
    },
    {
      id: "debate",
      name: "Join a Debate",
      description: "Join a debate on the current topic",
      icon: <Mic size={20} />,
    },
    { id: "callIn", name: "Call In", description: "Talk to the host live on air", icon: <Mic size={20} /> },
  ]

  const requests = currentShow.type === "music" ? musicRequests : talkRequests

  const handleRequestClick = (id: string) => {
    setSelectedRequest(id)
    setRequestType(id)
  }

  const handleDjInteraction = (duration: number = 30) => {
    setDjInteractionActive(true)
    setCallInCountdown(duration)
    if (djInteractionTimer) clearTimeout(djInteractionTimer)
    // Start countdown interval
    const interval = setInterval(() => {
      setCallInCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setDjInteractionActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    // Safety: also set a timeout to force end
    const timer = setTimeout(() => {
      setDjInteractionActive(false)
      setCallInCountdown(0)
      clearInterval(interval)
    }, duration * 1000)
    setDjInteractionTimer(timer)
  }

  useEffect(() => {
    return () => {
      if (djInteractionTimer) clearTimeout(djInteractionTimer)
    }
  }, [djInteractionTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Only trigger AI DJ interaction for call-in
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
      return // Do not proceed until payment is handled
    } else {
      if (!userName.trim() || !message.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter your name and message",
          variant: "destructive",
        })
        return
      }
      // Do NOT trigger AI DJ call-in logic for other types
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
      // Reset form
      setMessage("")
      setUserLocation("")
      setSelectedRequest(null)
      toast({
        title: "Request Submitted",
        description: "Your request has been submitted successfully!",
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
    setCallInDuration(duration)
    setShowPaymentModal(false)
    setTimeout(() => {
      handleDjInteraction(duration)
      toast({
        title: "Payment Successful",
        description: `You have paid $${duration/30*2} for ${duration} seconds with the DJ!`,
        duration: 3500,
      })
    }, 400) // Simulate payment delay
  }

  return (
    <div className="space-y-4">
      {/* Payment Modal for Call-In */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xs w-full">
            <h4 className="font-semibold mb-2">Select Call-In Duration</h4>
            <p className="mb-4 text-sm text-gray-600">$2 for 30s, $4 for 60s, $6 for 90s (max)</p>
            <div className="space-y-2 mb-4">
              {[30,60,90].map((d) => (
                <Button key={d} className="w-full justify-between" onClick={() => handlePayment(d)}>
                  {d/30*2}$ - {d} seconds
                </Button>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <h3 className="text-lg font-medium text-[#333333]">
        {currentShow.type === "music" ? "Music Show Requests" : "Talk Show Interactions"}
      </h3>
      <p className="text-sm text-[#666666]">Select an option to interact with {currentShow.name}</p>

      {!selectedRequest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {requests.map((request) => (
            <motion.button
              key={request.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                handleRequestClick(request.id)
                // Only shoutout triggers its own DJ interaction plan
                if (request.id === 'shoutout') handleDjInteraction()
              }}
              className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow p-4 text-left flex items-start gap-3"
            >
              <div className="p-2 rounded-full bg-[#f5f5f5] text-[#ff5722]">{request.icon}</div>
              <div>
                <h4 className="font-medium text-[#333333]">{request.name}</h4>
                <p className="text-sm text-[#666666]">{request.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        selectedRequest === "callIn" ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-md shadow-sm p-4"
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#333333] mb-2">
                    {requests.find(r => r.id === selectedRequest)?.name}
                  </h4>
                  <Input
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Input
                    placeholder="Your Location (e.g. Lagos, Nigeria)"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="mb-2"
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedRequest(null)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-t-transparent border-white rounded-full"
                        />
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-md shadow-sm p-4"
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#333333] mb-2">
                    {requests.find(r => r.id === selectedRequest)?.name}
                  </h4>
                  <Input
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Textarea
                    placeholder="Your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedRequest(null)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-t-transparent border-white rounded-full"
                        />
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )
      )}
      {djInteractionActive && (
        <div className="text-center p-2 bg-orange-100 rounded text-orange-700 font-semibold mt-4">
          You have {callInCountdown} seconds to interact with the AI DJ!
        </div>
      )}
    </div>
  )
}
