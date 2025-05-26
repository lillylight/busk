/**
 * This utility provides functions to bridge the TTS service with the WebRTC client
 * It handles converting TTS audio output to a format that can be used as input
 * for the WebRTC client's real-time audio model.
 */

import { WebRTCClient } from './webrtc-client'

interface AudioProcessingOptions {
  // Voice profile to use for the WebRTC session
  voiceProfile?: string
  // Instructions for how the AI should respond
  instructions?: string
  // Model to use for real-time processing
  model?: string
}

export class TTSToWebRTC {
  private webrtcClient: WebRTCClient | null = null
  private audioContext: AudioContext | null = null
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null
  
  /**
   * Initialize the WebRTC client and audio processing components
   */
  async initialize(options: AudioProcessingOptions = {}): Promise<void> {
    try {
      // Create a new WebRTC client
      this.webrtcClient = new WebRTCClient()
      
      // Initialize the WebRTC client with the specified voice profile
      await this.webrtcClient.initialize(options.voiceProfile || 'echo')
      
      // Set up audio context for processing
      this.audioContext = new AudioContext()
      this.mediaStreamDestination = this.audioContext.createMediaStreamDestination()
      
      // If there are specific instructions or model, update the session
      if (options.instructions || options.model) {
        this.webrtcClient.sendMessage(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: options.instructions || "You're a hype futuristic DJ assistant. Respond in an upbeat tone.",
            model: options.model || "gpt-4o-mini-realtime-preview",
            voice: options.voiceProfile || 'echo'
          }
        }))
      }
      
      return Promise.resolve()
    } catch (error) {
      console.error('Failed to initialize TTS to WebRTC bridge:', error)
      return Promise.reject(error)
    }
  }
  
  /**
   * Process TTS audio and send it to the WebRTC client
   * @param audioElement The audio element containing the TTS output
   * @param contextText Optional context text to include with the audio
   */
  async processAudio(audioElement: HTMLAudioElement, contextText?: string): Promise<void> {
    if (!this.webrtcClient || !this.audioContext || !this.mediaStreamDestination) {
      throw new Error('TTS to WebRTC bridge not initialized')
    }
    
    try {
      // Create a media element source from the audio element
      const source = this.audioContext.createMediaElementSource(audioElement)
      
      // Connect the source to the media stream destination
      source.connect(this.mediaStreamDestination)
      
      // Get the media stream from the destination
      const mediaStream = this.mediaStreamDestination.stream
      
      // Add the audio track to the WebRTC client
      const audioTrack = mediaStream.getAudioTracks()[0]
      if (audioTrack) {
        // Create a new RTCPeerConnection to send the audio track
        const pc = new RTCPeerConnection()
        pc.addTrack(audioTrack, mediaStream)
        
        // Send the context text if provided
        if (contextText) {
          this.webrtcClient.sendMessage(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: contextText }]
            }
          }))
        }
        
        // Trigger a response from the AI
        this.webrtcClient.sendMessage(JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['audio']
          }
        }))
        
        // Play the audio
        await audioElement.play()
        
        // Set up event listener for when audio ends
        return new Promise((resolve) => {
          audioElement.onended = () => {
            // Clean up
            source.disconnect()
            pc.close()
            resolve()
          }
        })
      } else {
        throw new Error('No audio track found in TTS output')
      }
    } catch (error) {
      console.error('Error processing TTS audio:', error)
      throw error
    }
  }
  
  /**
   * Set up a callback for WebRTC messages
   * @param callback Function to call when a message is received
   */
  onMessage(callback: (message: any) => void): void {
    if (this.webrtcClient) {
      this.webrtcClient.onMessage(callback)
    }
  }
  
  /**
   * Set up a callback for WebRTC audio tracks
   * @param callback Function to call when an audio track is received
   */
  onTrack(callback: (event: RTCTrackEvent) => void): void {
    if (this.webrtcClient) {
      this.webrtcClient.onTrack(callback)
    }
  }
  
  /**
   * Close the WebRTC client and clean up resources
   */
  close(): void {
    if (this.webrtcClient) {
      this.webrtcClient.close()
      this.webrtcClient = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.mediaStreamDestination = null
  }
}

// Create a singleton instance
const ttsToWebRTC = new TTSToWebRTC()
export default ttsToWebRTC