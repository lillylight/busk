import { getMultiHostDialogueService, AIHost } from './multi-host-dialogue';

export interface ConversationMode {
  type: 'ai-only' | 'user-interactive';
  webrtcActive: boolean;
}

export class HybridConversationManager {
  // TTS-related properties
  private audioContext: AudioContext | null = null;
  private audioQueue: Array<{ hostId: string; audioBuffer: AudioBuffer }> = [];
  private isPlaying: boolean = false;
  private currentMode: ConversationMode = { type: 'ai-only', webrtcActive: false };
  
  // WebRTC-related properties
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private webrtcAudioElement: HTMLAudioElement | null = null;
  private ephemeralKey: string = '';
  
  // Conversation state
  private activeHosts: AIHost[] = [];
  private conversationActive: boolean = false;
  private currentTopic: string = '';
  private currentSpeaker: string | null = null;
  private conversationLoop: NodeJS.Timeout | null = null;
  
  // Callbacks
  private onUpdate?: (update: any) => void;
  private onSpeakerChange?: (hostId: string) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Set callbacks
  setCallbacks(callbacks: {
    onUpdate?: (update: any) => void;
    onSpeakerChange?: (hostId: string) => void;
  }) {
    this.onUpdate = callbacks.onUpdate;
    this.onSpeakerChange = callbacks.onSpeakerChange;
  }

  // Start AI-only conversation using TTS
  async startConversation(hostIds: string[], topic: string) {
    this.currentTopic = topic;
    this.conversationActive = true;
    this.currentMode = { type: 'ai-only', webrtcActive: false };

    const dialogueService = getMultiHostDialogueService();
    const result = await dialogueService.startLiveConversation(hostIds, topic);
    this.activeHosts = result.hosts.filter(h => h !== undefined) as AIHost[];

    // Start the AI conversation loop with TTS
    this.startAIConversationLoop(result.currentSpeaker);

    return result;
  }

  // AI conversation loop using TTS
  private async startAIConversationLoop(startingSpeaker: string) {
    let currentSpeakerId = startingSpeaker;
    
    const conversationTick = async () => {
      if (!this.conversationActive || this.currentMode.type !== 'ai-only') {
        return;
      }

      try {
        const dialogueService = getMultiHostDialogueService();
        const turn = await dialogueService.generateNextTurn(currentSpeakerId);
        
        // Generate TTS audio
        await this.generateAndQueueTTS(turn.speaker, turn.message);
        
        // Update current speaker
        currentSpeakerId = turn.nextSpeaker;
        
        // Notify UI
        if (this.onUpdate) {
          this.onUpdate({
            type: 'ai_turn',
            speaker: turn.speaker,
            message: turn.message,
            nextSpeaker: turn.nextSpeaker
          });
        }
        
        // Schedule next turn after current audio finishes
        const speechDuration = this.estimateSpeechDuration(turn.message);
        const pauseDuration = Math.random() * 1500 + 1000; // 1-2.5 seconds
        
        this.conversationLoop = setTimeout(conversationTick, speechDuration + pauseDuration);
        
      } catch (error) {
        console.error('AI conversation error:', error);
        this.conversationLoop = setTimeout(conversationTick, 3000);
      }
    };

    // Start the loop
    conversationTick();
  }

  // Generate TTS and queue for playback
  private async generateAndQueueTTS(host: AIHost, message: string) {
    try {
      // Call TTS API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          voice: host.voice,
          speed: 1.0
        })
      });

      if (!response.ok) throw new Error('TTS generation failed');

      const audioData = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(audioData);
      
      // Queue the audio
      this.audioQueue.push({ hostId: host.id, audioBuffer });
      
      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
      
      // Update current speaker
      this.currentSpeaker = host.id;
      if (this.onSpeakerChange) {
        this.onSpeakerChange(host.id);
      }
      
    } catch (error) {
      console.error('TTS generation error:', error);
    }
  }

  // Play next audio in queue
  private async playNextInQueue() {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const { hostId, audioBuffer } = this.audioQueue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playNextInQueue();
    };
    
    source.start();
  }

  // Switch to WebRTC mode when user joins
  async switchToUserInteractiveMode(userName: string, userMessage: string) {
    // Stop AI-only conversation
    if (this.conversationLoop) {
      clearTimeout(this.conversationLoop);
      this.conversationLoop = null;
    }
    
    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;
    
    // Update mode
    this.currentMode = { type: 'user-interactive', webrtcActive: true };
    
    // Initialize WebRTC connection
    await this.initializeWebRTC();
    
    // Handle user joining
    await this.handleUserJoinWebRTC(userName, userMessage);
  }

  // Initialize WebRTC for user interaction
  private async initializeWebRTC() {
    // Get ephemeral key
    const tokenResponse = await fetch('/api/session', {
      method: 'GET',
    });
    const data = await tokenResponse.json();
    this.ephemeralKey = data.client_secret?.value || '';

    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Set up audio handling
    this.pc.ontrack = (event) => {
      this.webrtcAudioElement = document.createElement('audio');
      this.webrtcAudioElement.srcObject = event.streams[0];
      this.webrtcAudioElement.autoplay = true;
      document.body.appendChild(this.webrtcAudioElement);
    };

    // Create data channel
    this.dc = this.pc.createDataChannel('oai-events', {
      ordered: true,
    });

    this.dc.onopen = () => {
      this.configureWebRTCSession();
    };

    this.dc.onmessage = (event) => {
      this.handleWebRTCMessage(event.data);
    };

    // Add user microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => {
      this.pc!.addTrack(track, stream);
    });

    // Create offer and connect
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    const answer = await response.text();
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answer,
    });
  }

  // Configure WebRTC session for user interaction
  private configureWebRTCSession() {
    if (!this.dc || this.dc.readyState !== 'open') return;

    // Get current conversation context
    const dialogueService = getMultiHostDialogueService();
    const state = dialogueService.getConversationState();
    
    // Build context from conversation history
    const recentHistory = state.recentHistory.slice(-10).map(entry => 
      `${entry.speaker}: ${entry.message}`
    ).join('\n');

    const hostDescriptions = this.activeHosts.map(host => 
      `- ${host.name}: ${host.personality}`
    ).join('\n');

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: 'alloy', // Default voice for the moderator
        instructions: `You are moderating a live radio show discussion about "${this.currentTopic}".

The AI hosts in the conversation are:
${hostDescriptions}

Recent conversation:
${recentHistory}

A listener has joined the conversation. Your role is to:
1. Acknowledge the listener warmly
2. Relay their points to the AI hosts
3. Facilitate the discussion between the listener and the AI hosts
4. Keep the conversation flowing naturally
5. Summarize key points when needed

Be concise and natural. Act as a bridge between the listener and the AI hosts.`,
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }
    };

    this.dc.send(JSON.stringify(config));
  }

  // Handle user joining via WebRTC
  private async handleUserJoinWebRTC(userName: string, message: string) {
    if (!this.dc || this.dc.readyState !== 'open') return;

    // Get AI host responses to the user
    const dialogueService = getMultiHostDialogueService();
    const response = await dialogueService.userJoinDebate(userName, message);

    // Create a message that includes the user's input and AI responses
    const aiResponses = response.hostResponses.map(r => 
      `${r.speaker.name} responds: "${r.message}"`
    ).join('\n');

    const userJoinMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'text',
          text: `Listener ${userName} says: "${message}"

The AI hosts have these responses:
${aiResponses}

Please acknowledge ${userName} and facilitate this interaction, making it feel like a natural radio show conversation.`
        }]
      }
    };

    this.dc.send(JSON.stringify(userJoinMessage));

    // Request audio response
    this.dc.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
      }
    }));
  }

  // Handle WebRTC messages
  private handleWebRTCMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      if (this.onUpdate) {
        this.onUpdate({
          type: 'webrtc_message',
          data: message
        });
      }

      // When WebRTC response is done, we could switch back to AI-only mode
      if (message.type === 'response.done') {
        // Optionally switch back to AI conversation after a delay
        setTimeout(() => {
          if (this.currentMode.type === 'user-interactive') {
            // Could implement logic to return to AI-only mode
          }
        }, 5000);
      }

    } catch (error) {
      console.error('WebRTC message error:', error);
    }
  }

  // Estimate speech duration
  private estimateSpeechDuration(text: string): number {
    const words = text.split(' ').length;
    return (words / 150) * 60 * 1000; // 150 words per minute
  }

  // Stop conversation
  stop() {
    this.conversationActive = false;

    // Stop AI conversation loop
    if (this.conversationLoop) {
      clearTimeout(this.conversationLoop);
    }

    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;

    // Close WebRTC if active
    if (this.dc) {
      this.dc.close();
    }
    if (this.pc) {
      this.pc.close();
    }
    if (this.webrtcAudioElement) {
      this.webrtcAudioElement.pause();
      this.webrtcAudioElement.remove();
    }

    // Stop dialogue service
    const dialogueService = getMultiHostDialogueService();
    dialogueService.stopConversation();
  }

  // Get current state
  getState() {
    const dialogueService = getMultiHostDialogueService();
    return {
      ...dialogueService.getConversationState(),
      mode: this.currentMode,
      currentSpeaker: this.currentSpeaker,
      audioQueueLength: this.audioQueue.length,
      webrtcConnected: this.pc?.connectionState === 'connected'
    };
  }
}

// Singleton instance
let hybridManager: HybridConversationManager | null = null;

export function getHybridConversationManager(): HybridConversationManager {
  if (!hybridManager) {
    hybridManager = new HybridConversationManager();
  }
  return hybridManager;
}
