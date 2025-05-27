import { getMultiHostDialogueService } from './multi-host-dialogue';
import ttsService from './tts-service';

export interface ConversationTurn {
  hostId: string;
  message: string;
  voice: string;
  startTime: number;
  duration: number;
  isInterruption?: boolean;
  audioBuffer?: ArrayBuffer;
}

export class MultiHostConversationManager {
  private currentSpeaker: string | null = null;
  private speakingQueue: ConversationTurn[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private conversationPace: number = 1.5; // seconds between turns
  private interruptionThreshold: number = 0.3; // 30% chance of interruption
  private onSpeakerChange?: (hostId: string) => void;
  private onConversationUpdate?: (turn: ConversationTurn) => void;

  constructor() {
    // Initialize audio context only in browser environment
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Set callbacks
  setCallbacks(callbacks: {
    onSpeakerChange?: (hostId: string) => void;
    onConversationUpdate?: (turn: ConversationTurn) => void;
  }) {
    this.onSpeakerChange = callbacks.onSpeakerChange;
    this.onConversationUpdate = callbacks.onConversationUpdate;
  }

  // Start a multi-host conversation
  async startConversation(hostIds: string[], topic: string) {
    const dialogueService = getMultiHostDialogueService();
    const result = await dialogueService.startLiveConversation(hostIds, topic);
    
    // Start the conversation loop
    this.conversationLoop(result.currentSpeaker);
    
    return result;
  }

  // Main conversation loop
  private async conversationLoop(startingSpeaker: string) {
    let currentSpeakerId = startingSpeaker;
    
    while (this.isPlaying) {
      try {
        // Generate next turn
        const dialogueService = getMultiHostDialogueService();
        const turn = await dialogueService.generateNextTurn(currentSpeakerId);
        
        // Check for interruption possibility
        const shouldInterrupt = Math.random() < this.interruptionThreshold && this.speakingQueue.length > 0;
        
        if (shouldInterrupt && this.currentSpeaker) {
          // Handle interruption
          await this.handleInterruption(turn);
        } else {
          // Normal turn
          await this.queueTurn({
            hostId: turn.speaker.id,
            message: turn.message,
            voice: turn.speaker.voice,
            startTime: Date.now(),
            duration: this.estimateSpeechDuration(turn.message),
          });
        }
        
        // Wait for natural pause
        await this.waitForNaturalPause();
        
        // Set next speaker
        currentSpeakerId = turn.nextSpeaker;
        
      } catch (error) {
        console.error('Conversation loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Handle interruptions naturally
  private async handleInterruption(interruptingTurn: any) {
    // Find a natural breaking point (end of sentence/clause)
    const breakPoint = this.findNaturalBreakPoint();
    
    if (breakPoint) {
      // Queue the interruption with a slight overlap
      const interruptionTurn: ConversationTurn = {
        hostId: interruptingTurn.speaker.id,
        message: interruptingTurn.message,
        voice: interruptingTurn.speaker.voice,
        startTime: Date.now() + breakPoint.delay,
        duration: this.estimateSpeechDuration(interruptingTurn.message),
        isInterruption: true,
      };
      
      // Add verbal cue for interruption
      interruptionTurn.message = this.addInterruptionCue(interruptionTurn.message);
      
      await this.queueTurn(interruptionTurn);
    }
  }

  // Find natural breaking points in speech
  private findNaturalBreakPoint(): { delay: number } | null {
    if (!this.currentSource) return null;
    
    // Simulate finding end of sentence/thought
    const remainingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    return { delay: remainingTime };
  }

  // Add natural interruption cues
  private addInterruptionCue(message: string): string {
    const cues = [
      "Actually, if I may jump in here...",
      "Sorry to interrupt, but...",
      "That's interesting, and...",
      "Building on that point...",
      "I have to say...",
    ];
    
    const cue = cues[Math.floor(Math.random() * cues.length)];
    return `${cue} ${message}`;
  }

  // Queue a turn for playback
  private async queueTurn(turn: ConversationTurn) {
    // Generate TTS audio
    const audioData = await this.ttsService.generateSpeech(turn.message, turn.voice);
    turn.audioBuffer = audioData;
    
    // Add to queue
    this.speakingQueue.push(turn);
    
    // Notify listeners
    if (this.onConversationUpdate) {
      this.onConversationUpdate(turn);
    }
    
    // Start playback if not already playing
    if (!this.currentSpeaker) {
      this.playNextInQueue();
    }
  }

  // Play next audio in queue
  private async playNextInQueue() {
    if (this.speakingQueue.length === 0) {
      this.currentSpeaker = null;
      return;
    }
    
    const turn = this.speakingQueue.shift()!;
    this.currentSpeaker = turn.hostId;
    
    // Notify speaker change
    if (this.onSpeakerChange) {
      this.onSpeakerChange(turn.hostId);
    }
    
    // Play audio
    if (turn.audioBuffer) {
      await this.playAudio(turn.audioBuffer);
    }
    
    // Add natural pause between speakers
    await new Promise(resolve => setTimeout(resolve, this.conversationPace * 1000));
    
    // Play next
    this.playNextInQueue();
  }

  // Play audio buffer
  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve) => {
      const audioData = this.audioContext.decodeAudioData(audioBuffer);
      audioData.then(buffer => {
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer;
        this.currentSource.connect(this.audioContext.destination);
        this.currentSource.onended = () => {
          this.currentSource = null;
          resolve();
        };
        this.currentSource.start();
      });
    });
  }

  // Estimate speech duration based on text length
  private estimateSpeechDuration(text: string): number {
    // Average speaking rate: 150 words per minute
    const words = text.split(' ').length;
    return (words / 150) * 60 * 1000; // Convert to milliseconds
  }

  // Wait for natural pause in conversation
  private async waitForNaturalPause() {
    // Variable pause for natural flow
    const pauseDuration = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    await new Promise(resolve => setTimeout(resolve, pauseDuration));
  }

  // Handle user joining the conversation
  async handleUserJoin(userName: string, message: string) {
    const dialogueService = getMultiHostDialogueService();
    const response = await dialogueService.userJoinDebate(userName, message);
    
    // Queue host responses with natural timing
    for (let i = 0; i < response.hostResponses.length; i++) {
      const hostResponse = response.hostResponses[i];
      const delay = i * 2000; // Stagger responses
      
      setTimeout(() => {
        this.queueTurn({
          hostId: hostResponse.speaker.id,
          message: hostResponse.message,
          voice: hostResponse.speaker.voice,
          startTime: Date.now(),
          duration: this.estimateSpeechDuration(hostResponse.message),
        });
      }, delay);
    }
  }

  // Stop the conversation
  stop() {
    this.isPlaying = false;
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.speakingQueue = [];
    this.currentSpeaker = null;
    
    const dialogueService = getMultiHostDialogueService();
    dialogueService.stopConversation();
  }

  // Get current conversation state
  getState() {
    const dialogueService = getMultiHostDialogueService();
    return {
      ...dialogueService.getConversationState(),
      currentSpeaker: this.currentSpeaker,
      queueLength: this.speakingQueue.length,
    };
  }
}

// Singleton instance
let conversationManager: MultiHostConversationManager | null = null;

export function getConversationManager(): MultiHostConversationManager {
  if (!conversationManager) {
    conversationManager = new MultiHostConversationManager();
  }
  return conversationManager;
}
