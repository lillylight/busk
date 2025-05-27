import { getMultiHostDialogueService, AIHost } from './multi-host-dialogue';

export interface HostConnection {
  hostId: string;
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  voice: string;
  isActive: boolean;
  audioElement?: HTMLAudioElement;
}

export class MultiHostWebRTCManager {
  private hostConnections: Map<string, HostConnection> = new Map();
  private activeConversation: boolean = false;
  private conversationTopic: string = '';
  private currentSpeaker: string | null = null;
  private speakerQueue: string[] = [];
  private onSpeakerChange?: (hostId: string) => void;
  private onConversationUpdate?: (update: any) => void;
  private conversationInterval?: NodeJS.Timeout;

  constructor() {
    // Initialize in constructor
  }

  // Set callbacks
  setCallbacks(callbacks: {
    onSpeakerChange?: (hostId: string) => void;
    onConversationUpdate?: (update: any) => void;
  }) {
    this.onSpeakerChange = callbacks.onSpeakerChange;
    this.onConversationUpdate = callbacks.onConversationUpdate;
  }

  // Start a multi-host conversation
  async startConversation(hostIds: string[], topic: string) {
    this.conversationTopic = topic;
    this.activeConversation = true;

    const dialogueService = getMultiHostDialogueService();
    const result = await dialogueService.startLiveConversation(hostIds, topic);

    // Initialize WebRTC connections for each host
    for (const hostId of hostIds) {
      const host = result.hosts.find(h => h?.id === hostId);
      if (host) {
        await this.initializeHostConnection(host);
      }
    }

    // Start the conversation flow
    this.startConversationFlow(result.currentSpeaker);

    return result;
  }

  // Initialize WebRTC connection for a host
  private async initializeHostConnection(host: AIHost) {
    try {
      // Get ephemeral token for this host
      const tokenResponse = await fetch('/api/session', {
        method: 'GET',
      });
      const data = await tokenResponse.json();

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Set up audio handling
      pc.ontrack = (event) => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        
        const connection = this.hostConnections.get(host.id);
        if (connection) {
          connection.audioElement = audioElement;
        }
      };

      // Create data channel for controlling the conversation
      const dc = pc.createDataChannel('conversation', {
        ordered: true,
      });

      dc.onopen = () => {
        // Configure the AI host
        this.configureHost(host.id, host);
      };

      dc.onmessage = (event) => {
        this.handleHostMessage(host.id, event.data);
      };

      // Store connection
      this.hostConnections.set(host.id, {
        hostId: host.id,
        pc,
        dc,
        voice: host.voice,
        isActive: false,
      });

      // Create offer and establish connection
      await this.establishConnection(host.id, data.client_secret?.value || '');

    } catch (error) {
      console.error(`Error initializing host ${host.id}:`, error);
    }
  }

  // Establish WebRTC connection
  private async establishConnection(hostId: string, clientSecret: string) {
    const connection = this.hostConnections.get(hostId);
    if (!connection) return;

    const { pc } = connection;

    // Add local audio track
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer to OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    const answer = await response.text();
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: answer,
    });
  }

  // Configure AI host personality and voice
  private configureHost(hostId: string, host: AIHost) {
    const connection = this.hostConnections.get(hostId);
    if (!connection?.dc) return;

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: host.voice,
        instructions: `You are ${host.name}, a radio show host. ${host.personality}
        
You're in a live conversation about: ${this.conversationTopic}
        
Important rules:
- Keep responses concise (2-3 sentences max)
- Be natural and conversational
- Sometimes agree, sometimes respectfully disagree
- Reference what other hosts have said
- Stay in character
- Don't speak unless it's your turn`,
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

    connection.dc.send(JSON.stringify(config));
  }

  // Start conversation flow between hosts
  private startConversationFlow(startingSpeaker: string) {
    this.currentSpeaker = startingSpeaker;
    
    // Activate first speaker
    this.activateSpeaker(startingSpeaker);

    // Set up conversation turn management
    this.conversationInterval = setInterval(async () => {
      if (!this.activeConversation) return;

      try {
        const dialogueService = getMultiHostDialogueService();
        const state = dialogueService.getConversationState();
        
        // Check if we need to switch speakers
        if (state.currentSpeaker !== this.currentSpeaker) {
          this.switchSpeaker(state.currentSpeaker);
        }

      } catch (error) {
        console.error('Conversation flow error:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  // Activate a specific speaker
  private activateSpeaker(hostId: string) {
    // Deactivate all hosts
    this.hostConnections.forEach((connection, id) => {
      if (connection.dc && connection.dc.readyState === 'open') {
        connection.dc.send(JSON.stringify({
          type: 'input_audio_buffer.clear'
        }));
        connection.isActive = false;
      }
    });

    // Activate the current speaker
    const speakerConnection = this.hostConnections.get(hostId);
    if (speakerConnection?.dc && speakerConnection.dc.readyState === 'open') {
      speakerConnection.isActive = true;
      
      // Trigger the host to speak
      this.triggerHostSpeech(hostId);
      
      if (this.onSpeakerChange) {
        this.onSpeakerChange(hostId);
      }
    }

    this.currentSpeaker = hostId;
  }

  // Trigger a host to speak their next turn
  private async triggerHostSpeech(hostId: string) {
    const connection = this.hostConnections.get(hostId);
    if (!connection?.dc || connection.dc.readyState !== 'open') return;

    const dialogueService = getMultiHostDialogueService();
    const turn = await dialogueService.generateNextTurn(hostId);

    // Send the message for the host to speak
    connection.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: turn.message
        }]
      }
    }));

    // Request audio response
    connection.dc.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['audio'],
      }
    }));
  }

  // Switch to a new speaker
  private switchSpeaker(newSpeakerId: string) {
    if (newSpeakerId === this.currentSpeaker) return;
    
    // Add a natural pause before switching
    setTimeout(() => {
      this.activateSpeaker(newSpeakerId);
    }, 1500); // 1.5 second pause between speakers
  }

  // Handle messages from hosts
  private handleHostMessage(hostId: string, data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'response.audio.done') {
        // Host finished speaking, trigger next turn
        const dialogueService = getMultiHostDialogueService();
        const state = dialogueService.getConversationState();
        
        if (state.currentSpeaker !== this.currentSpeaker) {
          this.switchSpeaker(state.currentSpeaker);
        }
      }

      if (this.onConversationUpdate) {
        this.onConversationUpdate({
          hostId,
          messageType: message.type,
          data: message
        });
      }
    } catch (error) {
      console.error('Error handling host message:', error);
    }
  }

  // Handle user joining the conversation
  async handleUserJoin(userName: string, message: string) {
    const dialogueService = getMultiHostDialogueService();
    const response = await dialogueService.userJoinDebate(userName, message);

    // Queue responses from hosts
    for (const hostResponse of response.hostResponses) {
      this.speakerQueue.push(hostResponse.speaker.id);
    }

    // Start processing the queue
    this.processSpeakerQueue();
  }

  // Process speaker queue for user interactions
  private async processSpeakerQueue() {
    if (this.speakerQueue.length === 0) return;

    const nextSpeaker = this.speakerQueue.shift()!;
    this.activateSpeaker(nextSpeaker);

    // Continue processing after a delay
    setTimeout(() => {
      this.processSpeakerQueue();
    }, 3000); // 3 seconds per response
  }

  // Stop the conversation
  stop() {
    this.activeConversation = false;

    // Clear conversation interval
    if (this.conversationInterval) {
      clearInterval(this.conversationInterval);
    }

    // Close all connections
    this.hostConnections.forEach(connection => {
      if (connection.dc) {
        connection.dc.close();
      }
      if (connection.pc) {
        connection.pc.close();
      }
      if (connection.audioElement) {
        connection.audioElement.pause();
        connection.audioElement.srcObject = null;
      }
    });

    this.hostConnections.clear();

    // Stop dialogue service
    const dialogueService = getMultiHostDialogueService();
    dialogueService.stopConversation();
  }

  // Get current state
  getState() {
    const dialogueService = getMultiHostDialogueService();
    return {
      ...dialogueService.getConversationState(),
      currentSpeaker: this.currentSpeaker,
      activeConnections: Array.from(this.hostConnections.keys()),
      speakerQueueLength: this.speakerQueue.length,
    };
  }
}

// Singleton instance
let webrtcManager: MultiHostWebRTCManager | null = null;

export function getMultiHostWebRTCManager(): MultiHostWebRTCManager {
  if (!webrtcManager) {
    webrtcManager = new MultiHostWebRTCManager();
  }
  return webrtcManager;
}
