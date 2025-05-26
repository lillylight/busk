"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Loader2, Users, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateHostDialogue } from "@/lib/ai-dialogue"
import { cn } from "@/lib/utils"

interface CallSimulatorProps {
  currentShow: {
    type: "music" | "talk"
    name: string
    host: string
    voiceProfile: string
    color: string
  }
}

export function CallSimulator({ currentShow }: CallSimulatorProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "queue">("idle")
  const [callTime, setCallTime] = useState(0)
  const [queuePosition, setQueuePosition] = useState(0)
  const [hostResponse, setHostResponse] = useState("")
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [webrtcClient, setWebrtcClient] = useState<any>(null)
  const [userName, setUserName] = useState("")
  const [userLocation, setUserLocation] = useState("")
  const { toast } = useToast()

  // Improved: Route shoutouts/messages through realtime model for natural AI DJ response
  const handleTextToRealtime = async (text: string) => {
    setIsGeneratingResponse(true);
    try {
      // 1. Send the user's message to the realtime AI model (DJ persona)
      const aiResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          model: 'gpt-4o-mini-realtime-preview',
          voice: currentShow.voiceProfile,
          instructions: `You are a radio DJ for ${currentShow.name}. Respond to shoutouts in a lively, upbeat Nigerian style.`,
        }),
      });
      const aiData = await aiResponse.json();
      const aiText = aiData.response || text; // Fallback to original if no AI response

      // 2. Convert the AI's response to speech and stream to WebRTC
      const { default: ttsToWebRTC } = await import('@/lib/tts-to-webrtc');
      await ttsToWebRTC.initialize({
        voiceProfile: currentShow.voiceProfile,
        instructions: `You are a radio DJ for ${currentShow.name}. Respond in an upbeat, engaging Nigerian tone.`,
        model: 'gpt-4o-mini-realtime-preview',
      });
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: aiText,
          model: 'gpt-4o-mini-tts',
          voice: currentShow.voiceProfile,
          instructions: `You are a radio DJ for ${currentShow.name}. Respond in an upbeat, engaging Nigerian tone.`,
          response_format: 'mp3',
          speed: 1.0,
        }),
      });
      if (!ttsResponse.ok) throw new Error('TTS API error');
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await ttsToWebRTC.processAudio(audio);
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      toast({ title: 'TTS Error', description: 'Failed to send your message to the DJ.', variant: 'destructive' });
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const startCall = async () => {
    if (!userName.trim() || !userLocation.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and location to call in.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setLocalStream(stream)
      processCallAfterPayment()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to make a call.',
        variant: 'destructive'
      })
    }
  }

  const processCallAfterPayment = async (duration = 30) => {
  // Optionally use duration for call length/payment
  setIsPaymentModalOpen(false);
  // ...rest of logic remains unchanged

    // Simulate queue if there are other callers
    const hasQueue = Math.random() > 0.5

    if (hasQueue) {
      setCallState("queue")
      setQueuePosition(Math.floor(Math.random() * 3) + 1) // Position 1-3

      toast({
        title: "In Queue",
        description: `You are position ${queuePosition} in the call queue.`,
        duration: 5000,
      })

      // Simulate moving up in queue
      const queueInterval = setInterval(() => {
        setQueuePosition((prev) => {
          if (prev <= 1) {
            clearInterval(queueInterval)
            setCallState("calling")

            toast({
              title: "You're Next",
              description: "Connecting your call now...",
              duration: 3000,
            })

            // Simulate the 3-second ring before AI picks up
            setTimeout(() => {
              setCallState("connected")
              startCallTimer()
              connectToWebRTC()
            }, 3000)
            return 0
          }
          return prev - 1
        })
      }, 5000) // Move up in queue every 5 seconds
    } else {
      setCallState("calling")

      // Simulate the 3-second ring before AI picks up
      setTimeout(() => {
        setCallState("connected")
        startCallTimer()
        connectToWebRTC()
      }, 3000)
    }
  }

  // Update: Call-in flow uses personalized, show-specific greeting
  const connectToWebRTC = async () => {
    setIsGeneratingResponse(true);
    try {
      const { WebRTCSession } = await import('@/lib/webrtc-session');
      const session = new WebRTCSession();
      setWebrtcClient(session);
      // Pass show name to personalized greeting
      await session.startCallIn(
        userName,
        userLocation,
        currentShow.voiceProfile,
        currentShow.name // Pass show name for intro
      );
      // No need to triggerResponse or updateSession manually; handled in startCallIn
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the AI DJ. Please try again later.',
        variant: 'destructive',
      });
      setHostResponse('Thanks for calling in! We appreciate your contribution to the show.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const startCallTimer = () => {
    // Start the call timer - 30 second limit for all calls
    const interval = setInterval(() => {
      setCallTime((prev) => {
        if (prev >= 30) {
          clearInterval(interval)
          setTimeout(() => {
            toast({
              title: "Call Ended",
              description: "Your 30-second call has ended.",
              duration: 3000,
            })
            endCall()
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const endCall = async () => {
    setCallState("idle");
    setCallTime(0);
    setHostResponse("");

    // Stop local stream tracks (cut mic)
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close WebRTC connection
    if (webrtcClient) {
      webrtcClient.close();
      setWebrtcClient(null);
    }

    // After call ends, have the AI say thank you (TTS-to-realtime, no mic)
    if (userName.trim()) {
      await handleTextToRealtime(`Thank you, ${userName}, for talking to us today on BUSK Radio!`);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  return (
    <Card>
      <CardContent>
        <AnimatePresence mode="wait">
          {callState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <p className="mb-4">
                {currentShow.type === "music"
                  ? "Get a personalized shoutout from our AI DJ!"
                  : "Call in to talk with our AI hosts live on air!"}
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                {currentShow.type === "music" ? "$1 for a personalized shoutout" : "$2 for a 1-minute conversation"}
              </p>
              <form className="space-y-4 max-w-xs mx-auto" onSubmit={e => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-800 text-white mb-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Your Location (e.g. Paris, France)"
                  value={userLocation}
                  onChange={e => setUserLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-800 text-white mb-4"
                  required
                />
                {currentShow.type === "music" ? (
                  <Button
                    size="lg"
                    className={cn("bg-gradient-to-r", currentShow.color, "hover:opacity-90 transition-opacity w-full")}
                    type="submit"
                    onClick={startCall}
                  >
                    <Phone className="mr-2 h-4 w-4" /> Request Shoutout
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className={cn("bg-gradient-to-r", currentShow.color, "hover:opacity-90 transition-opacity w-full")}
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <Phone className="mr-2 h-4 w-4" /> Start Call
                  </Button>
                )}
              </form>
            </motion.div>
          )}

          {callState === "queue" && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="w-16 h-16 rounded-full bg-zinc-700/50"
                  />
                </div>
                <Users className="h-12 w-12 mx-auto relative z-10 text-zinc-300" />
              </div>
              <p className="text-lg font-medium">You're in the queue</p>
              <p className="text-sm text-zinc-400 mt-2">Position: {queuePosition}</p>
              <p className="text-sm text-zinc-400 mt-1">Please wait for your turn</p>
              <Button variant="destructive" className="mt-6" onClick={endCall}>
                <PhoneOff className="mr-2 h-4 w-4" /> Leave Queue
              </Button>
            </motion.div>
          )}

          {callState === "calling" && (
            <motion.div
              key="calling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-zinc-300" />
              <p className="text-lg font-medium">
                {currentShow.type === "music" ? "Connecting to DJ..." : "Calling Talk Show..."}
              </p>
              <p className="text-sm text-zinc-400 mt-2">The line is ringing</p>
              <Button variant="destructive" className="mt-6" onClick={endCall}>
                <PhoneOff className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </motion.div>
          )}

          {callState === "connected" && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  className={cn(
                    "w-16 h-16 rounded-full absolute inset-0 m-auto opacity-50 blur-md",
                    `bg-gradient-to-r ${currentShow.color}`,
                  )}
                />
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                  className={cn("w-12 h-12 rounded-full", `bg-gradient-to-r ${currentShow.color}`)}
                />
              </div>
              <p className="text-lg font-medium">
                {currentShow.type === "music"
                  ? `Connected with DJ (${currentShow.voiceProfile})`
                  : `Connected with ${currentShow.host} (${currentShow.voiceProfile})`}
              </p>
              <p id="call-timer" className="text-sm text-zinc-400 mt-2">
                Call time: {formatTime(callTime)}
              </p>

              {currentShow.type === "talk" && callTime >= 55 && (
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  className="text-sm text-red-500 mt-1"
                >
                  Call ending soon...
                </motion.p>
              )}

              <Button variant="destructive" className="mt-6" onClick={endCall}>
                <PhoneOff className="mr-2 h-4 w-4" /> End Call
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="text-xs text-zinc-500 border-t border-zinc-800 p-4">
        <p>
          {currentShow.type === "music"
            ? "Your shoutout will be read by our AI DJ with the voice profile: " + currentShow.voiceProfile
            : "Your call will be handled by our AI hosts with voice profiles: Shimmer and Sage"}
        </p>
      </CardFooter>

      {/* Payment Modal for Call-In */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xs w-full">
            <h4 className="font-semibold mb-2">Select Call-In Duration</h4>
            <p className="mb-4 text-sm text-gray-600">$2 for 30s, $4 for 60s, $6 for 90s (max)</p>
            <div className="space-y-2 mb-4">
              {[30,60,90].map((d) => (
                <Button key={d} className="w-full justify-between" onClick={() => { setIsPaymentModalOpen(false); processCallAfterPayment(d); }}>
                  {d/30*2}$ - {d} seconds
                </Button>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
