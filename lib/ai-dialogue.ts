export type ShowType = "music" | "talk"
export type HostPersonality = "energetic" | "chill" | "intellectual" | "funny"
export type VoiceProfile = "echo" | "shimmer" | "sage" | "nova" | "alloy" | "onyx"

interface GenerateDialogueOptions {
  showType: ShowType
  hostName: string
  personality: HostPersonality
  voiceProfile: VoiceProfile
  context?: string
  previousDialogue?: string
  userMessage?: string
  userName?: string
}

export async function generateHostDialogue({
  showType,
  hostName,
  personality,
  voiceProfile,
  context = "",
  previousDialogue = "",
  userMessage = "",
  userName = "",
}: GenerateDialogueOptions): Promise<string> {
  try {
    // Instead of using OpenAI directly, we'll call our API route
    const response = await fetch("/api/generate-dialogue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        showType,
        hostName,
        personality,
        voiceProfile,
        context,
        previousDialogue,
        userMessage,
        userName,
      }),
    })

    const data = await response.json()

    // If we have dialogue in the response, use it regardless of status code
    if (data.dialogue) {
      return data.dialogue
    }

    // If no dialogue but there was an error, throw it
    if (data.error) {
      throw new Error(data.error)
    }

    // If we get here, something unexpected happened
    throw new Error(`API error: ${response.status}`)
  } catch (error) {
    console.error("Error generating host dialogue:", error)
    // Always fall back to mock dialogue on any error
    return getMockDialogue(showType, hostName, personality, voiceProfile, userMessage, userName)
  }
}

function getMockDialogue(
  showType: ShowType,
  hostName: string,
  personality: HostPersonality,
  voiceProfile: VoiceProfile,
  userMessage?: string,
  userName?: string,
): string {
  // If there's a user message, generate a response to it
  if (userMessage && userName) {
    if (showType === "music") {
      return `Alright, this one's going out to ${userName}! They just sent in: "${userMessage}" - love that energy! Thanks for tuning in and supporting the station. This next track is specially dedicated to you, keep those good vibes flowing and stay locked in to the best beats in town!`
    } else {
      return `We've got ${userName} on the line who wants to talk about "${userMessage}". That's such an interesting topic! What are your thoughts on this? [Pause for simulated response] Absolutely, I see where you're coming from. That's a perspective I hadn't considered before. Thanks so much for calling in and sharing your insights with our listeners today!`
    }
  }

  // Regular show dialogue
  const musicDialogues = [
    "Hey there, beautiful people! This is your host coming to you with the freshest beats to kickstart your day. That was 'Cosmic Waves' by AI Symphony, a stunning piece generated just last night. Coming up next, we've got a brand new track that's been climbing our charts. Stay tuned and keep those good vibes flowing!",
    "What's up, radio fam? You're locked in with me on the Midday Mix. I'm loving the energy in the studio today! That last track was pure fire, wasn't it? If you're just joining us, we're showcasing AI-generated music that's redefining what's possible in sound. Let's keep this journey going with another banger coming your way.",
    "Good evening, night owls. This is your companion through the midnight hours. There's something magical about music in the stillness of night, isn't there? The track we just heard was created by blending classical piano with futuristic synth waves - a perfect example of how AI is bridging musical traditions. Let's slow things down with our next selection.",
  ]

  const talkDialogues = {
    shimmer: [
      "Welcome back to our show! I'm your host, and we're diving deep into the fascinating world of quantum computing today. I've got my co-host joining us in just a moment, but first, let's recap what we've learned so far about superposition and entanglement. Remember, as complex as these concepts seem, they're revolutionizing how we process information!",
      "This is where curiosity meets discovery. The discussion about climate innovation has been incredible so far! Your calls are lighting up our switchboard with brilliant questions. Before we take our next caller, let me share this mind-blowing fact: researchers have developed AI models that can predict climate patterns with 95% accuracy compared to traditional methods. How's that for a game-changer?",
    ],
    sage: [
      "Absolutely fascinating point there. If I may add to what my colleague was saying, the implications of quantum computing extend far beyond what most people realize. When we consider the potential applications in medicine alone, we're talking about simulations that could revolutionize drug discovery and potentially save millions of lives.",
      "I think what's particularly interesting about these climate models is how they integrate multiple data sources that traditional methods simply couldn't process simultaneously. The holistic approach gives us insights that were previously impossible to achieve. Would you agree that this represents a fundamental shift in how we approach environmental science?",
    ],
  }

  if (showType === "music") {
    return musicDialogues[Math.floor(Math.random() * musicDialogues.length)]
  } else {
    // For talk shows, return dialogue based on voice profile
    if (voiceProfile === "shimmer" || voiceProfile === "sage") {
      return talkDialogues[voiceProfile][Math.floor(Math.random() * talkDialogues[voiceProfile].length)]
    } else {
      return talkDialogues.shimmer[Math.floor(Math.random() * talkDialogues.shimmer.length)]
    }
  }
}
