import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

export type ShowType = "music" | "talk"
export type HostPersonality = "energetic" | "chill" | "intellectual" | "funny"
export type VoiceProfile = "echo" | "shimmer" | "sage"

export async function POST(request: NextRequest) {
  try {
    const { showType, hostName, personality, voiceProfile, context, previousDialogue, userMessage, userName } =
      await request.json()

    if (!showType || !hostName || !personality || !voiceProfile) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Use mock dialogue if no API key or in development mode
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === "development") {
      console.log("Using mock dialogue (no API key or in development mode)")
      return NextResponse.json({
        dialogue: getMockDialogue(showType, hostName, personality, voiceProfile, userMessage, userName),
      })
    }

    try {
      // Initialize OpenAI client - this is safe because it's server-side code
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const prompt = createPromptForHost(
        showType,
        hostName,
        personality,
        voiceProfile,
        context || "",
        previousDialogue || "",
        userMessage || "",
        userName || "",
      )

      // Call OpenAI API with the updated model
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini as gpt-4o-mini-realtime-preview isn't directly available in the API
        messages: [
          {
            role: "system",
            content: `You are an AI radio host assistant. Generate natural, engaging radio dialogue for a ${personality} host named ${hostName} with voice profile ${voiceProfile}. Keep responses concise (1-2 paragraphs) and conversational.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      const dialogue = completion.choices[0]?.message?.content || ""

      if (!dialogue) {
        throw new Error("Empty response from OpenAI")
      }

      return NextResponse.json({ dialogue })
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)

      // Fallback to mock dialogue on OpenAI error
      return NextResponse.json({
        dialogue: getMockDialogue(showType, hostName, personality, voiceProfile, userMessage, userName),
      })
    }
  } catch (error) {
    console.error("Error in dialogue generation API:", error)

    // Always return a valid response, even on error
    return NextResponse.json({
      dialogue:
        "Hey listeners! We're experiencing some technical difficulties, but we'll be back shortly with more great content!",
      error: "Failed to generate dialogue",
    })
  }
}

function createPromptForHost(
  showType: ShowType,
  hostName: string,
  personality: HostPersonality,
  voiceProfile: VoiceProfile,
  context: string,
  previousDialogue: string,
  userMessage: string,
  userName: string,
): string {
  let prompt = `You are ${hostName}, an AI radio host with a ${personality} personality using the ${voiceProfile} voice profile. `

  if (showType === "music") {
    prompt +=
      "You are hosting a music show where you introduce songs, share interesting facts about music, and engage with listeners. "
  } else {
    prompt +=
      "You are hosting a talk show where you discuss interesting topics, share insights, and engage with listeners. "
  }

  prompt += `Current context: ${context}. `

  if (previousDialogue) {
    prompt += `Previous dialogue: ${previousDialogue}. `
  }

  if (userMessage && userName) {
    if (showType === "music") {
      prompt += `A listener named ${userName} has paid for a shoutout with this message: "${userMessage}". Create a natural, enthusiastic DJ shoutout that incorporates their message. `
    } else {
      prompt += `A listener named ${userName} has called in and wants to discuss: "${userMessage}". Respond to them in a conversational way as if they're on air with you. `
    }
  }

  prompt +=
    "Generate a short, engaging segment of radio dialogue (1-2 paragraphs) that sounds natural and conversational."

  return prompt
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
      return `Big shoutout to ${userName}! They just sent in: "${userMessage}". Love that energy! Thanks for tuning in and supporting the station. This next track is specially dedicated to you, keep those good vibes flowing and stay locked in to the best beats in town!`
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
