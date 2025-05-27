import OpenAI from 'openai';

export interface AIHost {
  id: string;
  name: string;
  personality: string;
  voice: string;
  avatar?: string;
  specialties: string[];
}

export interface ConversationContext {
  topic: string;
  currentSpeaker: string;
  conversationHistory: Array<{
    speaker: string;
    message: string;
    timestamp: number;
  }>;
  userParticipants: Array<{
    name: string;
    joinedAt: number;
  }>;
}

export class MultiHostDialogueService {
  private openai: OpenAI;
  private hosts: Map<string, AIHost>;
  private conversationContext: ConversationContext;
  private isLive: boolean = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.hosts = new Map();
    this.conversationContext = {
      topic: '',
      currentSpeaker: '',
      conversationHistory: [],
      userParticipants: [],
    };
  }

  // Define available AI hosts
  initializeHosts() {
    const availableHosts: AIHost[] = [
      {
        id: 'alex',
        name: 'Alex Chen',
        personality: 'Thoughtful tech analyst, loves diving deep into topics, occasionally plays devil\'s advocate',
        voice: 'alloy',
        specialties: ['technology', 'future trends', 'AI ethics'],
      },
      {
        id: 'maya',
        name: 'Maya Rodriguez',
        personality: 'Energetic cultural commentator, brings humor and pop culture references, great at connecting ideas',
        voice: 'nova',
        specialties: ['culture', 'social trends', 'entertainment'],
      },
      {
        id: 'david',
        name: 'David Thompson',
        personality: 'Seasoned journalist, asks probing questions, values facts and balanced perspectives',
        voice: 'onyx',
        specialties: ['politics', 'economics', 'investigative reporting'],
      },
      {
        id: 'sarah',
        name: 'Sarah Kim',
        personality: 'Creative thinker, philosophical approach, loves exploring "what if" scenarios',
        voice: 'shimmer',
        specialties: ['philosophy', 'creativity', 'human behavior'],
      },
    ];

    availableHosts.forEach(host => {
      this.hosts.set(host.id, host);
    });
  }

  // Start a live conversation between hosts
  async startLiveConversation(hostIds: string[], topic: string) {
    this.isLive = true;
    this.conversationContext.topic = topic;
    this.conversationContext.conversationHistory = [];
    
    // Select first speaker randomly
    const firstSpeaker = hostIds[Math.floor(Math.random() * hostIds.length)];
    this.conversationContext.currentSpeaker = firstSpeaker;

    return {
      topic,
      hosts: hostIds.map(id => this.hosts.get(id)),
      currentSpeaker: firstSpeaker,
    };
  }

  // Generate next dialogue turn
  async generateNextTurn(hostId: string): Promise<{
    speaker: AIHost;
    message: string;
    nextSpeaker: string;
  }> {
    const host = this.hosts.get(hostId);
    if (!host) throw new Error('Host not found');

    const otherHosts = Array.from(this.hosts.values()).filter(h => h.id !== hostId);
    const recentHistory = this.conversationContext.conversationHistory.slice(-10);

    const systemPrompt = `You are ${host.name}, a radio show host with the following personality: ${host.personality}
    
Your specialties include: ${host.specialties.join(', ')}

Current topic: ${this.conversationContext.topic}

You're having a live conversation with other hosts. Be natural, engaging, and true to your personality. 
- Respond to what was just said
- Add your unique perspective
- Sometimes agree, sometimes respectfully disagree
- Ask questions to other hosts
- Keep responses concise (2-3 sentences max)
- Occasionally make references to current events or pop culture when relevant
- Be conversational and use natural speech patterns

Other hosts in the conversation: ${otherHosts.map(h => h.name).join(', ')}`;

    const conversationLog = recentHistory.map(entry => 
      `${entry.speaker}: ${entry.message}`
    ).join('\n');

    const userPrompt = `Recent conversation:
${conversationLog}

Now it's your turn to speak. Respond naturally and then indicate who should speak next by ending with "[Next: HostName]"`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content || '';
    
    // Extract next speaker
    const nextSpeakerMatch = response.match(/\[Next: (.+?)\]/);
    let nextSpeaker = '';
    let cleanMessage = response;

    if (nextSpeakerMatch) {
      const suggestedNext = nextSpeakerMatch[1];
      // Find the host by name
      const nextHost = Array.from(this.hosts.values()).find(
        h => h.name.toLowerCase().includes(suggestedNext.toLowerCase())
      );
      nextSpeaker = nextHost?.id || otherHosts[0].id;
      cleanMessage = response.replace(/\[Next: .+?\]/, '').trim();
    } else {
      // Random selection if not specified
      nextSpeaker = otherHosts[Math.floor(Math.random() * otherHosts.length)].id;
    }

    // Add to conversation history
    this.conversationContext.conversationHistory.push({
      speaker: host.name,
      message: cleanMessage,
      timestamp: Date.now(),
    });

    this.conversationContext.currentSpeaker = nextSpeaker;

    return {
      speaker: host,
      message: cleanMessage,
      nextSpeaker,
    };
  }

  // Handle user joining the conversation
  async userJoinDebate(userName: string, message: string): Promise<{
    hostResponses: Array<{
      speaker: AIHost;
      message: string;
    }>;
  }> {
    // Add user to participants
    this.conversationContext.userParticipants.push({
      name: userName,
      joinedAt: Date.now(),
    });

    // Add user message to history
    this.conversationContext.conversationHistory.push({
      speaker: userName,
      message,
      timestamp: Date.now(),
    });

    // Generate responses from 1-2 hosts
    const respondingHosts = Array.from(this.hosts.values())
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.random() > 0.5 ? 2 : 1);

    const responses = [];

    for (const host of respondingHosts) {
      const systemPrompt = `You are ${host.name}, a radio show host. A listener named ${userName} just joined the conversation with this message: "${message}"

Respond directly to them, acknowledging their point. Be welcoming but also engage with their ideas. Keep it concise (1-2 sentences).`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Respond to the listener.' }
        ],
        temperature: 0.8,
        max_tokens: 100,
      });

      const response = completion.choices[0].message.content || '';
      
      responses.push({
        speaker: host,
        message: response,
      });

      // Add to conversation history
      this.conversationContext.conversationHistory.push({
        speaker: host.name,
        message: response,
        timestamp: Date.now(),
      });
    }

    return { hostResponses: responses };
  }

  // Get current conversation state
  getConversationState() {
    return {
      isLive: this.isLive,
      topic: this.conversationContext.topic,
      currentSpeaker: this.conversationContext.currentSpeaker,
      participants: this.conversationContext.userParticipants,
      recentHistory: this.conversationContext.conversationHistory.slice(-20),
    };
  }

  // Stop the live conversation
  stopConversation() {
    this.isLive = false;
    this.conversationContext = {
      topic: '',
      currentSpeaker: '',
      conversationHistory: [],
      userParticipants: [],
    };
  }
}

// Singleton instance
let multiHostService: MultiHostDialogueService | null = null;

export function getMultiHostDialogueService(): MultiHostDialogueService {
  if (!multiHostService) {
    multiHostService = new MultiHostDialogueService();
    multiHostService.initializeHosts();
  }
  return multiHostService;
}
