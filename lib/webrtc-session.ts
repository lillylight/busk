import { WebRTCClient } from './webrtc-client'

export interface SessionConfig {
  instructions: string
  voice: string
  model: string
}

export interface VADConfig {
  threshold: number
  silenceTimeout: number
}

export interface QueuedRequest {
  id: string
  type: 'shoutout' | 'callIn' | 'dedication' | 'request' | 'question' | 'topic' | 'debate'
  userName: string
  userLocation?: string
  message?: string
  timestamp: number
  status: 'pending' | 'processing' | 'completed'
}

// Helper: Get DJ instructions based on the show
function getDJInstructions(userName: string, userLocation: string, showName?: string, hostName?: string) {
  // Special instructions for One Eyed Goat
  if (hostName === "One Eyed Goat") {
    return `You are One Eyed Goat, the coolest late-night DJ on BUSK Radio. You have a laid-back, street-smart vibe with a deep voice. Use slang like "yo", "what's good", "fam", "that's dope", etc. Keep it real and conversational. The caller ${userName} from ${userLocation} is now live on air. Chat with them naturally, ask about their night, what they're up to, their favorite music, etc. Keep the energy chill but engaging.`;
  }
  
  // Default instructions for other DJs
  return `You are a friendly, upbeat radio DJ hosting BUSK Radio${showName ? `, currently presenting '${showName}'` : ''}. Welcome the caller warmly, greet them by name and location, and keep your tone friendly and professional. The caller ${userName} from ${userLocation} is now live on air. Have a natural conversation with them.`;
}

export class WebRTCSession {
  private client: WebRTCClient
  private vadConfig: VADConfig
  private sessionConfig: SessionConfig
  private callInTimer: NodeJS.Timeout | null = null
  private isInCallMode: boolean = false
  private ttsAudioElement: HTMLAudioElement | null = null
  private isSpeaking: boolean = false
  private callInTimeout: NodeJS.Timeout | null = null
  private callInActive: boolean = false
  private requestQueue: QueuedRequest[] = []
  private isProcessingQueue: boolean = false
  private currentRequestId: string | null = null

  constructor(vadConfig?: Partial<VADConfig>) {
    this.client = new WebRTCClient()
    this.vadConfig = {
      threshold: 0.01,
      silenceTimeout: 500,
      ...vadConfig
    }
    this.sessionConfig = {
      instructions: "You're a hype futuristic DJ assistant for Lady Light's AI Radio. Respond in an upbeat tone.",
      voice: "echo",
      model: "gpt-4o-mini-realtime-preview"
    }
  }

  /**
   * Add a request to the queue
   */
  addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'status'>): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      status: 'pending'
    }
    this.requestQueue.push(queuedRequest)
    
    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
    
    return id
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { position: number; total: number; currentRequest: QueuedRequest | null } {
    const currentIndex = this.currentRequestId 
      ? this.requestQueue.findIndex(r => r.id === this.currentRequestId)
      : -1
    
    return {
      position: currentIndex + 1,
      total: this.requestQueue.length,
      currentRequest: currentIndex >= 0 ? this.requestQueue[currentIndex] : null
    }
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.find(r => r.status === 'pending')
      if (!request) break

      this.currentRequestId = request.id
      request.status = 'processing'

      try {
        if (request.type === 'callIn') {
          // Parse duration and host info from message if available
          const parts = request.message?.split('|') || []
          const duration = parts[0] ? parseInt(parts[0]) : 30
          const showName = parts[1]
          const hostName = parts[2]
          await this.handleCallIn(request.userName, request.userLocation || '', this.sessionConfig.voice, showName, duration, hostName)
        } else if (request.type === 'shoutout') {
          await this.handleShoutout(request.userName, request.message || '')
        } else {
          // Handle other request types
          await this.handleTextRequest(request.type, request.userName, request.message || '')
        }

        request.status = 'completed'
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error)
        request.status = 'completed' // Mark as completed even on error to avoid stuck queue
      }

      // Remove completed request from queue
      this.requestQueue = this.requestQueue.filter(r => r.id !== request.id)
      this.currentRequestId = null

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    this.isProcessingQueue = false
  }

  /**
   * Converts text response to speech and plays it
   */
  private async convertResponseToSpeech(text: string): Promise<void> {
    if (!text) return;
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: this.sessionConfig.voice || 'echo',
          model: 'tts-1-hd', // Use HD model for better quality
          speed: 0.95, // Slightly slower for more natural speech
        }),
      });
      
      if (!response.ok) throw new Error('TTS API error');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      if (this.ttsAudioElement) {
        this.ttsAudioElement.pause()
        this.ttsAudioElement = null
      }
      
      this.ttsAudioElement = new Audio(audioUrl);
      this.ttsAudioElement.volume = 1.0;
      
      await this.ttsAudioElement.play();
      
      // Wait for audio to finish
      await new Promise<void>((resolve) => {
        if (this.ttsAudioElement) {
          this.ttsAudioElement.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
        }
      });
    } catch (error) {
      console.error('Failed to convert response to speech:', error);
    }
  }

  /**
   * Handle shoutout requests with TTS
   */
  private async handleShoutout(userName: string, message: string): Promise<void> {
    const shoutoutResponse = `Big shoutout to ${userName}! They say: "${message}". Thanks for tuning in to BUSK Radio and being part of our amazing community!`;
    await this.convertResponseToSpeech(shoutoutResponse);
  }

  /**
   * Handle other text-based requests
   */
  private async handleTextRequest(type: string, userName: string, message: string): Promise<void> {
    let response = '';
    
    switch (type) {
      case 'dedication':
        response = `We have a special song dedication from ${userName}. They say: "${message}". This one's for you!`;
        break;
      case 'request':
        response = `${userName} has requested a song. They say: "${message}". We'll see what we can do!`;
        break;
      case 'question':
        response = `Great question from ${userName}: "${message}". Let me address that for you.`;
        break;
      case 'topic':
        response = `${userName} suggests we discuss: "${message}". That's a fascinating topic!`;
        break;
      case 'debate':
        response = `${userName} wants to join the debate with: "${message}". Interesting perspective!`;
        break;
    }
    
    if (response) {
      await this.convertResponseToSpeech(response);
    }
  }

  /**
   * Handle call-in requests with real-time interaction
   */
  private async handleCallIn(userName: string, userLocation: string, voice: string, showName?: string, duration: number = 30, hostName?: string): Promise<void> {
    this.sessionConfig.voice = voice;
    this.sessionConfig.instructions = getDJInstructions(userName, userLocation, showName, hostName);
    this.sessionConfig.model = 'gpt-4o-mini-realtime-preview';
    this.callInActive = true;
    
    // First announce the caller to all listeners
    const announcementMessage = `Hold up, hold up! We've got a caller on the line. It's ${userName} calling in from ${userLocation}. Let's see what's on their mind!`;
    await this.convertResponseToSpeech(announcementMessage);
    
    // Now initialize WebRTC for real-time conversation
    await this.client.initialize(voice);
    await this.connect();
    
    // Greet the caller directly
    const greetingMessage = `Hey ${userName}, you're live on BUSK Radio! How's it going over there in ${userLocation}?`;
    
    // Send greeting through WebRTC for real-time interaction
    const messagePayload = JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'input_text', text: greetingMessage }]
      }
    });
    this.client.sendMessage(messagePayload);
    
    // Set up wrap-up timer (6 seconds before end)
    const wrapUpTime = (duration - 6) * 1000;
    setTimeout(async () => {
      if (this.callInActive) {
        const wrapUpMessage = `Alright ${userName}, we're about to wrap up here. Thanks so much for calling in to BUSK Radio! Take care and keep listening!`;
        
        // Send wrap-up through WebRTC
        const wrapUpPayload = JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'input_text', text: wrapUpMessage }]
          }
        });
        this.client.sendMessage(wrapUpPayload);
      }
    }, wrapUpTime);
    
    // Start the call-in timer
    this.callInTimeout = setTimeout(() => {
      this.endCallIn();
    }, duration * 1000);
  }

  /**
   * Start a call-in session (legacy method for compatibility)
   */
  async startCallIn(userName: string, userLocation: string, voice: string, showName?: string, duration: number = 30, hostName?: string) {
    const requestId = this.addToQueue({
      type: 'callIn',
      userName,
      userLocation,
      message: `${duration}|${showName || ''}|${hostName || ''}`
    });
    
    return requestId;
  }

  /**
   * End the call-in session
   */
  endCallIn() {
    this.callInActive = false;
    if (this.callInTimeout) {
      clearTimeout(this.callInTimeout);
      this.callInTimeout = null;
    }
    this.client.close();
  }

  /**
   * Handle shoutout or text requests (legacy method for compatibility)
   */
  async handleShoutoutOrText(text: string, userName?: string) {
    const requestId = this.addToQueue({
      type: 'shoutout',
      userName: userName || 'Anonymous',
      message: text
    });
    
    return requestId;
  }

  async connect(): Promise<void> {
    try {
      await this.client.initialize(this.sessionConfig.voice)
      this.client.onMessage((message) => {
        // Only process messages if call-in is active
        if (!this.callInActive) return;
        // Handle AI-to-user responses here if needed
      })
    } catch (error) {
      console.error('Failed to establish WebRTC session:', error)
    }
  }

  async triggerResponse(text?: string, isShoutout: boolean = false, isCallIn: boolean = false, userName?: string, userLocation?: string): Promise<void> {
    console.log('WebRTCSession: Triggering response with text:', text);
    console.log('WebRTCSession: isCallIn:', isCallIn, 'isShoutout:', isShoutout);
    
    // Add to queue based on type
    if (isCallIn && userName && userLocation) {
      this.addToQueue({
        type: 'callIn',
        userName,
        userLocation,
        message: text || ''
      });
    } else if (isShoutout && userName) {
      this.addToQueue({
        type: 'shoutout',
        userName,
        message: text || ''
      });
    }
    // Remove the else clause that was sending direct messages
  }

  disconnect(): void {
    if (this.callInTimer) {
      clearTimeout(this.callInTimer)
    }
    if (this.callInTimeout) {
      clearTimeout(this.callInTimeout)
    }
    if (this.ttsAudioElement) {
      this.ttsAudioElement.pause()
      this.ttsAudioElement = null
    }
    if (this.client) {
      this.client.close()
    }
    
    // Clear the queue
    this.requestQueue = []
    this.isProcessingQueue = false
    this.currentRequestId = null
  }
}
