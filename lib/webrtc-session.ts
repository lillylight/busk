import { WebRTCClient } from './webrtc-client'
import ttsToWebRTC from './tts-to-webrtc'

export interface SessionConfig {
  instructions: string
  voice: string
  model: string
}

export interface VADConfig {
  threshold: number
  silenceTimeout: number
}

// Helper: Get DJ instructions for chill Nigerian radio DJ
function getDJInstructions(userName: string, userLocation: string, showName?: string) {
  return `You are a chill, upbeat radio DJ from Nigeria, hosting BUSK Radio${showName ? `, currently presenting '${showName}'` : ''}. Welcome the caller warmly, greet them by name and location, and keep your tone friendly, relaxed, and cool. Use Nigerian English expressions and radio flair. Start with: 'Welcome to BUSK Radio, ${userName} from ${userLocation}! You're now live on ${showName ? showName : 'the show'}.'`;
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
  private callInActive: boolean = false;

  /**
   * Converts text response to speech and plays it through the WebRTC connection
   * @param text The text to convert to speech
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
          input: text,
          model: 'gpt-4o-mini-tts',
          voice: this.sessionConfig.voice || 'alloy',
          instructions: this.sessionConfig.instructions,
          response_format: 'mp3',
          speed: 1.0,
        }),
      });
      if (!response.ok) throw new Error('TTS API error');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      // Stream the TTS audio into WebRTC as if it were user speech
      await ttsToWebRTC.processAudio(audio);
      // Clean up
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Failed to convert response to speech:', error);
    }
  }

  /**
   * Start a call-in session with custom voice, instructions, and intro
   */
  /**
   * Starts a call-in session: enables mic, DJ greets, then waits for user to speak before further AI response.
   */
  async startCallIn(userName: string, userLocation: string, voice: string, showName?: string) {
    this.sessionConfig.voice = voice;
    this.sessionConfig.instructions = getDJInstructions(userName, userLocation, showName);
    this.sessionConfig.model = 'gpt-4o-mini-realtime-preview';
    this.callInActive = true;
    await this.client.initialize(voice);
    await this.connect();
    // Play the quick DJ intro
    await this.convertResponseToSpeech(`Hey ${userName}, welcome to the show!`);
    // At this point, the mic is live and the DJ will wait for user speech before responding further.
    // No further AI DJ speech until user input is detected (handled by VAD/semantic turn-taking in WebRTCClient).
    // Start the call-in timer (default 30s, can be adjusted)
    this.callInTimeout = setTimeout(() => {
      this.endCallIn();
    }, 30000);
  }

  /**
   * End the call-in session, cleaning up and stopping the AI
   */
  endCallIn() {
    this.callInActive = false;
    if (this.callInTimeout) {
      clearTimeout(this.callInTimeout);
      this.callInTimeout = null;
    }
    this.client.close();
  }

  // For shoutouts and text requests: always use TTS to stream to WebRTC
  async handleShoutoutOrText(text: string) {
    await this.convertResponseToSpeech(text);
  }

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

  async triggerResponse(text?: string, isShoutout: boolean = false, isCallIn: boolean = false): Promise<void> {
    if (!this.client) {
      console.error('WebRTCSession: Client not initialized');
      return;
    }
    console.log('WebRTCSession: Triggering response with text:', text);
    console.log('WebRTCSession: isCallIn:', isCallIn);
    if (isCallIn && !this.isInCallMode) {
      this.isInCallMode = true
      this.startCallInTimer()
    }
    const context = isShoutout ? 'shoutout' : isCallIn ? 'call-in' : 'regular'
    const baseText = text || ''
    const contextualText = isShoutout
      ? `[Shoutout] ${baseText}`
      : isCallIn
      ? `[Call-in] ${baseText}`
      : baseText
    // For call-ins and join debate, use direct WebRTC speech-to-speech
    if (isCallIn) {
      // VAD and speech-to-speech: just rely on the user's microphone audio stream
      // The WebRTC client is already set up to stream mic audio to the model
      // Optionally, update VAD config for best UX
      this.client.sendMessage(JSON.stringify({
        type: 'session.update',
        session: {
          turn_detection: {
            type: 'semantic_vad',
            eagerness: 'auto',
            create_response: true,
            interrupt_response: true
          }
        }
      }))
      // Optionally, update instructions for the session
      if (contextualText) {
        this.client.sendMessage(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: this.sessionConfig.instructions || "You're a hype futuristic DJ assistant for Lady Light's AI Radio. Respond in an upbeat tone."
          }
        }))
      }
      // No need to send a text message or TTS; user audio is streamed live
      return;
    }
    // For shoutouts, use TTS to convert text to audio, then stream to WebRTC as speech
    if (text && isShoutout) {
      await this.handleShoutoutOrText(contextualText);
      return;
    }
    // For regular messages, just send as text
    if (text && !isCallIn && !isShoutout) {
      const messagePayload = JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: contextualText }]
        }
      });
      this.client.sendMessage(messagePayload);
      const responsePayload = JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['audio']
        }
      });
      this.client.sendMessage(responsePayload);
    }
  }

  private startCallInTimer(): void {
    if (this.callInTimer) {
      clearTimeout(this.callInTimer)
    }

    this.callInTimer = setTimeout(() => {
      this.endCallIn()
    }, 30000) // 30 seconds
  }

  private endCallIn(): void {
    this.isInCallMode = false
    if (this.callInTimer) {
      clearTimeout(this.callInTimer)
      this.callInTimer = null
    }

    this.client.sendMessage(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text: '[Call-in session ended]' }]
      }
    }))
  }

  disconnect(): void {
    if (this.callInTimer) {
      clearTimeout(this.callInTimer)
    }
    if (this.ttsAudioElement) {
      this.ttsAudioElement.pause()
      this.ttsAudioElement = null
    }
    if (this.client) {
      this.client.close()
    }
    // Clean up the TTS-to-WebRTC bridge
    // ttsToWebRTC.close()
  }
}