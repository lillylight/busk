interface EphemeralKeyData {
  client_secret: {
    value: string;
    expires_at: number;
  };
  created_at: number;
  id: string;
  model: string;
  voice: string;
  modalities: string[];
  instructions?: string;
}

export class WebRTCClient {
  private pc: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private localStream: MediaStream | null = null
  private onTrackCallback: ((event: RTCTrackEvent) => void) | null = null
  private onMessageCallback: ((message: any) => void) | null = null
  private ephemeralKey: string | null = null
  private ephemeralKeyData: EphemeralKeyData | null = null
  private keyRefreshTimeout: NodeJS.Timeout | null = null
  private audioContext: AudioContext | null = null
  private vadWorklet: AudioWorkletNode | null = null
  private isSpeaking: boolean = false
  private silenceTimeout: NodeJS.Timeout | null = null
  private audioElement: HTMLAudioElement | null = null
  private mediaStream: MediaStream | null = null
  private sessionConfig: any = {}

  constructor() {
    this.pc = null
    this.dataChannel = null
    this.localStream = null
    this.ephemeralKey = null
    this.ephemeralKeyData = null
    this.audioContext = null
    this.vadWorklet = null
  }



  /**
   * Fetches a new ephemeral key from the server with optional session configuration
   * @param sessionConfig Optional configuration for the session
   * @returns The ephemeral key data
   */
  private async fetchEphemeralKey(sessionConfig: any = {}): Promise<EphemeralKeyData> {
    console.log('Fetching ephemeral key from server...');
    
    const response = await fetch("/api/get-ephemeral-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionConfig)
    });
    
    if (!response.ok) {
      console.error(`Failed to get ephemeral key: ${response.status}`);
      throw new Error(`Failed to get ephemeral key: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.client_secret || !data.client_secret.value) {
      console.error("Invalid response format from ephemeral key endpoint", data);
      throw new Error("Invalid response format from ephemeral key endpoint");
    }
    
    return data as EphemeralKeyData;
  }
  
  /**
   * Sets up automatic token refresh based on expiration time
   */
  private setupTokenRefresh(): void {
    if (this.keyRefreshTimeout) {
      clearTimeout(this.keyRefreshTimeout);
      this.keyRefreshTimeout = null;
    }
    
    if (!this.ephemeralKeyData || !this.ephemeralKeyData.client_secret.expires_at) {
      console.warn("Cannot setup token refresh: missing expiration data");
      return;
    }
    
    // Calculate time until expiration (in milliseconds)
    const expiresAt = this.ephemeralKeyData.client_secret.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh 30 seconds before expiration or immediately if already expired
    const refreshTime = Math.max(0, timeUntilExpiry - 30000);
    
    console.log(`Token expires in ${timeUntilExpiry/1000} seconds, scheduling refresh in ${refreshTime/1000} seconds`);
    
    this.keyRefreshTimeout = setTimeout(async () => {
      try {
        console.log("Refreshing ephemeral key...");
        await this.refreshConnection();
      } catch (error) {
        console.error("Failed to refresh ephemeral key:", error);
      }
    }, refreshTime);
  }
  
  /**
   * Refreshes the WebRTC connection with a new ephemeral key
   */
  async refreshConnection(): Promise<void> {
    try {
      // Close existing connection
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      
      if (this.dataChannel) {
        this.dataChannel.close();
        this.dataChannel = null;
      }
      
      // Get a new ephemeral key with the same session config
      await this.getEphemeralKey(this.sessionConfig);
      
      // Reinitialize the connection
      await this.setupConnection();
      
      console.log("Connection refreshed successfully");
    } catch (error) {
      console.error("Error refreshing connection:", error);
      throw error;
    }
  }
  
  /**
   * Gets an ephemeral key from the server and sets up token refresh
   */
  private async getEphemeralKey(sessionConfig: any = {}): Promise<void> {
    try {
      this.ephemeralKeyData = await this.fetchEphemeralKey(sessionConfig);
      this.ephemeralKey = this.ephemeralKeyData.client_secret.value;
      console.log('Ephemeral key obtained successfully');
      
      // Setup automatic token refresh
      this.setupTokenRefresh();
      
      if (!this.ephemeralKey) {
        console.error("Failed to get ephemeral key");
        throw new Error("Failed to get ephemeral key");
      }
    } catch (error) {
      console.error("Error getting ephemeral key:", error);
      throw error;
    }
  }
  
  /**
   * Sets up the WebRTC connection
   */
  private async setupConnection(): Promise<void> {
    try {
      // Create peer connection
      console.log('Creating RTCPeerConnection...');
      this.pc = new RTCPeerConnection()

      // Get local audio stream and set up VAD
      try {
        console.log('Requesting microphone access...');
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        console.log('Microphone access granted');

        // Initialize audio context and VAD processor using AudioWorklet
        this.audioContext = new AudioContext()
        const source = this.audioContext.createMediaStreamSource(this.localStream)
        
        // Load and initialize the AudioWorklet for voice activity detection
        try {
          console.log('Loading VAD processor...');
          await this.audioContext.audioWorklet.addModule('/vad-processor.js')
          this.vadWorklet = new AudioWorkletNode(this.audioContext, 'vad-processor')
          console.log('VAD processor loaded successfully');
          
          // Set up message handling from the worklet processor
          this.vadWorklet.port.onmessage = (event) => {
            const message = event.data
            
            if (message.type === 'vad.speaking.started' && !this.isSpeaking) {
              this.isSpeaking = true
              console.log('VAD detected speaking started');
            } else if (message.type === 'vad.speaking.stopped' && this.isSpeaking) {
              this.isSpeaking = false
              console.log('VAD detected speaking stopped');
            }
          }
          
          // Connect the audio processing chain
          source.connect(this.vadWorklet)
          this.vadWorklet.connect(this.audioContext.destination)
        } catch (error) {
          console.error('Failed to initialize AudioWorklet for VAD:', error)
        }
        
        // Add audio track to peer connection
        console.log('Adding audio track to peer connection...');
        this.pc.addTrack(this.localStream.getTracks()[0])
      } catch (err) {
        console.warn("No microphone access, continuing without local audio:", err)
      }

      // Handle incoming audio from the AI
      this.pc.ontrack = (event) => {
        console.log('Received audio track from server');
        if (this.onTrackCallback) {
          this.onTrackCallback(event);
        }
        
        // Set up audio playback for AI responses
        if (!this.audioElement) {
          this.audioElement = new Audio();
          this.audioElement.autoplay = true;
          this.audioElement.volume = 1.0;
          console.log('Created new audio element for playback');
        }
        
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        this.mediaStream = event.streams[0];
        if (!this.mediaStream) {
          console.error('No media stream available in track event');
          return;
        }
        
        try {
          this.audioElement.srcObject = this.mediaStream;
          console.log('Set media stream as audio element source');
          
          // Ensure audio starts playing
          this.audioElement.play().catch(error => {
            console.error('Failed to start audio playback:', error);
          });
        } catch (error) {
          console.error('Error setting up audio playback:', error);
        }
      };

      // Create data channel
      console.log('Creating data channel...');
      this.dataChannel = this.pc.createDataChannel("oai-events")

      this.dataChannel.onopen = () => {
        console.log('Data channel opened');
        // Send initial session instructions
        if (this.dataChannel) {
          const sessionMessage = JSON.stringify({
            type: "session.update",
            session: this.sessionConfig,
          });
          console.log('Sending session update:', sessionMessage);
          this.dataChannel.send(sessionMessage);
        }
      }

      this.dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('Received message from data channel:', message);

        // Handle different response types
        switch (message.type) {
          case 'session.created':
            console.log('Session created:', message);
            break;
          
          case 'session.updated':
            console.log('Session updated:', message);
            break;
          
          case 'response.audio.done':
            // Audio response completed
            console.log('Audio response completed:', message);
            break;
          
          case 'response.audio_transcript.delta':
            // Handle incremental transcript updates
            console.log('Received transcript delta:', message);
            break;
          
          case 'response.audio_transcript.done':
            // Transcript of audio response completed
            console.log('Audio transcript completed:', message);
            break;
          
          case 'response.content_part.done':
            // Content part response completed
            console.log('Content part completed:', message);
            break;
          
          case 'response.output_item.done':
            // Output item completed
            console.log('Output item completed:', message);
            break;
          
          case 'response.done':
            // Full response completed
            console.log('Response completed:', message);
            break;
          
          case 'error':
            // Handle server errors
            const errorDetails = message.error || message;
            if (errorDetails && typeof errorDetails === 'object' && Object.keys(errorDetails).length > 0) {
              console.error('Error from server:', errorDetails);
            } else if (typeof errorDetails === 'string' && errorDetails.trim().length > 0) {
              console.error('Error from server:', errorDetails);
            }
            
            // Propagate error to registered callback
            if (this.onMessageCallback) {
              this.onMessageCallback({
                type: 'error',
                error: errorDetails,
                timestamp: new Date().toISOString()
              });
            }
            break;
          
          default:
            // Log unhandled message types for debugging
            console.log('Unhandled message type:', message.type);
        }

        // Forward message to callback if registered
        if (this.onMessageCallback) {
          this.onMessageCallback(message)
        }
      }

      // Create and set local description
      console.log('Creating offer...');
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      // Wait for ICE gathering to complete
      console.log('Waiting for ICE gathering to complete...');
      await new Promise<void>((resolve) => {
        if (this.pc?.iceGatheringState === 'complete') {
          resolve()
        } else {
          this.pc?.addEventListener('icegatheringstatechange', () => {
            if (this.pc?.iceGatheringState === 'complete') {
              resolve()
            }
          })
        }
      })

      // Connect to OpenAI Realtime API
      console.log('Connecting to OpenAI Realtime API...');
      const baseUrl = "https://api.openai.com/v1/realtime"
      const model = this.sessionConfig.model || "gpt-4o-mini-realtime-preview"
      const response = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        body: this.pc?.localDescription?.sdp
      })

      if (!response.ok) {
        console.error(`Failed to connect to OpenAI API: ${response.status}`);
        throw new Error(`Failed to connect: ${response.status}`)
      }

      console.log('Received answer from OpenAI API');
      const answerSdp = await response.text()
      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp
      })

      // Set remote description without checking stable state
      console.log('Setting remote description...');
      await this.pc?.setRemoteDescription(answer)
      console.log('WebRTC connection established successfully');

      return Promise.resolve()
    } catch (error) {
      console.error("WebRTC initialization error:", error)
      return Promise.reject(error)
    }
  }

  /**
   * Initialize the WebRTC client with the specified voice profile and options
   * @param voiceProfile The voice profile to use
   * @param options Additional session configuration options
   */
  async initialize(voiceProfile = "echo", options: any = {}): Promise<void> {
    try {
      // Set up session configuration
      this.sessionConfig = {
        instructions: this.getInstructionsForVoice(voiceProfile),
        model: "gpt-4o-mini-realtime-preview",
        voice: voiceProfile,
        modalities: ["audio", "text"],
        ...options
      };
      
      // Get ephemeral key and set up token refresh
      await this.getEphemeralKey(this.sessionConfig);
      
      // Set up WebRTC connection
      await this.setupConnection();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize WebRTC client:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Updates the session configuration and refreshes the connection if needed
   * @param config New session configuration
   */
  async updateSession(config: any): Promise<void> {
    try {
      // Update session config
      this.sessionConfig = { ...this.sessionConfig, ...config };
      
      // If data channel is open, send update
      if (this.dataChannel?.readyState === 'open') {
        this.dataChannel.send(JSON.stringify({
          type: "session.update",
          session: this.sessionConfig
        }));
        return Promise.resolve();
      } else {
        // If not connected, refresh the connection with new config
        return this.refreshConnection();
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      return Promise.reject(error);
    }
  }
  
  private getInstructionsForVoice(voiceProfile: string): string {
    if (voiceProfile === "echo") {
      return "You are a charismatic male radio DJ for BUSK.Radio. Your voice is energetic, engaging, and professional. Introduce songs with enthusiasm and share interesting facts about music."
    } else if (voiceProfile === "shimmer") {
      return "You are a vibrant female radio DJ for BUSK.Radio. Your voice is warm, friendly, and energetic. Introduce songs with enthusiasm and share interesting facts about music."
    } else if (voiceProfile === "sage") {
      return "You are a thoughtful female radio DJ for BUSK.Radio. Your voice is calm, insightful, and engaging. Introduce songs with depth and share interesting facts about music."
    } else {
      return "You are a charismatic radio DJ for BUSK.Radio. Introduce songs with enthusiasm and share interesting facts about music."
    }
  }

  onTrack(callback: (event: RTCTrackEvent) => void): void {
    this.onTrackCallback = callback
  }

  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback
  }

  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(
        JSON.stringify({
          type: "message",
          content: message,
        }),
      )
    }
  }

  /**
   * Closes the WebRTC client and cleans up all resources
   */
  close(): void {
    // Clear token refresh timeout
    if (this.keyRefreshTimeout) {
      clearTimeout(this.keyRefreshTimeout);
      this.keyRefreshTimeout = null;
    }
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }
    
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    // Clean up VAD worklet
    if (this.vadWorklet) {
      this.vadWorklet.disconnect();
      this.vadWorklet = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Reset ephemeral key data
    this.ephemeralKey = null;
    this.ephemeralKeyData = null;
    
    console.log('WebRTC client closed and resources cleaned up');
  }
}
